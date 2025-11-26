import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@mui/material";
import { Download, ArrowLeft, Share2, Check } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
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
  const certificateRef = useRef<HTMLDivElement>(null);
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificateData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/auth");
          return;
        }

        // Fetch test attempt
        const { data: attempt, error: attemptError } = await supabase
          .from("test_attempts")
          .select("*")
          .eq("id", id)
          .eq("user_id", session.user.id)
          .single();

        if (attemptError) throw attemptError;

        // Fetch user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();

        // Fetch certificate ID
        const { data: cert } = await supabase
          .from("certificates")
          .select("certificate_id")
          .eq("test_attempt_id", id)
          .single();

        // Use actual scores from database (all now out of 100)
        const listeningScore = Math.round(attempt.listening_score ?? 0);
        const readingScore = Math.round(attempt.reading_score ?? 0);
        const writingScore = Math.round(attempt.writing_score ?? 0);
        const speakingScore = Math.round(attempt.speaking_score ?? 0);
        const totalScore = Math.round((listeningScore + readingScore + writingScore + speakingScore) / 4);

        // Calculate CEFR levels dynamically from scores
        const listeningCefr = scoreToCefr(listeningScore);
        const readingCefr = scoreToCefr(readingScore);
        const writingCefr = scoreToCefr(writingScore);
        const speakingCefr = scoreToCefr(speakingScore);
        const overallCefr = scoreToCefr(totalScore);

        setCertificateData({
          candidateName: profile?.full_name || "Candidate",
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
        toast.error("Failed to load certificate");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificateData();
  }, [id, navigate]);

  const handleDownload = () => {
    if (!certificateData || !certificateRef.current) return;

    // We'll use html2canvas for better rendering
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(certificateRef.current!, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
      }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Certificate Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          ref={certificateRef}
          className="bg-white rounded-lg shadow-xl overflow-hidden relative"
        >
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(59,130,246,0.06) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          {/* Certificate Header */}
          <div className="bg-gradient-to-r from-blue-700 to-purple-700 py-6 px-8">
            <div className="flex items-center justify-between">
              <div className="text-4xl font-extrabold text-white tracking-wide">IELTS Pro</div>
              <div className="text-white/90 text-sm font-semibold">Certificate ID: {certificateData.certificateId}</div>
            </div>
            <div className="mt-3 inline-block bg-white/15 backdrop-blur px-4 py-1 rounded-full text-sm font-semibold text-white">Official English Proficiency Certificate</div>
          </div>

          {/* Certificate Body */}
          <div className="px-8 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="md:col-span-2">
                <h1 className="text-5xl font-extrabold text-center md:text-left text-gray-900 mb-2">
                  {certificateData.candidateName}
                </h1>
                <p className="text-center md:text-left text-gray-600">
                  Awarded on <span className="font-semibold">{certificateData.testDate}</span>
                </p>
              </div>
              <div className="flex items-center justify-center md:justify-end">
                <div className="text-center">
                  <div className="text-xs uppercase tracking-widest text-gray-500">Verification</div>
                  <div className="mt-2 inline-block border rounded-lg p-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.origin + '/certificate/' + id)}`}
                      alt="QR"
                      className="w-24 h-24"
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">{window.location.origin}/certificate/{id}</div>
                </div>
              </div>
            </div>

            {/* Score Circle */}
            <div className="flex justify-center mb-8">
              <div className="relative w-72 h-72 mx-auto">
                {/* Outer decorative ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-200 via-purple-100 to-blue-100 opacity-40" />
                
                {/* Main circle shape */}
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 flex flex-col items-center justify-center text-white shadow-xl p-8">
                  <div className="text-sm font-semibold mb-3 tracking-wide">IELTS Pro</div>
                  <div className="text-7xl font-bold mb-3">{certificateData.totalScore}</div>
                  <div className="text-xl font-semibold text-center leading-tight">{certificateData.cefr.overall} {getCefrLabel(certificateData.cefr.overall)}</div>
                </div>
              </div>
            </div>

            {/* Skills Checkmarks */}
            <div className="flex justify-center gap-8 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-700 font-medium">Reading</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-700 font-medium">Listening</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-700 font-medium">Writing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-700 font-medium">Speaking</span>
              </div>
            </div>

            <div className="text-center mb-10">
              <div className="inline-block px-6 py-2 rounded-full bg-gray-100 text-gray-700 font-semibold">Overall: {certificateData.totalScore}/100 • {certificateData.cefr.overall} {getCefrLabel(certificateData.cefr.overall)}</div>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-gray-200 mb-10" />

            {/* Understanding Results */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
                Understanding the results
              </h2>

              {/* Score Table */}
              <div className="mb-6">
                <div className="grid grid-cols-8 gap-2">
                  {/* Header */}
                  <div className="col-span-1 bg-gray-100 p-3 text-center font-semibold text-sm text-gray-700">
                    IELTS Pro
                  </div>
                  {['0-10', '11-20', '21-40', '41-50', '51-70', '71-85', '86-100'].map((range) => (
                    <div 
                      key={range}
                      className={`col-span-1 p-3 text-center text-sm font-semibold ${
                        getScoreRange(certificateData.totalScore) === range
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {range}
                    </div>
                  ))}

                  {/* CEFR Row */}
                  <div className="col-span-1 bg-gray-100 p-3 text-center font-semibold text-sm text-gray-700">
                    CEFR
                  </div>
                  {[
                    { level: 'A0', label: 'Novice' },
                    { level: 'A1', label: 'Beginner' },
                    { level: 'A2', label: 'Elementary' },
                    { level: 'B1', label: 'Intermediate' },
                    { level: 'B2', label: 'Upper Int.' },
                    { level: 'C1', label: 'Advanced' },
                    { level: 'C2', label: 'Proficient' },
                  ].map((item) => (
                    <div 
                      key={item.level}
                      className={`col-span-1 p-3 text-center ${
                        certificateData.cefr.overall === item.level
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="text-sm font-bold">{item.level}</div>
                      <div className="text-xs">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <p className="text-sm text-gray-600 text-center max-w-3xl mx-auto">
                The achieved level is <span className="font-semibold">{certificateData.totalScore}/100</span> on the IELTS Pro score scale and{' '}
                <span className="font-semibold">{certificateData.cefr.overall} {getCefrLabel(certificateData.cefr.overall)}</span> according to the Common
                European Framework of Reference (CEFR). The IELTS Pro score is calculated as an average of the skill
                section scores.
              </p>
            </div>

            {/* Individual Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <ScoreCircle score={certificateData.scores.reading} label="Reading" cefr={certificateData.cefr.reading} />
              <ScoreCircle score={certificateData.scores.listening} label="Listening" cefr={certificateData.cefr.listening} />
              <ScoreCircle score={certificateData.scores.writing} label="Writing" cefr={certificateData.cefr.writing} />
              <ScoreCircle score={certificateData.scores.speaking} label="Speaking" cefr={certificateData.cefr.speaking} />
            </div>

            <div className="grid grid-cols-3 items-end mt-8 border-t border-gray-200 pt-6">
              <div className="text-center">
                <div className="h-10 border-b border-gray-400" />
                <div className="mt-2 text-xs text-gray-500">Authorized Signature</div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">SEAL</div>
                <div className="mt-2 text-xs text-gray-500">IELTS Pro</div>
              </div>
              <div className="text-center">
                <div className="h-10 border-b border-gray-400" />
                <div className="mt-2 text-xs text-gray-500">Verification Officer</div>
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
