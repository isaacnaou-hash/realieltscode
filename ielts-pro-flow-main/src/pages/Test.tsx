import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button, Card, CardContent, LinearProgress, Radio, RadioGroup, FormControlLabel, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Clock, BookOpen, Headphones, Mic, PenTool, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Question {
  id: string;
  section: "listening" | "reading" | "writing" | "speaking";
  question: string;
  type: "multiple-choice" | "text";
  options?: string[];
}

const Test = () => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState<"listening" | "reading" | "writing" | "speaking">("listening");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes in seconds
  
  // Speaking section states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(60);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const readingEssay = `The Paradox of Progress: Technology and the Erosion of Human Autonomy

In the modern era, technological progress has become both the engine of civilization and the architect of its paradoxes. Humanity, in its pursuit of efficiency and innovation, has created systems so complex that they now transcend individual comprehension. Artificial intelligence, automation, and digital networks have promised liberation from monotony, yet they have simultaneously eroded the very autonomy they were meant to enhance. When algorithms curate our knowledge, predict our desires, and optimize our decisions, the boundaries of human agency blur. The paradox lies in the fact that by outsourcing cognition to machines, we may be surrendering the intellectual independence that once defined our species.

Culturally, this transformation has generated a profound reconfiguration of identity and meaning. The digital sphere, once heralded as a democratizing force, has evolved into an ecosystem of manipulation and surveillance. Individuals curate online personas that conform to algorithmic incentives, mistaking visibility for authenticity. The collective psyche, overwhelmed by the velocity of information, oscillates between hyper-connectivity and existential alienation. In this context, truth becomes fluid, shaped by engagement metrics rather than empirical evidence. Thus, while technology ostensibly amplifies the human voice, it simultaneously fragments the shared narratives that sustain social cohesion.

