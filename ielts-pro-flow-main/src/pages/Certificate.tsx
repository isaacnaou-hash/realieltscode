import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@mui/material";
import { Download, ArrowLeft, Share2, Check, Headphones, BookOpen, Pencil, MessageSquare } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CertificateData {
  candidateName: string;
  testDate: string;
  certificateId: string;
  totalScore: number;
  cefr: {
    overall: string;
    listening: string;
    reading: string;
    writing: string;
    speaking: string;
  };
  scores: {
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
  };
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

const getScoreRange = (score: number): string => {
  if (score >= 86) return '86-100';
  if (score >= 71) return '71-85';
  if (score >= 51) return '51-70';
  if (score >= 41) return '41-50';
  if (score >= 21) return '21-40';
  if (score >= 11) return '11-20';
  return '0-10';
};

const Certificate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const state = location.state as { certificateData?: CertificateData } | null;
    const fromState = state?.certificateData;
    if (fromState) {
      setCertificateData(fromState);
      setLoading(false);
      return;
    }

    const fetchCertificateData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }
        const { data: attempt, error: attemptError } = await supabase
          .from("test_attempts")
          .select("*")
          .eq("id", id)
          .eq("user_id", session.user.id)
          .single();
        if (attemptError) throw attemptError;
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();
        const { data: cert } = await supabase
          .from("certificates")
          .select("certificate_id")
          .eq("test_attempt_id", id)
          .single();
        const listeningScore = Math.round(attempt.listening_score ?? 0);
        const readingScore = Math.round(attempt.reading_score ?? 0);
        const writingScore = Math.round(attempt.writing_score ?? 0);
        const speakingScore = Math.round(attempt.speaking_score ?? 0);
        const totalScore = Math.round((listeningScore + readingScore + writingScore + speakingScore) / 4);
        const listeningCefr = scoreToCefr(listeningScore);
        const readingCefr = scoreToCefr(readingScore);
        const writingCefr = scoreToCefr(writingScore);
        const speakingCefr = scoreToCefr(speakingScore);
        const overallCefr = scoreToCefr(totalScore);
        setCertificateData({
          candidateName: profile?.full_name || localStorage.getItem('candidateName') || "Candidate",
          testDate: new Date(attempt.test_date).toLocaleDateString('en-US', { 
            day: '2-digit',
            month: 'short',
            year: 'numeric' 
          }),
          certificateId: cert?.certificate_id || `CERT-${id?.slice(0, 8)}`,
          totalScore,
          cefr: {
            overall: overallCefr,
            listening: listeningCefr,
            reading: readingCefr,
            writing: writingCefr,
            speaking: speakingCefr,
          },
          scores: {
            listening: listeningScore,
            reading: readingScore,
            writing: writingScore,
            speaking: speakingScore,
          }
        });
      } catch (error) {
        console.error("Error fetching certificate:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificateData();
  }, [id, navigate, location.state]);

  const handleDownload = () => {
    if (!certificateData || !certificateRef.current) return;

    // We'll use html2canvas for better rendering
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(certificateRef.current!, {
        scale: 1,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        scrollY: -window.scrollY,
      }).then((canvas) => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `IELTS_Pro_Certificate_${certificateData.candidateName.replace(/\s+/g, '_')}.png`;
        link.click();
        toast.success("Certificate downloaded successfully!");
      });
    });
  };

  const handleShare = () => {
    if (!certificateData) return;
    
    if (navigator.share) {
      navigator.share({
        title: "IELTS Pro Certificate",
        text: `I achieved ${certificateData.cefr.overall} CEFR level on my IELTS test!`,
        url: window.location.href,
      }).catch(() => {
        toast.error("Sharing failed");
      });
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Certificate link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-xl text-muted-foreground">Loading certificate...</div>
      </div>
    );
  }

  if (!certificateData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground">Certificate not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to Dashboard</span>
          </button>

          <div className="flex gap-3">
            <Button
              onClick={handleShare}
              startIcon={<Share2 className="w-4 h-4" />}
              variant="outlined"
              sx={{
                borderColor: '#3b82f6',
                color: '#3b82f6',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                '&:hover': {
                  borderColor: '#2563eb',
                  backgroundColor: 'rgba(59, 130, 246, 0.04)',
                }
              }}
            >
              Share
            </Button>
            <Button
              onClick={handleDownload}
              startIcon={<Download className="w-4 h-4" />}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                color: 'white',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                }
              }}
            >
              Download PNG
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-none mx-auto px-6 sm:px-8 lg:px-10 py-8 overflow-auto">
        {/* Certificate Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          ref={certificateRef}
          className="shadow-2xl relative overflow-hidden"
          style={{ width: '3508px', height: '2480px', backgroundColor: '#fffaf0', fontFamily: 'Didot, Bodoni MT, Garamond, Georgia, serif', border: '8px double #c9a646', position: 'relative' }}
        >
          <div style={{ position: 'absolute', inset: '80px', border: '3px solid #c9a646', borderRadius: '24px', backgroundColor: '#fffdf7' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '120px', height: '120px', borderTop: '3px solid #c9a646', borderLeft: '3px solid #c9a646', borderTopLeftRadius: '24px' }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', borderTop: '3px solid #c9a646', borderRight: '3px solid #c9a646', borderTopRightRadius: '24px' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '120px', height: '120px', borderBottom: '3px solid #c9a646', borderLeft: '3px solid #c9a646', borderBottomLeftRadius: '24px' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '120px', height: '120px', borderBottom: '3px solid #c9a646', borderRight: '3px solid #c9a646', borderBottomRightRadius: '24px' }} />

            <div style={{ padding: '180px 160px 120px 160px', textAlign: 'center' }}>
              <div style={{ fontSize: '600px', fontWeight: 800, color: '#0b2a4a', lineHeight: 1 }}>Certificate of English Proficiency</div>
              <div style={{ marginTop: '40px', fontSize: '160px', fontWeight: 700, color: '#0b2a4a' }}>Certificate ID: {certificateData.certificateId || 'CERT-70200390'}</div>
            </div>

            <div style={{ padding: '0 160px 80px 160px', textAlign: 'center' }}>
              <div style={{ fontSize: '220px', color: '#0b2a4a' }}>This certifies that</div>
              <div style={{ marginTop: '30px', fontSize: '480px', fontWeight: 800, color: '#6b1b1b', letterSpacing: '2px' }}>{certificateData.candidateName.toUpperCase()}</div>
              <div style={{ marginTop: '50px', fontSize: '220px', color: '#0b2a4a' }}>This certifies that {certificateData.candidateName.replace(/\b\w/g, c => c.toUpperCase())} has successfully demonstrated English language proficiency at the {getCefrLabel(certificateData.cefr.overall)} ({certificateData.cefr.overall}) level in accordance with the Common European Framework of Reference for Languages (CEFR).</div>
              <div style={{ marginTop: '40px', fontSize: '200px', color: '#0b2a4a' }}>Awarded on the {certificateData.testDate}.</div>

            <div style={{ marginTop: '60px', padding: '0 300px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: '210px', color: '#0b2a4a', fontWeight: 700 }}>
                <div>Skill</div>
                <div>CEFR Level</div>
                <div>Score</div>
              </div>
              <div style={{ marginTop: '30px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', padding: '30px 0', borderTop: '2px solid #c9a646' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: '#0b2a4a' }}><Headphones width={120} height={120} /> Listening</div>
                  <div style={{ color: '#0b2a4a' }}>{certificateData.cefr.listening} {getCefrLabel(certificateData.cefr.listening)}</div>
                  <div style={{ color: '#6b1b1b', fontWeight: 800 }}>{certificateData.scores.listening}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', padding: '30px 0', borderTop: '2px solid #c9a646' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: '#0b2a4a' }}><BookOpen width={120} height={120} /> Reading</div>
                  <div style={{ color: '#0b2a4a' }}>{certificateData.cefr.reading} {getCefrLabel(certificateData.cefr.reading)}</div>
                  <div style={{ color: '#6b1b1b', fontWeight: 800 }}>{certificateData.scores.reading}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', padding: '30px 0', borderTop: '2px solid #c9a646' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: '#0b2a4a' }}><Pencil width={120} height={120} /> Writing</div>
                  <div style={{ color: '#0b2a4a' }}>{certificateData.cefr.writing} {getCefrLabel(certificateData.cefr.writing)}</div>
                  <div style={{ color: '#6b1b1b', fontWeight: 800 }}>{certificateData.scores.writing}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', padding: '30px 0', borderTop: '2px solid #c9a646' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: '#0b2a4a' }}><MessageSquare width={120} height={120} /> Speaking</div>
                  <div style={{ color: '#0b2a4a' }}>{certificateData.cefr.speaking} {getCefrLabel(certificateData.cefr.speaking)}</div>
                  <div style={{ color: '#6b1b1b', fontWeight: 800 }}>{certificateData.scores.speaking}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', padding: '30px 0', borderTop: '2px solid #c9a646' }}>
                  <div style={{ color: '#0b2a4a', fontWeight: 800 }}>OVERALL</div>
                  <div style={{ color: '#0b2a4a', fontWeight: 800 }}>{certificateData.cefr.overall} {getCefrLabel(certificateData.cefr.overall)}</div>
                  <div style={{ color: '#6b1b1b', fontWeight: 800 }}>{certificateData.totalScore}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '80px', padding: '0 200px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'end', gap: '60px' }}>
              <div className="text-center">
                <div style={{ width: '600px', height: '160px', margin: '0 auto' }}>
                  <svg viewBox="0 0 300 80" className="w-full h-full">
                    <path d="M10 50 C 60 20, 120 80, 170 40 C 190 20, 220 60, 290 30" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
                    <path d="M30 60 C 80 40, 140 90, 210 50" fill="none" stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div style={{ marginTop: '10px', fontSize: '180px', fontWeight: 700, color: '#333' }}>Dr. Amelia Hart</div>
                <div style={{ fontSize: '160px', color: '#555' }}>Registrar</div>
              </div>
              <div className="text-center">
                <div style={{ position: 'relative', width: '320px', height: '320px', margin: '0 auto', borderRadius: '999px', background: 'linear-gradient(135deg, #0b2a4a, #6b1b1b)' }}>
                  <svg viewBox="0 0 120 120" style={{ width: '260px', height: '260px', position: 'absolute', top: '30px', left: '30px' }}>
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="4" />
                    <circle cx="60" cy="60" r="42" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="3" />
                    <text x="60" y="56" textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff">IELTS</text>
                    <text x="60" y="82" textAnchor="middle" fontSize="18" fontWeight="700" fill="#f1f5f9">PRO</text>
                  </svg>
                </div>
                <div style={{ marginTop: '20px', fontSize: '180px', fontWeight: 700, color: '#333' }}>Official Seal</div>
              </div>
              <div className="text-center">
                <div style={{ width: '600px', height: '160px', margin: '0 auto' }}>
                  <svg viewBox="0 0 300 80" className="w-full h-full">
                    <path d="M15 40 C 70 70, 130 10, 180 50 C 200 65, 235 35, 295 55" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
                    <path d="M35 55 C 90 85, 150 25, 220 60" fill="none" stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div style={{ marginTop: '10px', fontSize: '180px', fontWeight: 700, color: '#333' }}>Mr. Daniel Brooks</div>
                <div style={{ fontSize: '160px', color: '#555' }}>Verification Officer</div>
              </div>
            </div>

            <div style={{ marginTop: '60px', textAlign: 'center', fontSize: '150px', color: '#0b2a4a' }}>Verify at: {window.location.origin + '/verify'}</div>
          
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

const getCefrLabel = (cefr: string): string => {
  const labels: Record<string, string> = {
    'C2': 'Proficient',
    'C1': 'Advanced',
    'B2': 'Upper Intermediate',
    'B1': 'Intermediate',
    'A2': 'Elementary',
    'A1': 'Beginner',
    'A0': 'Novice'
  };
  return labels[cefr] || '';
};

const formatAwardDate = (dateStr: string): string => {
  const map: Record<string, string> = {
    Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June',
    Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December'
  };
  const parts = (dateStr || '').split(' ');
  const day = parts[0] || new Date().getDate().toString();
  const monthShort = parts[1] || new Date().toLocaleString('en-US', { month: 'short' });
  const year = parts[2] || new Date().getFullYear().toString();
  const d = parseInt(day, 10);
  const suffix = (d % 10 === 1 && d !== 11) ? 'st' : (d % 10 === 2 && d !== 12) ? 'nd' : (d % 10 === 3 && d !== 13) ? 'rd' : 'th';
  const monthFull = map[monthShort as keyof typeof map] || monthShort;
  return `${d}${suffix} day of ${monthFull}, ${year}`;
};

const ScoreCircle = ({ score, label, cefr }: { score: number; label: string; cefr: string }) => {
  const displayCefr = cefr && cefr !== 'N/A' ? cefr : 'B1';
  const cefrLabel = getCefrLabel(displayCefr);
  
  return (
    <div className="text-center">
      <div className="relative w-24 h-24 mx-auto mb-3">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${(score / 100) * 251.2} 251.2`}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{score}</span>
        </div>
      </div>
      <div className="font-semibold text-gray-900">{label}</div>
      <div className="text-sm text-gray-600">{displayCefr} {cefrLabel}</div>
    </div>
  );
};

export default Certificate;
