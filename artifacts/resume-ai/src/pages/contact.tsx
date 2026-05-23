import { motion } from "framer-motion";

export default function ContactSupport() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-32 pb-24 px-6 relative">
      <div className="max-w-3xl mx-auto relative z-10 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Contact Support</h1>
          <p className="text-muted-foreground text-lg">We're here to help you get the most out of MatchFolio.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-2xl max-w-xl mx-auto text-left"
        >
          <p className="text-muted-foreground mb-6">
            If you have any questions, encounter any bugs, or need assistance with your subscription, please reach out to our team via email. We aim to respond to all inquiries within 24-48 hours.
          </p>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 text-center">
            <h3 className="font-semibold text-lg text-foreground mb-2">Email Us</h3>
            <a href="mailto:support@resumeai.example.com" className="text-primary hover:text-primary/80 font-medium transition-colors text-lg">
              support@resumeai.example.com
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
