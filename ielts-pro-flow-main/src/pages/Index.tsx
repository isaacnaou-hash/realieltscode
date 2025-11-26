import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@mui/material";
import { CheckCircle, School, TrendingUp, Award } from "lucide-react";
import heroImage from "@/assets/hero-ielts.jpg";
import shapesBg from "@/assets/shapes-bg.png";
import RegistrationModal from "@/components/RegistrationModal";
import { useLocation, useNavigate } from "react-router-dom";

const Index = () => {
  const [showRegistration, setShowRegistration] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state && (location.state as any).openRegistration) {
      setShowRegistration(true);
    }
  }, [location.state]);

  const features = [
    {
      icon: <School className="w-8 h-8" />,
      title: "Professional Testing",
      description: "Industry-standard IELTS examinations with comprehensive evaluation"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Track Your Progress",
      description: "Monitor your test history and improvement over time"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Official Certificates",
      description: "Receive verified digital certificates upon completion"
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Floating Background Shapes */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
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

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-block"
            >
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                IELTS Test Provider
              </span>
            </motion.div>
            
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
              Master Your IELTS with Confidence
            </h1>
            
            <p className="text-xl text-muted-foreground">
              Take professional IELTS tests, track your progress, and receive official certificates. 
              Your journey to success starts here.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                variant="contained"
                size="large"
                onClick={() => setShowRegistration(true)}
                sx={{
                  background: 'linear-gradient(135deg, hsl(217, 91%, 35%) 0%, hsl(217, 91%, 60%) 100%)',
                  color: 'white',
                  padding: '12px 32px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  textTransform: 'none',
                  boxShadow: '0 8px 32px -8px hsl(217, 91%, 35% / 0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px -8px hsl(217, 91%, 35% / 0.5)',
                    background: 'linear-gradient(135deg, hsl(217, 91%, 40%) 0%, hsl(217, 91%, 65%) 100%)',
                  }
                }}
              >
                Get Started Today
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/auth")}
                sx={{
                  borderColor: 'hsl(217, 91%, 35%)',
                  color: 'hsl(217, 91%, 35%)',
                  padding: '12px 32px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  textTransform: 'none',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    borderColor: 'hsl(217, 91%, 40%)',
                    backgroundColor: 'hsl(217, 91%, 35% / 0.05)',
                  }
                }}
              >
                Sign In
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="text-sm text-foreground">Instant Access</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="text-sm text-foreground">Verified Certificates</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={heroImage} 
                alt="IELTS Success Students" 
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
            </div>
            
            {/* Floating Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="absolute -bottom-6 -left-6 bg-card p-6 rounded-2xl shadow-xl border border-border"
            >
              <div className="text-3xl font-bold text-primary">1000+</div>
              <div className="text-sm text-muted-foreground">Success Stories</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose <span className="text-primary">IELTS Pro?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience a comprehensive testing platform designed for your success
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="relative"
              >
                <div className="bg-card p-8 rounded-2xl border border-border shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-primary via-secondary to-accent p-12 rounded-3xl shadow-2xl"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Begin Your Journey?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of successful test-takers today
            </p>
            <Button
              variant="contained"
              size="large"
              onClick={() => setShowRegistration(true)}
              sx={{
                backgroundColor: 'white',
                color: 'hsl(217, 91%, 35%)',
                padding: '14px 40px',
                fontSize: '1.2rem',
                fontWeight: 700,
                borderRadius: '12px',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'white',
                  transform: 'scale(1.05)',
                }
              }}
            >
              Start Your Test Now
            </Button>
          </motion.div>
        </div>
      </section>

      <RegistrationModal 
        open={showRegistration} 
        onClose={() => setShowRegistration(false)} 
      />
    </div>
  );
};

export default Index;
