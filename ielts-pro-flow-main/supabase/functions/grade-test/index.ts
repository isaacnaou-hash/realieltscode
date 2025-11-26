import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestAnswers {
  listening: Record<string, string>;
  reading: Record<string, string>;
  writing: Record<string, string>;
  speaking: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { answers, audioUrl }: { answers: TestAnswers; audioUrl: string } = await req.json();

    console.log('Grading test for user:', user.id);

    // Fetch questions from database
    const { data: questions, error: questionsError } = await supabase
      .from('test_questions')
      .select('*');

    if (questionsError) throw questionsError;

    // Grade listening section (out of 100)
    const listeningScore = gradeObjectiveSection(answers.listening, questions.filter(q => q.section === 'listening'), 100);
    console.log('Listening score:', listeningScore);

    // Grade reading section (out of 100)
    const readingScore = gradeObjectiveSection(answers.reading, questions.filter(q => q.section === 'reading'), 100);
    console.log('Reading score:', readingScore);

    // Grade writing section using AI (out of 100)
    const writingScore = await gradeWritingSection(answers.writing, questions.filter(q => q.section === 'writing'));
    console.log('Writing score:', writingScore);

    // Grade speaking section using AI (out of 100)
    const speakingScore = await gradeSpeakingSection(answers.speaking, audioUrl);
    console.log('Speaking score:', speakingScore);

    // Get CEFR levels for each section (all now use 100 scale)
    const { data: listeningCEFR } = await supabase.rpc('get_cefr_level', {
      score: listeningScore
    });

    const { data: readingCEFR } = await supabase.rpc('get_cefr_level', {
      score: readingScore
    });

    const { data: writingCEFR } = await supabase.rpc('get_cefr_level', {
      score: writingScore
    });

    const { data: speakingCEFR } = await supabase.rpc('get_cefr_level', {
      score: speakingScore
    });

    // Calculate overall CEFR
    const { data: overallCEFR } = await supabase.rpc('calculate_overall_cefr', {
      listening_score: listeningScore,
      reading_score: readingScore,
      writing_score: writingScore,
      speaking_score: speakingScore
    });

    // Get attempt number
    const { data: existingAttempts } = await supabase
      .from('test_attempts')
      .select('attempt_number')
      .eq('user_id', user.id)
      .order('attempt_number', { ascending: false })
      .limit(1);

    const attemptNumber = existingAttempts && existingAttempts.length > 0 
      ? existingAttempts[0].attempt_number + 1 
      : 1;

    // Save test attempt
    const { data: testAttempt, error: attemptError } = await supabase
      .from('test_attempts')
      .insert({
        user_id: user.id,
        attempt_number: attemptNumber,
        listening_score: listeningScore,
        reading_score: readingScore,
        writing_score: writingScore,
        speaking_score: speakingScore,
        overall_score: (listeningScore + readingScore + writingScore + speakingScore) / 4,
        listening_cefr: listeningCEFR?.[0]?.cefr_level,
        listening_ielts_band: listeningCEFR?.[0]?.ielts_band,
        reading_cefr: readingCEFR?.[0]?.cefr_level,
        reading_ielts_band: readingCEFR?.[0]?.ielts_band,
        writing_cefr: writingCEFR?.[0]?.cefr_level,
        writing_ielts_band: writingCEFR?.[0]?.ielts_band,
        speaking_cefr: speakingCEFR?.[0]?.cefr_level,
        speaking_ielts_band: speakingCEFR?.[0]?.ielts_band,
        overall_cefr: overallCEFR?.[0]?.overall_cefr,
        overall_ielts_band: overallCEFR?.[0]?.overall_ielts_band,
        status: 'completed',
        answers: answers
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    // Generate certificate
    const certificateId = `CERT-${user.id.substring(0, 8).toUpperCase()}-${attemptNumber}`;
    
    const { error: certError } = await supabase
      .from('certificates')
      .insert({
        user_id: user.id,
        test_attempt_id: testAttempt.id,
        certificate_id: certificateId
      });

    if (certError) throw certError;

    return new Response(
      JSON.stringify({
        success: true,
        testAttemptId: testAttempt.id,
        certificateId,
        scores: {
          listening: listeningScore,
          reading: readingScore,
          writing: writingScore,
          speaking: speakingScore
        },
        cefr: {
          listening: listeningCEFR?.[0]?.cefr_level,
          reading: readingCEFR?.[0]?.cefr_level,
          writing: writingCEFR?.[0]?.cefr_level,
          speaking: speakingCEFR?.[0]?.cefr_level,
          overall: overallCEFR?.[0]?.overall_cefr
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error grading test:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

function gradeObjectiveSection(answers: Record<string, string>, questions: any[], maxScore: number = 100): number {
  let totalPoints = 0;
  let earnedPoints = 0;
  
  // Calculate total possible points
  for (const question of questions) {
    totalPoints += question.points;
  }
  
  // Calculate earned points
  for (const question of questions) {
    const userAnswer = answers[question.id];
    if (!userAnswer) continue;

    if (question.question_type === 'multiple-choice') {
      if (userAnswer === question.correct_answer) {
        earnedPoints += question.points;
      }
    } else if (question.question_type === 'text') {
      const similarity = calculateTextSimilarity(userAnswer, question.correct_answer);
      if (similarity > 0.6) {
        earnedPoints += question.points;
      } else if (similarity > 0.4) {
        earnedPoints += question.points * 0.5;
      }
    }
  }

  // Convert to 0-100 scale
  return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * maxScore) : 0;
}

function calculateTextSimilarity(text1: string, text2: string): number {
  const normalize = (str: string) => str.toLowerCase().trim().replace(/[^\w\s]/g, '');
  const n1 = normalize(text1);
  const n2 = normalize(text2);

  if (n1 === n2) return 1.0;

  const words1 = new Set(n1.split(/\s+/));
  const words2 = new Set(n2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

async function gradeWritingSection(answers: Record<string, string>, questions: any[]): Promise<number> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
  
  let totalPoints = 0;
  let earnedPoints = 0;

  for (const question of questions) {
    totalPoints += question.points;
    const userAnswer = answers[question.id];
    if (!userAnswer) continue;

    const prompt = `You are an expert IELTS writing examiner. Grade the following essay response on a scale of 0-${question.points} points.

Question: ${question.question_text}

Student's Answer: ${userAnswer}

Grading Criteria:
- Task Response (how well they address the question)
- Coherence and Cohesion (logical flow and organization)
- Lexical Resource (vocabulary range and accuracy)
- Grammatical Range and Accuracy

Expected traits of a high-scoring answer:
- Clear position and well-developed arguments
- Logical structure with appropriate paragraphing
- Wide range of vocabulary used accurately
- Complex sentence structures with minimal errors
- Minimum length requirements met

Respond with ONLY a JSON object in this exact format:
{"score": <number between 0 and ${question.points}>, "feedback": "<brief feedback>"}`;

    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lovableApiKey}`
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        })
      });

      const data = await response.json();
      let content = data.choices[0].message.content;
      
      // Strip markdown code blocks if present
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const parsed = JSON.parse(content);
      earnedPoints += parsed.score;

      console.log(`Writing question ${question.id} score:`, parsed.score);
    } catch (error) {
      console.error('Error grading writing question:', error);
      earnedPoints += question.points * 0.5;
    }
  }

  // Convert to 0-100 scale
  return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
}

async function gradeSpeakingSection(recordingText: string, audioUrl: string): Promise<number> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

  const prompt = `You are an expert IELTS speaking examiner. Grade this 1-minute speaking response on the topic: "Should artificial intelligence be allowed to make decisions that affect human lives?"

The student's recording transcription or notes: ${recordingText}

Grade based on these 5 criteria (20 marks each, total 100 marks):
1. Content relevance (0-20): Addresses the question directly; stays on topic
2. Structure & organization (0-20): Clear intro, main point(s), and conclusion
3. Depth of thought (0-20): Shows awareness of complexity, balance, or ethical reasoning
4. Fluency & coherence (0-20): Smooth flow, logical connections
5. Language use (0-20): Vocabulary, grammar, and confidence

Expected answer traits:
- Balanced view (AI should assist but not have full control)
- Concrete examples (healthcare, criminal justice)
- Clear reasoning about accountability and ethics
- Well-structured with introduction and conclusion

Respond with ONLY a JSON object in this exact format:
{
  "total_score": <number between 0 and 100>,
  "breakdown": {
    "content_relevance": <0-20>,
    "structure_organization": <0-20>,
    "depth_of_thought": <0-20>,
    "fluency_coherence": <0-20>,
    "language_use": <0-20>
  },
  "feedback": "<brief feedback>"
}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Strip markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(content);

    console.log('Speaking score breakdown:', parsed.breakdown);
    return Math.round(parsed.total_score);
  } catch (error) {
    console.error('Error grading speaking:', error);
    return 50; // Default to 50/100
  }
}
