import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { useEffect, useState } from "react";
import { PaystackButton } from "react-paystack";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal = ({ open, onClose, onSuccess }: PaymentModalProps) => {
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const loadEmail = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    };
    loadEmail();
  }, []);

  const paystackConfig = {
    reference: new Date().getTime().toString(),
    email: userEmail || "user@example.com",
    amount: 250000,
    currency: "KES",
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "",
  };

  const isAllowedKey = paystackConfig.publicKey.startsWith("pk_live") || paystackConfig.publicKey.startsWith("pk_test");
  const canPay = Boolean(paystackConfig.publicKey) && isAllowedKey;

  const handlePaymentSuccess = async (reference: unknown) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase.from("payment_transactions").insert({
          user_id: session.user.id,
          amount: paystackConfig.amount,
          purpose: "reattempt",
          reference: paystackConfig.reference,
          status: "success",
          paystack_response: reference as object,
        });
        await supabase.functions.invoke('verify-payment', {
          body: { reference: paystackConfig.reference }
        });
      }
    } catch (err) {
      console.error("payment log failed");
    }
    try {
      localStorage.setItem('hasPaid', 'true');
      localStorage.setItem('paymentReference', paystackConfig.reference);
    } catch {}
    toast.success("Payment successful! You can now start your test.");
    onSuccess();
  };

  const handlePaymentClose = () => {
    console.log("Payment closed");
    toast.error("Payment was not completed. Please try again.");
  };

  const componentProps = {
    email: paystackConfig.email,
    amount: paystackConfig.amount,
    currency: paystackConfig.currency,
    publicKey: paystackConfig.publicKey,
    text: "Pay KES 2,500",
    onSuccess: handlePaymentSuccess,
    onClose: handlePaymentClose,
  };

  return (
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
        Payment Required
      </DialogTitle>
      <DialogContent>
        <div className="py-4 space-y-6">
          <p className="text-muted-foreground text-lg">
            To take another IELTS test, please complete the payment of <span className="font-bold text-foreground">KES 2,500</span>.
          </p>

          <div className="bg-muted p-6 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Test Fee:</span>
              <span className="text-2xl font-bold text-primary">KES 2,500</span>
            </div>
            {canPay ? (
              <PaystackButton 
                {...componentProps} 
                className="w-full bg-gradient-to-r from-primary to-primary-glow text-white py-4 px-6 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity"
              />
            ) : (
              <button
                className="w-full bg-gray-400 text-white py-4 px-6 rounded-xl font-bold text-lg cursor-not-allowed"
                disabled
              >
                Payment unavailable. Configure Paystack key.
              </button>
            )}
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Payment is processed securely through Paystack
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
