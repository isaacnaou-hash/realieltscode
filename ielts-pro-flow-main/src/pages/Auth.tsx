import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button, TextField, Tabs, Tab } from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import shapesBg from "@/assets/shapes-bg.png";
import { signIn } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = loginSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

const Auth = () => {
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onLogin = async (data: LoginFormData) => {
    try {
      const { data: authData, error } = await signIn({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        toast.error(error.message || "Login failed");
        return;
      }

      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Login failed. Please check your credentials.");
    }
  };

  const onSignup = async (data: SignupFormData) => {
    toast.info("Please use the registration form on the homepage to create an account with payment.");
    setActiveTab(0);
    signupForm.reset();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
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

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-8 left-8 flex items-center gap-2 text-primary hover:text-primary-glow transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-semibold">Back to Home</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-card rounded-2xl shadow-2xl border border-border p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Welcome to IELTS Pro
            </h1>
            <p className="text-muted-foreground">Access your account to continue</p>
          </div>

          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{
              mb: 4,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
              },
              '& .Mui-selected': {
                color: 'hsl(217, 91%, 35%) !important',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: 'hsl(217, 91%, 35%)',
                height: 3,
                borderRadius: '3px 3px 0 0',
              }
            }}
          >
            <Tab label="Sign In" />
            <Tab label="Sign Up" />
          </Tabs>

          {activeTab === 0 ? (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                variant="outlined"
                {...loginForm.register("email")}
                error={!!loginForm.formState.errors.email}
                helperText={loginForm.formState.errors.email?.message}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  }
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                {...loginForm.register("password")}
                error={!!loginForm.formState.errors.password}
                helperText={loginForm.formState.errors.password?.message}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  }
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  background: 'linear-gradient(135deg, hsl(217, 91%, 35%) 0%, hsl(217, 91%, 60%) 100%)',
                  color: 'white',
                  padding: '14px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, hsl(217, 91%, 40%) 0%, hsl(217, 91%, 65%) 100%)',
                  }
                }}
              >
                Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-6">
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                variant="outlined"
                {...signupForm.register("email")}
                error={!!signupForm.formState.errors.email}
                helperText={signupForm.formState.errors.email?.message}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  }
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                {...signupForm.register("password")}
                error={!!signupForm.formState.errors.password}
                helperText={signupForm.formState.errors.password?.message}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  }
                }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                variant="outlined"
                {...signupForm.register("confirmPassword")}
                error={!!signupForm.formState.errors.confirmPassword}
                helperText={signupForm.formState.errors.confirmPassword?.message}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  }
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  background: 'linear-gradient(135deg, hsl(217, 91%, 35%) 0%, hsl(217, 91%, 60%) 100%)',
                  color: 'white',
                  padding: '14px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, hsl(217, 91%, 40%) 0%, hsl(217, 91%, 65%) 100%)',
                  }
                }}
              >
                Create Account
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
