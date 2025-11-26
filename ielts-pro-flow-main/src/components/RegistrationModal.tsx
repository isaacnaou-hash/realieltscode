import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, TextField, Button, Checkbox, FormControlLabel, CircularProgress } from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import TermsModal from "./TermsModal";
import { PaystackButton } from "react-paystack";
import { signUp } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const registrationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface RegistrationModalProps {
  open: boolean;
  onClose: () => void;
}

const RegistrationModal = ({ open, onClose }: RegistrationModalProps) => {
  const [showTerms, setShowTerms] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const agreeToTerms = watch("agreeToTerms");
  const email = watch("email");

  // Paystack configuration
  const paystackConfig = {
    reference: new Date().getTime().toString(),
    email: email || "user@example.com",
    amount: 250000,
    currency: "KES",
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "",
  };

  const isLiveKey = paystackConfig.publicKey.startsWith("pk_live");
  const canPay = Boolean(paystackConfig.publicKey) && isLiveKey;

  const handlePaymentSuccess = async (reference: unknown) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase.from("payment_transactions").insert({
          user_id: session.user.id,
          amount: paystackConfig.amount,
          purpose: "registration",
          reference: paystackConfig.reference,
          status: "success",
          paystack_response: reference as object,
        });
      }
    } catch (err) {
      console.error("payment log failed");
    }
    setPaymentSuccess(true);
    toast.success("Payment successful! You can now register.");
  };

  const handlePaymentClose = () => {
    console.log("Payment closed");
    toast.error("Payment was not completed. Please try again.");
  };

  const onSubmit = async (data: RegistrationFormData) => {
    if (!paymentSuccess) {
      toast.error("Please complete payment first");
      return;
    }

    setIsProcessing(true);

    try {
      const { data: authData, error } = await signUp({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
      });

      if (error) {
        toast.error(error.message || "Registration failed");
        return;
      }

      toast.success("Registration successful! Redirecting to dashboard...");
      reset();
      setPaymentSuccess(false);
      onClose();
      
      // Redirect to dashboard after successful registration
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const componentProps = {
    email: email || "user@example.com",
    amount: paystackConfig.amount,
    currency: paystackConfig.currency,
    publicKey: paystackConfig.publicKey,
    text: "Pay Now",
    onSuccess: handlePaymentSuccess,
    onClose: handlePaymentClose,
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            padding: '8px',
          }
        }}
      >
        <DialogTitle sx={{ fontSize: '1.8rem', fontWeight: 700, color: 'hsl(217, 91%, 35%)' }}>
          Create Your IELTS Account
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <TextField
              fullWidth
              label="Full Name"
              variant="outlined"
              {...register("fullName")}
              error={!!errors.fullName}
              helperText={errors.fullName?.message}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                }
              }}
            />

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              variant="outlined"
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                }
              }}
            />

            <TextField
              fullWidth
              label="Phone Number"
              variant="outlined"
              {...register("phoneNumber")}
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber?.message}
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
              {...register("password")}
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                }
              }}
            />

            <div className="space-y-4">
              {!paymentSuccess ? (
                <div className="p-4 bg-muted rounded-xl">
                  <p className="text-sm text-muted-foreground mb-3">
                    Registration Fee: KES 2,500
                  </p>
                  {canPay ? (
                    <PaystackButton 
                      {...componentProps} 
                      className="w-full bg-gradient-to-r from-primary to-primary-glow text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <button
                      className="w-full bg-gray-400 text-white py-3 px-6 rounded-lg font-semibold cursor-not-allowed"
                      disabled
                    >
                      Payment unavailable. Configure live Paystack key.
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-success/10 border border-success rounded-xl">
                  <p className="text-success font-semibold">✓ Payment Confirmed</p>
                </div>
              )}

              <FormControlLabel
                control={
                  <Checkbox 
                    {...register("agreeToTerms")}
                    sx={{
                      color: 'hsl(217, 91%, 35%)',
                      '&.Mui-checked': {
                        color: 'hsl(217, 91%, 35%)',
                      }
                    }}
                  />
                }
                label={
                  <span className="text-sm">
                    I have read and agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setShowTerms(true)}
                      className="text-primary hover:underline font-semibold"
                    >
                      Terms and Conditions
                    </button>
                  </span>
                }
              />
              {errors.agreeToTerms && (
                <p className="text-destructive text-sm">{errors.agreeToTerms.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={!paymentSuccess || !agreeToTerms || isProcessing}
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
                },
                '&:disabled': {
                  background: 'hsl(215, 16%, 47%)',
                  color: 'white',
                }
              }}
            >
              {isProcessing ? <CircularProgress size={24} color="inherit" /> : "Register"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
    </>
  );
};

export default RegistrationModal;