Yet, to demonize progress would be as naïve as to glorify it. The challenge of the twenty-first century lies not in halting technological evolution but in cultivating ethical frameworks capable of guiding it. The preservation of autonomy demands more than regulatory oversight—it requires a cultural renaissance that reaffirms the intrinsic value of human judgment, empathy, and reflection. Only by acknowledging the limitations of algorithmic reasoning and re-centering humanity within its own creations can progress become a vessel for liberation rather than subjugation. The future, therefore, will depend less on how advanced our machines become and more on how wisely we choose to coexist with them.`;

  // Mock questions - Replace with actual test questions
  const questions: Question[] = [
    // Listening Section - Short Answer
    {
      id: "L1",
      section: "listening",
      question: "What main idea does the essay express about technological progress and human morality?",
      type: "text",
    },
    {
      id: "L2",
      section: "listening",
      question: "What does the author say humanity has lost in its pursuit of innovation and efficiency?",
      type: "text",
    },
    // Listening Section - Multiple Choice
    {
      id: "L3",
      section: "listening",
      question: "According to the essay, what problem has come with the spread of digital technology?",
      type: "multiple-choice",
      options: [
        "A) It has reduced the amount of available information",
        "B) It has created confusion about truth and wisdom",
        "C) It has stopped people from working efficiently",
        "D) It has made communication impossible"
      ],
    },
    {
      id: "L4",
      section: "listening",
      question: "What does the \"machine\" symbolize in the essay?",
      type: "multiple-choice",
      options: [
        "A) The power of nature",
        "B) Human creativity",
        "C) The control of technology over human life",
        "D) The balance between innovation and morality"
      ],
    },
    {
      id: "L5",
      section: "listening",
      question: "What is the main message of the final paragraph?",
      type: "multiple-choice",
      options: [
        "A) Humanity should stop using technology completely",
        "B) People must find balance between progress and self-awareness",
        "C) Machines are more intelligent than humans",
        "D) Efficiency is the highest form of progress"
      ],
    },
    // Reading section questions
    {
      id: "r1",
      section: "reading",
      question: "According to the essay, what is the main paradox of technological progress?",
      type: "multiple-choice",
      options: [
        "Technology increases equality while reducing innovation.",
        "Technology promises liberation but may reduce human autonomy.",
        "Technology improves communication but destroys privacy.",
        "Technology advances slowly compared to human evolution."
      ],
    },
    {
      id: "r2",
      section: "reading",
      question: "Explain how the outsourcing of human cognition to machines can blur the boundaries of human agency.",
      type: "text",
    },
    {
      id: "r3",
      section: "reading",
      question: "What does the essay suggest about the role of algorithms in shaping modern identity?",
      type: "multiple-choice",
      options: [
        "They enhance creativity and independence.",
        "They restrict self-expression and encourage conformity.",
        "They have no influence on human identity.",
        "They eliminate the need for social media platforms."
      ],
    },
    {
      id: "r4",
      section: "reading",
      question: "In what way does the essay claim that truth has become \"fluid\" in the digital age?",
      type: "text",
    },
    {
      id: "r5",
      section: "reading",
      question: "Which of the following best describes the author's attitude toward technological progress?",
      type: "multiple-choice",
      options: [
        "Entirely optimistic",
        "Entirely pessimistic",
        "Balanced and cautious",
        "Indifferent"
      ],
    },
    {
      id: "r6",
      section: "reading",
      question: "What does the essay identify as the cultural cost of living in a hyper-connected world?",
      type: "text",
    },
    {
      id: "r7",
      section: "reading",
      question: "Why does the essay argue that halting technological progress is not a realistic solution?",
      type: "multiple-choice",
      options: [
        "Because technology is controlled entirely by corporations",
        "Because humanity is inherently dependent on machines",
        "Because progress is inevitable and must be ethically guided",
        "Because stopping progress would harm the economy"
      ],
    },
    {
      id: "r8",
      section: "reading",
      question: "What ethical or philosophical change does the author suggest is needed to preserve human autonomy in the age of AI?",
      type: "text",
    },
    {
      id: "r9",
      section: "reading",
      question: "According to the essay, how can humanity ensure that technology becomes a \"vessel for liberation rather than subjugation\"?",
      type: "multiple-choice",
      options: [
        "By limiting internet access",
        "By creating ethical frameworks and reaffirming human judgment",
        "By destroying all AI systems",
        "By allowing machines to self-regulate"
      ],
    },
    {
      id: "r10",
      section: "reading",
      question: "Summarize the essay's final argument about the relationship between human wisdom and artificial intelligence.",
      type: "text",
    },
    {
      id: "w1",
      section: "writing",
      question: "Discuss how rapid advancements in artificial intelligence could reshape global economic systems, and evaluate whether governments are prepared to manage the resulting ethical and social challenges. (200 characters minimum)",
      type: "text",
    },
    {
      id: "w2",
      section: "writing",
      question: "Should nations prioritize environmental sustainability over economic growth in the 21st century? Defend your position with global and local implications. (150 characters minimum)",
      type: "text",
    },
    {
      id: "S1",
      section: "speaking",
      question: 'Topic: "Should artificial intelligence be allowed to make decisions that affect human lives?" - You have 1 minute to record your response.',
      type: "text",
    },
  ];

  const sectionQuestions = questions.filter(q => q.section === currentSection);
  const currentQuestion = sectionQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / sectionQuestions.length) * 100;

  useEffect(() => {
    const checkPayment = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      const { data: payments } = await supabase
        .from("payment_transactions")
        .select("id")
        .eq("user_id", session.user.id)
        .in("status", ["success", "verified"]) 
        .limit(1);
      if (!payments || payments.length === 0) {
        toast.error("Please complete payment first");
        navigate("/dashboard", { state: { requirePayment: true } });
      }
    };
    checkPayment();
  }, [navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Recording countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording && recordingTime > 0) {
      timer = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, recordingTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(60);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Please allow microphone access to record your response.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Mark the speaking question as answered
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: 'recorded' }));
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < sectionQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Move to next section or complete test
      const sections: Array<"listening" | "reading" | "writing" | "speaking"> = ["listening", "reading", "writing", "speaking"];
      const currentIndex = sections.indexOf(currentSection);
      if (currentIndex < sections.length - 1) {
        setCurrentSection(sections[currentIndex + 1]);
        setCurrentQuestionIndex(0);
        toast.success(`${currentSection} section completed!`);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      toast.loading("Submitting and grading your test...");
      
      // Upload audio if speaking section is complete
      let audioUrl = '';
      if (audioBlob && currentSection === 'speaking') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const fileName = `${user.id}/${Date.now()}.webm`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('speaking-recordings')
          .upload(fileName, audioBlob);

        if (uploadError) throw uploadError;
        audioUrl = fileName;
      }

      // Organize answers by section
      const organizedAnswers = {
        listening: {},
        reading: {},
        writing: {},
        speaking: 'recorded'
      };

      Object.entries(answers).forEach(([key, value]) => {
        if (key.startsWith('L')) organizedAnswers.listening[key] = value;
        else if (key.startsWith('r')) organizedAnswers.reading[key] = value;
        else if (key.startsWith('w')) organizedAnswers.writing[key] = value;
      });

      // Call grading function
      const { data: gradingResult, error: gradingError } = await supabase.functions.invoke('grade-test', {
        body: { answers: organizedAnswers, audioUrl }
      });

      if (gradingError) throw gradingError;

      toast.dismiss(); // Dismiss loading toast
      toast.success("Test submitted and graded successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting test:", error);
      toast.dismiss(); // Dismiss loading toast on error
      toast.error("Failed to submit test. Please try again.");
      setIsSubmitting(false);
    }
  };

  const getSectionIcon = () => {
    switch (currentSection) {
      case "listening": return <Headphones className="w-6 h-6" />;
      case "reading": return <BookOpen className="w-6 h-6" />;
      case "writing": return <PenTool className="w-6 h-6" />;
      case "speaking": return <Mic className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Timer */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-primary">
                {getSectionIcon()}
                <span className="font-bold text-lg capitalize">{currentSection} Section</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-lg">
                <Clock className="w-5 h-5 text-warning" />
                <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
              </div>
              
              <Button
                onClick={handleSubmit}
                variant="outlined"
                sx={{
                  borderColor: 'hsl(0, 84%, 60%)',
                  color: 'hsl(0, 84%, 60%)',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: 'hsl(0, 84%, 60%)',
                    backgroundColor: 'hsl(0, 84%, 60% / 0.1)',
                  }
                }}
              >
                Submit Test
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-muted-foreground">
              Question {currentQuestionIndex + 1} of {sectionQuestions.length}
            </span>
            <span className="text-sm font-semibold text-primary">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <LinearProgress 
            variant="determinate" 
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'hsl(var(--muted))',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, hsl(217, 91%, 35%) 0%, hsl(217, 91%, 60%) 100%)',
                borderRadius: 4,
              }
            }}
          />
        </motion.div>

        {/* Listening Audio - Always visible during listening section */}
        {currentSection === "listening" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card sx={{ borderRadius: '20px', border: '1px solid hsl(var(--border))' }}>
              <CardContent sx={{ padding: '3rem' }}>
                <h2 className="text-2xl font-bold mb-6 text-primary flex items-center gap-2">
                  <Headphones className="w-6 h-6" />
                  Listening Comprehension
                </h2>
                <p className="text-muted-foreground mb-4">Listen carefully to the audio essay and answer the questions below.</p>
                <div className="bg-muted/50 rounded-lg p-6">
                  <audio controls className="w-full">
                    <source src="/listening-audio.mp3" type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Reading Essay - Always visible during reading section */}
        {currentSection === "reading" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card sx={{ borderRadius: '20px', border: '1px solid hsl(var(--border))' }}>
              <CardContent sx={{ padding: '3rem' }}>
                <h2 className="text-2xl font-bold mb-6 text-primary">Reading Comprehension</h2>
                <div className="prose prose-lg max-w-none">
                  <p className="whitespace-pre-line text-foreground leading-relaxed">
                    {readingEssay}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Question Card */}
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <Card sx={{ borderRadius: '20px', border: '1px solid hsl(var(--border))' }}>
            <CardContent sx={{ padding: '3rem' }}>
              <h2 className="text-2xl font-bold mb-6">{currentQuestion.question}</h2>

              {currentQuestion.type === "multiple-choice" && currentQuestion.options ? (
                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswer(e.target.value)}
                >
                  {currentQuestion.options.map((option, index) => (
                    <FormControlLabel
                      key={index}
                      value={option}
                      control={
                        <Radio 
                          sx={{
                            color: 'hsl(217, 91%, 35%)',
                            '&.Mui-checked': {
                              color: 'hsl(217, 91%, 35%)',
                            }
                          }}
                        />
                      }
                      label={option}
                      sx={{
                        margin: '8px 0',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '2px solid',
                        borderColor: answers[currentQuestion.id] === option ? 
                          'hsl(217, 91%, 35%)' : 'hsl(var(--border))',
                        backgroundColor: answers[currentQuestion.id] === option ? 
                          'hsl(217, 91%, 35% / 0.05)' : 'transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: 'hsl(217, 91%, 35%)',
                          backgroundColor: 'hsl(217, 91%, 35% / 0.03)',
                        }
                      }}
                    />
                  ))}
                </RadioGroup>
              ) : currentSection === "speaking" ? (
                <div className="mt-6 space-y-4">
                  <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mic className={`w-6 h-6 ${isRecording ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} />
                        <span className="font-semibold text-lg">
                          {isRecording ? 'Recording...' : audioBlob ? 'Recording Complete' : 'Ready to Record'}
                        </span>
                      </div>
                      <div className={`text-3xl font-bold tabular-nums ${recordingTime <= 10 && isRecording ? 'text-destructive' : 'text-primary'}`}>
                        {recordingTime}s
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {!isRecording && !audioBlob && (
                        <Button
                          onClick={startRecording}
                          variant="contained"
                          fullWidth
                          sx={{
                            backgroundColor: 'hsl(217, 91%, 35%)',
                            '&:hover': {
                              backgroundColor: 'hsl(217, 91%, 45%)',
                            },
                            padding: '12px',
                            fontSize: '16px',
                            textTransform: 'none',
                            fontWeight: 600,
                          }}
                        >
                          <Play className="w-5 h-5 mr-2" />
                          Start Recording
                        </Button>
                      )}
                      
                      {isRecording && (
                        <Button
                          onClick={stopRecording}
                          variant="contained"
                          fullWidth
                          sx={{
                            backgroundColor: 'hsl(0, 84%, 60%)',
                            '&:hover': {
                              backgroundColor: 'hsl(0, 84%, 50%)',
                            },
                            padding: '12px',
                            fontSize: '16px',
                            textTransform: 'none',
                            fontWeight: 600,
                          }}
                        >
                          <Square className="w-5 h-5 mr-2" />
                          Stop Recording
                        </Button>
                      )}

                      {audioBlob && (
                        <>
                          <audio controls className="flex-1">
                            <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
                          </audio>
                          <Button
                            onClick={() => {
                              setAudioBlob(null);
                              setRecordingTime(60);
                            }}
                            variant="outlined"
                            sx={{
                              borderColor: 'hsl(217, 91%, 35%)',
                              color: 'hsl(217, 91%, 35%)',
                              '&:hover': {
                                borderColor: 'hsl(217, 91%, 35%)',
                                backgroundColor: 'hsl(217, 91%, 35% / 0.1)',
                              },
                              textTransform: 'none',
                              fontWeight: 600,
                            }}
                          >
                            Record Again
                          </Button>
                        </>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground text-center">
                      Click "Start Recording" to begin. You have 60 seconds to respond to the topic.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <TextField
                    fullWidth
                    multiline
                    rows={10}
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                      }
                    }}
                  />
                  {currentSection === "writing" && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <span className={
                        (currentQuestion.id === "w1" && (answers[currentQuestion.id]?.length || 0) < 200) ||
                        (currentQuestion.id === "w2" && (answers[currentQuestion.id]?.length || 0) < 150)
                          ? "text-warning font-semibold"
                          : "text-success"
                      }>
                        {answers[currentQuestion.id]?.length || 0} characters
                      </span>
                      {" / "}
                      {currentQuestion.id === "w1" ? "200 minimum" : "150 minimum"}
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end mt-8">
                <Button
                  onClick={handleNext}
                  variant="contained"
                  size="large"
                  disabled={
                    isSubmitting ||
                    !answers[currentQuestion.id] ||
                    (currentSection === "writing" && currentQuestion.id === "w1" && (answers[currentQuestion.id]?.length || 0) < 200) ||
                    (currentSection === "writing" && currentQuestion.id === "w2" && (answers[currentQuestion.id]?.length || 0) < 150)
                  }
                  sx={{
                    background: 'linear-gradient(135deg, hsl(217, 91%, 35%) 0%, hsl(217, 91%, 60%) 100%)',
                    color: 'white',
                    padding: '12px 40px',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: '12px',
                    textTransform: 'none',
                    '&:hover': {
                      background: 'linear-gradient(135deg, hsl(217, 91%, 40%) 0%, hsl(217, 91%, 65%) 100%)',
                    },
                    '&:disabled': {
                      background: 'hsl(215, 16%, 47%)',
                      color: 'white',
                    }
                  }}
                >
                  {currentQuestionIndex < sectionQuestions.length - 1 ? "Next Question" : 
                   currentSection === "speaking" ? "Complete & Submit Test" : "Next Section"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Test;
