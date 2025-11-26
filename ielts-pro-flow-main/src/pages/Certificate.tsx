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
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      }).then((canvas) => {
        const pdf = new jsPDF({
          orientation: 'landscape',
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

      <main className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-10 py-8">
        {/* Certificate Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          ref={certificateRef}
          className="bg-[#fdf9f3] shadow-2xl relative border-[10px] border-blue-900/30 rounded-2xl overflow-hidden"
          style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
        >
          <div className="m-8 md:m-10 rounded-xl border-2 border-blue-900/40 bg-[#fffdf7]">
            <div className="px-10 pt-10 pb-6 text-center">
              <div className="text-4xl font-extrabold tracking-wide text-blue-900">Certificate of English Proficiency</div>
              <div className="mt-2 text-sm font-semibold text-blue-900">Certificate ID: {certificateData.certificateId || 'CERT-70200390'}</div>
            </div>

            <div className="px-10 pb-10">
              <div className="text-center text-blue-900/90 text-lg">This is to certify that</div>
              <div className="mt-2 text-center text-5xl font-extrabold text-[#6b1b1b] tracking-wide">{(certificateData.candidateName || 'Felix Kigen').toUpperCase()}</div>
              <div className="mt-4 text-center text-blue-900/90">This is to certify that {(certificateData.candidateName || 'Felix Kigen').replace(/\b\w/g, c => c.toUpperCase())} has demonstrated a level of English language proficiency commensurate with the <span className="font-semibold">{getCefrLabel(certificateData.cefr.overall)} ({certificateData.cefr.overall})</span> level of the Common European Framework of Reference for Languages (CEFR).</div>
              <div className="mt-2 text-center text-blue-900/90">Awarded this {formatAwardDate(certificateData.testDate)}</div>

            <div className="mt-8">
              <div className="px-2">
                <div className="grid grid-cols-3 text-sm font-semibold text-blue-900">
                  <div>Skill</div>
                  <div>CEFR Level</div>
                  <div>Score</div>
                </div>
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-3 items-center py-2 border-t border-blue-900/20">
                    <div className="flex items-center gap-2 text-blue-900"><Headphones className="w-4 h-4" /> Listening</div>
                    <div className="text-blue-900">{certificateData.cefr.listening} {getCefrLabel(certificateData.cefr.listening)}</div>
                    <div className="text-[#6b1b1b] font-bold">{certificateData.scores.listening}</div>
                  </div>
                  <div className="grid grid-cols-3 items-center py-2 border-t border-blue-900/20">
                    <div className="flex items-center gap-2 text-blue-900"><BookOpen className="w-4 h-4" /> Reading</div>
                    <div className="text-blue-900">{certificateData.cefr.reading} {getCefrLabel(certificateData.cefr.reading)}</div>
                    <div className="text-[#6b1b1b] font-bold">{certificateData.scores.reading}</div>
                  </div>
                  <div className="grid grid-cols-3 items-center py-2 border-t border-blue-900/20">
                    <div className="flex items-center gap-2 text-blue-900"><Pencil className="w-4 h-4" /> Writing</div>
                    <div className="text-blue-900">{certificateData.cefr.writing} {getCefrLabel(certificateData.cefr.writing)}</div>
                    <div className="text-[#6b1b1b] font-bold">{certificateData.scores.writing}</div>
                  </div>
                  <div className="grid grid-cols-3 items-center py-2 border-t border-blue-900/20">
                    <div className="flex items-center gap-2 text-blue-900"><MessageSquare className="w-4 h-4" /> Speaking</div>
                    <div className="text-blue-900">{certificateData.cefr.speaking} {getCefrLabel(certificateData.cefr.speaking)}</div>
                    <div className="text-[#6b1b1b] font-bold">{certificateData.scores.speaking}</div>
                  </div>
                  <div className="grid grid-cols-3 items-center py-2 border-t border-blue-900/30">
                    <div className="text-blue-900 font-semibold">Overall Proficiency</div>
                    <div className="text-blue-900 font-semibold">{certificateData.cefr.overall} {getCefrLabel(certificateData.cefr.overall)}</div>
                    <div className="text-[#6b1b1b] font-bold">{certificateData.totalScore}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 items-end">
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
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-900 to-[#6b1b1b]">
                  <svg viewBox="0 0 120 120" className="w-20 h-20">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="4" />
                    <circle cx="60" cy="60" r="42" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="3" />
                    <text x="60" y="56" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff">IELTS</text>
                    <text x="60" y="78" textAnchor="middle" fontSize="14" fontWeight="700" fill="#f1f5f9">PRO</text>
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

            <div className="mt-6 text-center text-sm text-blue-900">Verify at: {window.location.origin + '/verify'}</div>
          
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
