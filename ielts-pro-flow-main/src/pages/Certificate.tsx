import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@mui/material";
import { Download, ArrowLeft, Share2, Check } from "lucide-react";
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
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      }).then((canvas) => {
        const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait';
        const pdf = new jsPDF({
          orientation,
          unit: 'mm',
          format: 'a4',
        });

        const imgData = canvas.toDataURL('image/png');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const usableWidth = pageWidth - margin * 2;
        const usableHeight = pageHeight - margin * 2;

        let imgWidth = usableWidth;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (imgHeight > usableHeight) {
          const scale = usableHeight / imgHeight;
          imgHeight = usableHeight;
          imgWidth = imgWidth * scale;
        }

        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`IELTS_Pro_Certificate_${certificateData.candidateName.replace(/\s+/g, '_')}.pdf`);
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
              Download PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
        {/* Certificate Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          ref={certificateRef}
          className="bg-white shadow-2xl relative border-8 border-blue-800/20 rounded-2xl overflow-hidden"
          style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
        >
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1e3a8a 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="m-8 md:m-10 rounded-xl border-2 border-blue-800/30 bg-white/95">
            <div className="h-2 bg-gradient-to-r from-blue-700 to-purple-700 rounded-t-xl" />
            <div className="px-10 pt-10 pb-6 text-center">
              <div className="text-xl tracking-widest text-gray-600">IELTS Pro Certification</div>
              <div className="mt-2 text-4xl font-bold text-gray-900">Certificate of English Proficiency</div>
              <div className="mt-2 text-sm text-gray-500">Certificate ID: {certificateData.certificateId}</div>
            </div>

            <div className="px-10 pb-10">
              <div className="text-center text-gray-700 text-lg">This certifies that</div>
              <div className="mt-2 text-center text-5xl font-extrabold text-gray-900">{certificateData.candidateName}</div>
              <div className="mt-4 text-center text-gray-700">has successfully completed the IELTS Pro assessment</div>
              <div className="mt-1 text-center text-gray-700">and achieved <span className="font-bold">{certificateData.cefr.overall} {getCefrLabel(certificateData.cefr.overall)}</span> overall</div>
              <div className="mt-1 text-center text-gray-700">Awarded on <span className="font-semibold">{certificateData.testDate}</span></div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col items-center justify-center rounded-lg border border-blue-800/30 bg-slate-50 p-5 min-h-[140px]">
                <div className="text-xs tracking-wide text-gray-600">Reading</div>
                <div className="mt-1 text-4xl font-extrabold text-gray-900">{certificateData.scores.reading}</div>
                <div className="mt-2 text-xs font-semibold text-gray-700">{certificateData.cefr.reading} {getCefrLabel(certificateData.cefr.reading)}</div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border border-blue-800/30 bg-slate-50 p-5 min-h-[140px]">
                <div className="text-xs tracking-wide text-gray-600">Listening</div>
                <div className="mt-1 text-4xl font-extrabold text-gray-900">{certificateData.scores.listening}</div>
                <div className="mt-2 text-xs font-semibold text-gray-700">{certificateData.cefr.listening} {getCefrLabel(certificateData.cefr.listening)}</div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border border-blue-800/30 bg-slate-50 p-5 min-h-[140px]">
                <div className="text-xs tracking-wide text-gray-600">Writing</div>
                <div className="mt-1 text-4xl font-extrabold text-gray-900">{certificateData.scores.writing}</div>
                <div className="mt-2 text-xs font-semibold text-gray-700">{certificateData.cefr.writing} {getCefrLabel(certificateData.cefr.writing)}</div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border border-blue-800/30 bg-slate-50 p-5 min-h-[140px]">
                <div className="text-xs tracking-wide text-gray-600">Speaking</div>
                <div className="mt-1 text-4xl font-extrabold text-gray-900">{certificateData.scores.speaking}</div>
                <div className="mt-2 text-xs font-semibold text-gray-700">{certificateData.cefr.speaking} {getCefrLabel(certificateData.cefr.speaking)}</div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-6 items-end">
              <div className="text-center">
                <div className="mx-auto w-48 h-12">
                  <svg viewBox="0 0 300 80" className="w-full h-full">
                    <path d="M10 50 C 60 20, 120 80, 170 40 C 190 20, 220 60, 290 30" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
                    <path d="M30 60 C 80 40, 140 90, 210 50" fill="none" stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-700">Dr. Amelia Hart</div>
                <div className="text-xs text-gray-500">Registrar</div>
              </div>
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-700 to-purple-700">
                  <svg viewBox="0 0 100 100" className="w-16 h-16">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="3" />
                    <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
                    <text x="50" y="46" textAnchor="middle" fontSize="20" fontWeight="700" fill="#fff">IELTS</text>
                    <text x="50" y="64" textAnchor="middle" fontSize="12" fontWeight="600" fill="#e5e7eb">PRO</text>
                    <polygon points="50,20 53,26 60,27 55,31 56,37 50,34 44,37 45,31 40,27 47,26" fill="#fff" opacity="0.85" />
                  </svg>
                </div>
                <div className="mt-2 text-sm font-semibold text-gray-700">Official Seal</div>
              </div>
              <div className="text-center">
                <div className="mx-auto w-48 h-12">
                  <svg viewBox="0 0 300 80" className="w-full h-full">
                    <path d="M15 40 C 70 70, 130 10, 180 50 C 200 65, 235 35, 295 55" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
                    <path d="M35 55 C 90 85, 150 25, 220 60" fill="none" stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-700">Mr. Daniel Brooks</div>
                <div className="text-xs text-gray-500">Verification Officer</div>
              </div>
            </div>

            
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
