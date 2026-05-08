import { motion } from "framer-motion";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-32 pb-24 px-6 relative">
      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-invert max-w-none text-muted-foreground leading-relaxed"
        >
          <p>
            This Privacy Policy explains how ResumeAI ("we," "us," or "our") collects, uses, and discloses your personal information when you use our website and services.
          </p>

          <h3 className="text-foreground font-semibold text-xl mt-8 mb-4">1. Information We Collect</h3>
          <p>
            We collect information you provide directly to us, such as your name, email address, resume content, and the job descriptions you analyze. When you create an account, we store this information to provide you with tailored AI services.
          </p>

          <h3 className="text-foreground font-semibold text-xl mt-8 mb-4">2. How We Use Your Information</h3>
          <p>
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Provide, maintain, and improve our AI resume tailoring services.</li>
            <li>Process transactions and send related information (e.g., confirmations, receipts).</li>
            <li>Send technical notices, updates, security alerts, and support messages.</li>
            <li>Respond to your comments, questions, and customer service requests.</li>
          </ul>

          <h3 className="text-foreground font-semibold text-xl mt-8 mb-4">3. Data Sharing and AI Processing</h3>
          <p>
            To provide our core services, your resume content and job descriptions are processed via third-party AI APIs (such as OpenAI). We do not permit these third parties to use your personal data to train their models without your explicit consent. We do not sell your personal data to advertisers.
          </p>

          <h3 className="text-foreground font-semibold text-xl mt-8 mb-4">4. Data Security</h3>
          <p>
            We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
          </p>

          <h3 className="text-foreground font-semibold text-xl mt-8 mb-4">5. Contact Us</h3>
          <p>
            If you have any questions about this Privacy Policy, please contact us at privacy@resumeai.example.com.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
