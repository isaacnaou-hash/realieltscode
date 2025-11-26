import { Dialog, DialogContent, DialogTitle, Button } from "@mui/material";

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

const TermsModal = ({ open, onClose }: TermsModalProps) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          maxHeight: '80vh',
        }
      }}
    >
      <DialogTitle sx={{ fontSize: '1.8rem', fontWeight: 700, color: 'hsl(217, 91%, 35%)' }}>
        Terms and Conditions
      </DialogTitle>
      <DialogContent>
        <div className="space-y-4 text-foreground py-4">
          <section>
            <h3 className="text-lg font-bold mb-2">1. Payment Policy</h3>
            <p className="text-muted-foreground">
              All payments made for IELTS test registration are non-refundable. 
              Once payment is confirmed, it cannot be reversed or refunded under any circumstances.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">2. Identification Requirements</h3>
            <p className="text-muted-foreground">
              Candidates must provide valid identification documents when requested. 
              Failure to provide proper identification may result in test cancellation without refund.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">3. Misrepresentation and Misuse</h3>
            <p className="text-muted-foreground">
              Any form of misrepresentation, cheating, or misuse of the testing platform 
              will lead to immediate suspension of your account and forfeiture of all fees paid. 
              IELTS Pro reserves the right to take legal action against fraudulent activities.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">4. Communication</h3>
            <p className="text-muted-foreground">
              All official communication regarding your test, results, and certificates 
              will be sent to the email address and phone number provided during registration. 
              It is your responsibility to ensure these contact details are accurate and up-to-date.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">5. Test Integrity</h3>
            <p className="text-muted-foreground">
              Candidates must complete tests independently without unauthorized assistance. 
              Any violation of test integrity will result in score cancellation and account suspension.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">6. Certificate Issuance</h3>
            <p className="text-muted-foreground">
              Certificates will be issued upon successful completion of the test. 
              IELTS Pro reserves the right to verify test results before certificate issuance.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">7. Account Responsibility</h3>
            <p className="text-muted-foreground">
              You are responsible for maintaining the confidentiality of your account credentials. 
              Any activity under your account is your responsibility.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">8. Changes to Terms</h3>
            <p className="text-muted-foreground">
              IELTS Pro reserves the right to modify these terms at any time. 
              Continued use of the platform constitutes acceptance of modified terms.
            </p>
          </section>

          <div className="pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground italic">
              By registering for IELTS Pro, you acknowledge that you have read, 
              understood, and agree to be bound by these Terms and Conditions.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={onClose}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, hsl(217, 91%, 35%) 0%, hsl(217, 91%, 60%) 100%)',
              color: 'white',
              padding: '10px 32px',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '10px',
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, hsl(217, 91%, 40%) 0%, hsl(217, 91%, 65%) 100%)',
              }
            }}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsModal;
