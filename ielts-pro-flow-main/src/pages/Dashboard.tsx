import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button, Card, CardContent, Chip } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, FileText, Clock, CheckCircle2, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import shapesBg from "@/assets/shapes-bg.png";
import PaymentModal from "@/components/PaymentModal";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";

interface TestAttempt {
  id: string;
  attemptNumber: number;
  date: string;
  status: "completed" | "pending";
  scores?: {
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
    total: number;
  };
  cefr?: {
    overall: string;
    listening: string;
    reading: string;
    writing: string;
    speaking: string;
  };
  ielts?: {
    overall: string;
    listening: string;
    reading: string;
    writing: string;
    speaking: string;
  };
  certificateUrl?: string;
}

const scoreToCefr = (score: number): string => {
  if (score >= 86) return 'C2';
  if (score >= 71) return 'C1';
  if (score >= 51) return 'B2';
  if (score >= 41) return 'B1';
  if (score >= 21) return 'A2';
  if (score >= 11) return 'A1';
  return 'A0';
};

const scoreToIelts = (score: number): string => {
  if (score >= 86) return '9.0';
  if (score >= 81) return '8.0-8.5';
  if (score >= 71) return '7.0-7.5';
  if (score >= 61) return '6.5-7.0';
  if (score >= 51) return '6.0-6.5';
  if (score >= 41) return '5.0-5.5';
  if (score >= 31) return '4.0-4.5';
  if (score >= 21) return '3.0-3.5';
  if (score >= 11) return '1.5-2.5';
  return '0-1.0';
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [candidateName, setCandidateName] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasPaid, setHasPaid] = useState(false);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setCandidateName(profile.full_name);
      }

      // Fetch test attempts
      const { data: attempts } = await supabase
        .from("test_attempts")
        .select("*")
        .eq("user_id", session.user.id)
        .order("attempt_number", { ascending: false });

      if (attempts) {
        const formattedAttempts: TestAttempt[] = attempts.map(attempt => {
          // Calculate scores dynamically
          const listeningScore = Math.round(attempt.listening_score || 0);
          const readingScore = Math.round(attempt.reading_score || 0);
          const writingScore = Math.round(attempt.writing_score || 0);
          const speakingScore = Math.round(attempt.speaking_score || 0);
          const totalScore = Math.round((listeningScore + readingScore + writingScore + speakingScore) / 4);

          // Calculate CEFR levels from scores
          const listeningCefr = scoreToCefr(listeningScore);
          const readingCefr = scoreToCefr(readingScore);
          const writingCefr = scoreToCefr(writingScore);
          const speakingCefr = scoreToCefr(speakingScore);
          const overallCefr = scoreToCefr(totalScore);

          // Calculate IELTS bands from scores
          const listeningIelts = scoreToIelts(listeningScore);
          const readingIelts = scoreToIelts(readingScore);
          const writingIelts = scoreToIelts(writingScore);
          const speakingIelts = scoreToIelts(speakingScore);
          const overallIelts = scoreToIelts(totalScore);

          return {
            id: attempt.id,
            attemptNumber: attempt.attempt_number,
            date: attempt.test_date,
            status: attempt.status as "completed" | "pending",
            scores: attempt.status === "completed" ? {
              listening: listeningScore,
              reading: readingScore,
              writing: writingScore,
              speaking: speakingScore,
              total: totalScore,
            } : undefined,
            cefr: attempt.status === "completed" ? {
              overall: overallCefr,
              listening: listeningCefr,
              reading: readingCefr,
              writing: writingCefr,
              speaking: speakingCefr,
            } : undefined,
            ielts: attempt.status === "completed" ? {
              overall: overallIelts,
              listening: listeningIelts,
              reading: readingIelts,
              writing: writingIelts,
              speaking: speakingIelts,
            } : undefined,
            certificateUrl: attempt.status === "completed" ? `/certificate/${attempt.id}` : undefined,
          };
        });
        setTestAttempts(formattedAttempts);
      }

      try {
        const localPaid = localStorage.getItem('hasPaid') === 'true';
        if (localPaid) {
          setHasPaid(true);
        } else if (session?.user?.id) {
          const { data: payments } = await supabase
            .from("payment_transactions")
            .select("id")
            .eq("user_id", session.user.id)
            .in("status", ["success", "verified"]) 
            .limit(1);
          setHasPaid(Boolean(payments && payments.length > 0));
        } else {
          setHasPaid(false);
        }
      } catch {
        setHasPaid(localStorage.getItem('hasPaid') === 'true');
      }

      setLoading(false);
    };

    checkAuthAndLoadData();
  }, [navigate]);

  useEffect(() => {
    const state = location.state as { requirePayment?: boolean } | null;
    if (state?.requirePayment) {
      setShowPaymentModal(true);
    }
  }, [location.state]);

  const hasCompletedTest = testAttempts.some(attempt => attempt.status === "completed");

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleStartTest = () => {
    if (!hasPaid) {
      setShowPaymentModal(true);
    } else {
      navigate("/test");
    }
  };

  const handlePaymentSuccess = () => {
    setHasPaid(true);
    setShowPaymentModal(false);
    navigate("/test");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Shapes */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <img 
          src={shapesBg} 
          alt="" 
          className="absolute top-0 right-0 w-1/2 h-1/2 animate-float" 
        />
        <img 
          src={shapesBg} 
          alt="" 
          className="absolute bottom-0 left-0 w-1/2 h-1/2 animate-float" 
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            IELTS Pro
          </h1>
          <Button
            onClick={handleLogout}
            startIcon={<LogOut className="w-4 h-4" />}
            sx={{
              color: 'hsl(0, 84%, 60%)',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse text-xl text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <>
            {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-4xl font-bold mb-2">
            Welcome back, <span className="text-primary">{candidateName}</span>!
          </h2>
          <p className="text-xl text-muted-foreground">
            {hasCompletedTest 
              ? "Ready to improve your score? Take another test!"
              : "Get started with your first IELTS test"}
          </p>
        </motion.div>

        {/* Test Action Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <Card
            sx={{
              background: 'linear-gradient(135deg, hsl(217, 91%, 35%) 0%, hsl(187, 85%, 43%) 50%, hsl(14, 100%, 63%) 100%)',
              borderRadius: '20px',
              border: 'none',
              boxShadow: '0 8px 32px -8px hsl(217, 91%, 35% / 0.4)',
            }}
          >
            <CardContent sx={{ padding: '3rem' }}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-white">
                  <h3 className="text-3xl font-bold mb-2">
                    {hasCompletedTest ? "Ready for Your Next Test?" : "Start Your IELTS Test"}
                  </h3>
                  <p className="text-white/90 text-lg">
                    {hasCompletedTest 
                      ? "Continue your journey to excellence"
                      : "Begin your comprehensive IELTS evaluation"}
                  </p>
                </div>
                <Button
                  onClick={handleStartTest}
                  variant="contained"
                  size="large"
                  startIcon={hasCompletedTest ? <RotateCcw className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  sx={{
                    backgroundColor: 'white',
                    color: 'hsl(217, 91%, 35%)',
                    padding: '14px 40px',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    textTransform: 'none',
                    minWidth: '200px',
                    '&:hover': {
                      backgroundColor: 'white',
                      transform: 'scale(1.05)',
                    }
                  }}
                >
                  {hasCompletedTest ? "Reattempt Test" : "Start Test"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Test History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Test History
          </h3>

          {testAttempts.length > 0 ? (
            <div className="grid gap-6">
              {testAttempts.map((attempt, index) => (
                <motion.div
                  key={attempt.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card
                    sx={{
                      borderRadius: '16px',
                      border: '1px solid hsl(var(--border))',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 24px -4px hsl(217, 91%, 35% / 0.15)',
                        transform: 'translateY(-4px)',
                      }
                    }}
                  >
                    <CardContent sx={{ padding: '2rem' }}>
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <h4 className="text-xl font-bold">Attempt #{attempt.attemptNumber}</h4>
                            <Chip
                              label={attempt.status === "completed" ? "Completed" : "Pending"}
                              icon={attempt.status === "completed" ? 
                                <CheckCircle2 className="w-4 h-4" /> : 
                                <Clock className="w-4 h-4" />
                              }
                              sx={{
                                backgroundColor: attempt.status === "completed" ? 
                                  'hsl(142, 71%, 45% / 0.15)' : 'hsl(38, 92%, 50% / 0.15)',
                                color: attempt.status === "completed" ? 
                                  'hsl(142, 71%, 45%)' : 'hsl(38, 92%, 50%)',
                                fontWeight: 600,
                              }}
                            />
                          </div>
                          
                          <p className="text-muted-foreground mb-4">
                            Date: {new Date(attempt.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>

                          {attempt.scores && attempt.cefr && (
                            <div className="space-y-4">
                              {/* Overall Score - Prominent Display */}
                              <div className="bg-primary/10 rounded-lg p-4 text-center border-2 border-primary/20">
                                <div className="text-3xl font-bold text-primary mb-1">
                                  {attempt.scores.total}/100
                                </div>
                                <div className="text-lg font-bold text-primary">{attempt.cefr.overall}</div>
                                <div className="text-xs text-muted-foreground">Overall Score</div>
                              </div>

                              {/* Individual Section Scores - Match Certificate Format */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-secondary/10 rounded-lg p-3 text-center">
                                  <div className="text-2xl font-bold text-foreground mb-1">
                                    {attempt.scores.reading}
                                  </div>
                                  <div className="text-sm font-bold text-secondary">{attempt.cefr.reading}</div>
                                  <div className="text-xs text-muted-foreground mt-1">Reading</div>
                                </div>
                                <div className="bg-secondary/10 rounded-lg p-3 text-center">
                                  <div className="text-2xl font-bold text-foreground mb-1">
                                    {attempt.scores.listening}
                                  </div>
                                  <div className="text-sm font-bold text-secondary">{attempt.cefr.listening}</div>
                                  <div className="text-xs text-muted-foreground mt-1">Listening</div>
                                </div>
                                <div className="bg-secondary/10 rounded-lg p-3 text-center">
                                  <div className="text-2xl font-bold text-foreground mb-1">
                                    {attempt.scores.writing}
                                  </div>
                                  <div className="text-sm font-bold text-secondary">{attempt.cefr.writing}</div>
                                  <div className="text-xs text-muted-foreground mt-1">Writing</div>
                                </div>
                                <div className="bg-secondary/10 rounded-lg p-3 text-center">
                                  <div className="text-2xl font-bold text-foreground mb-1">
                                    {attempt.scores.speaking}
                                  </div>
                                  <div className="text-sm font-bold text-secondary">{attempt.cefr.speaking}</div>
                                  <div className="text-xs text-muted-foreground mt-1">Speaking</div>
                                </div>
                              </div>

                              {/* IELTS Bands - Secondary Information */}
                              {attempt.ielts && (
                                <div className="pt-2 border-t border-border">
                                  <div className="text-xs text-muted-foreground mb-2 text-center">IELTS Band Equivalent</div>
                                  <div className="grid grid-cols-5 gap-2">
                                    <div className="text-center">
                                      <div className="text-sm font-bold text-accent">{attempt.ielts.overall}</div>
                                      <div className="text-xs text-muted-foreground">Overall</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs font-semibold text-foreground">{attempt.ielts.reading}</div>
                                      <div className="text-xs text-muted-foreground">Reading</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs font-semibold text-foreground">{attempt.ielts.listening}</div>
                                      <div className="text-xs text-muted-foreground">Listening</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs font-semibold text-foreground">{attempt.ielts.writing}</div>
                                      <div className="text-xs text-muted-foreground">Writing</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs font-semibold text-foreground">{attempt.ielts.speaking}</div>
                                      <div className="text-xs text-muted-foreground">Speaking</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {attempt.certificateUrl && (
                          <div className="flex items-center">
                            <Button
                              onClick={() => navigate(attempt.certificateUrl)}
                              variant="outlined"
                              sx={{
                                borderColor: 'hsl(217, 91%, 35%)',
                                color: 'hsl(217, 91%, 35%)',
                                padding: '10px 24px',
                                fontWeight: 600,
                                borderRadius: '10px',
                                textTransform: 'none',
                                borderWidth: 2,
                                '&:hover': {
                                  borderWidth: 2,
                                  borderColor: 'hsl(217, 91%, 40%)',
                                  backgroundColor: 'hsl(217, 91%, 35% / 0.05)',
                                }
                              }}
                            >
                              View Certificate
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card sx={{ borderRadius: '16px', border: '1px solid hsl(var(--border))' }}>
              <CardContent sx={{ padding: '3rem', textAlign: 'center' }}>
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-xl text-muted-foreground">No test history yet</p>
                <p className="text-muted-foreground mt-2">Start your first test to see your results here</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </>
    )}
      </main>

      <PaymentModal 
        open={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default Dashboard;
