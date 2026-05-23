import { motion } from "framer-motion";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-32 pb-24 px-6 relative">
      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-invert max-w-none text-muted-foreground leading-relaxed"
        >
          <p>
            Welcome to TailorFolio. By accessing or using our website and services, you agree to be bound by these Terms of Service.
          </p>

          <h3 className="text-foreground font-semibold text-xl mt-8 mb-4">1. Acceptance of Terms</h3>
          <p>
            By creating an account, or by using our services, you confirm that you have read, understood, and agree to these Terms. If you do not agree to these Terms, you may not access or use our services.
          </p>

          <h3 className="text-foreground font-semibold text-xl mt-8 mb-4">2. Description of Service</h3>
          <p>
            TailorFolio provides AI-powered tools to help users match their resumes and cover letters to specific job descriptions. The output generated is provided "as is" and you are solely responsible for reviewing and verifying the accuracy of all generated content before submitting it to an employer.
          </p>

          <h3 className="text-foreground font-semibold text-xl mt-8 mb-4">3. User Accounts</h3>
          <p>
            You are responsible for safeguarding the password or credentials you use to access the service and for any activities or actions under your account. You agree to notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
          </p>

          <h3 className="text-foreground font-semibold text-xl mt-8 mb-4">4. Intellectual Property</h3>
          <p>
            You retain all rights to the original resume text and job descriptions you submit. We do not claim ownership of your data. By using the service, you grant us a license to process your text solely for the purpose of providing the service to you.
          </p>

          <h3 className="text-foreground font-semibold text-xl mt-8 mb-4">5. Limitation of Liability</h3>
          <p>
            In no event shall TailorFolio, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>

          <h3 className="text-foreground font-semibold text-xl mt-8 mb-4">6. Changes</h3>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide reasonable notice of any material changes.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
