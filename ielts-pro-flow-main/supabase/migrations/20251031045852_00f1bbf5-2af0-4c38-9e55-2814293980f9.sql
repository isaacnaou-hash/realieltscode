-- Create table for test questions with correct answers
CREATE TABLE public.test_questions (
  id TEXT NOT NULL PRIMARY KEY,
  section TEXT NOT NULL CHECK (section IN ('listening', 'reading', 'writing', 'speaking')),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple-choice', 'text')),
  options JSONB,
  correct_answer TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read questions (for taking tests)
CREATE POLICY "Anyone can view questions"
ON public.test_questions
FOR SELECT
USING (true);

-- Only admins can modify questions (for now, no one can - will need admin role later)
CREATE POLICY "Only admins can insert questions"
ON public.test_questions
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Only admins can update questions"
ON public.test_questions
FOR UPDATE
USING (false);

CREATE POLICY "Only admins can delete questions"
ON public.test_questions
FOR DELETE
USING (false);

-- Add trigger for updated_at
CREATE TRIGGER update_test_questions_updated_at
BEFORE UPDATE ON public.test_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert reading comprehension questions with answers
INSERT INTO public.test_questions (id, section, question_text, question_type, options, correct_answer, points) VALUES
('r1', 'reading', 'According to the essay, what is the main paradox of technological progress?', 'multiple-choice', 
 '["Technology increases equality while reducing innovation.", "Technology promises liberation but may reduce human autonomy.", "Technology improves communication but destroys privacy.", "Technology advances slowly compared to human evolution."]'::jsonb,
 'Technology promises liberation but may reduce human autonomy.', 1),

('r2', 'reading', 'Explain how the outsourcing of human cognition to machines can blur the boundaries of human agency.', 'text',
 NULL,
 'When humans rely on machines and algorithms to make decisions or interpret information, they surrender part of their cognitive independence. This weakens critical thinking and makes actions increasingly shaped by automated systems rather than conscious human choice.', 2),

('r3', 'reading', 'What does the essay suggest about the role of algorithms in shaping modern identity?', 'multiple-choice',
 '["They enhance creativity and independence.", "They restrict self-expression and encourage conformity.", "They have no influence on human identity.", "They eliminate the need for social media platforms."]'::jsonb,
 'They restrict self-expression and encourage conformity.', 1),

('r4', 'reading', 'In what way does the essay claim that truth has become "fluid" in the digital age?', 'text',
 NULL,
 'Truth has become "fluid" because online algorithms prioritize engagement and popularity over accuracy. As a result, what is seen as "true" depends on visibility, not factual evidence.', 2),

('r5', 'reading', 'Which of the following best describes the author''s attitude toward technological progress?', 'multiple-choice',
 '["Entirely optimistic", "Entirely pessimistic", "Balanced and cautious", "Indifferent"]'::jsonb,
 'Balanced and cautious', 1),

('r6', 'reading', 'What does the essay identify as the cultural cost of living in a hyper-connected world?', 'text',
 NULL,
 'The cultural cost is a loss of authenticity and meaningful human connection. Constant connectivity leads to emotional exhaustion, superficial identities, and social fragmentation.', 2),

('r7', 'reading', 'Why does the essay argue that halting technological progress is not a realistic solution?', 'multiple-choice',
 '["Because technology is controlled entirely by corporations", "Because humanity is inherently dependent on machines", "Because progress is inevitable and must be ethically guided", "Because stopping progress would harm the economy"]'::jsonb,
 'Because progress is inevitable and must be ethically guided', 1),

('r8', 'reading', 'What ethical or philosophical change does the author suggest is needed to preserve human autonomy in the age of AI?', 'text',
 NULL,
 'The author calls for ethical frameworks rooted in empathy, reflection, and human judgment. Society must re-center moral reasoning to ensure technology serves humanity''s higher values.', 2),

('r9', 'reading', 'According to the essay, how can humanity ensure that technology becomes a "vessel for liberation rather than subjugation"?', 'multiple-choice',
 '["By limiting internet access", "By creating ethical frameworks and reaffirming human judgment", "By destroying all AI systems", "By allowing machines to self-regulate"]'::jsonb,
 'By creating ethical frameworks and reaffirming human judgment', 1),

('r10', 'reading', 'Summarize the essay''s final argument about the relationship between human wisdom and artificial intelligence.', 'text',
 NULL,
 'The essay concludes that human wisdom will shape the future more than AI itself. While machines can process data, they lack moral understanding; therefore, ethical human guidance is essential for coexistence.', 2);