import { Link } from "wouter";
import { motion } from "framer-motion";
import { Book, FileText, Settings, CreditCard } from "lucide-react";

const helpTopics = [
  {
    title: "Getting Started",
    icon: Book,
    desc: "Learn how to upload your first resume and parse your first job description.",
  },
  {
    title: "Resume Analysis",
    icon: FileText,
    desc: "Understand how the ATS Match Score is calculated and how to improve it.",
  },
  {
    title: "Account Settings",
    icon: Settings,
    desc: "Update your profile, change your email, or delete your account.",
  },
  {
    title: "Billing & Plans",
    icon: CreditCard,
    desc: "Manage your Pro subscription, view invoices, or cancel your plan.",
  },
];

export default function HelpCenter() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-32 pb-24 px-6 relative">
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-muted-foreground text-lg">Find answers, tutorials, and guides to master MatchFolio.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid sm:grid-cols-2 gap-6"
        >
          {helpTopics.map((topic, i) => (
            <div key={i} className="bg-card/30 backdrop-blur-md border border-white/5 rounded-xl p-6 hover:border-primary/30 transition-colors cursor-pointer group">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <topic.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{topic.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{topic.desc}</p>
            </div>
          ))}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-16 text-center border-t border-white/5 pt-12"
        >
          <h3 className="text-2xl font-bold mb-4">Can't find what you're looking for?</h3>
          <p className="text-muted-foreground mb-6">Our support team is here to help you resolve any issues.</p>
          <Link href="/contact" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,230,153,0.3)] hover:shadow-[0_0_25px_rgba(0,230,153,0.5)] h-10 px-8 py-2">
            Contact Support
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
