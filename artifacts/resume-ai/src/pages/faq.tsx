import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "How does the ATS Match Score work?",
    answer: "Our AI engine compares the keywords, skills, and experience in your resume directly against the job description. It calculates a score from 0-100 based on exact matches, semantic matches, and structural formatting.",
  },
  {
    question: "Will employers know I used AI to write my cover letter?",
    answer: "No. Our AI is specifically prompted to write in a natural, professional human tone—avoiding the robotic clichés ('I am a highly motivated individual...') common in generic AI outputs. We tailor it specifically to your unique experience and the job's tone.",
  },
  {
    question: "Is my data safe?",
    answer: "Absolutely. We do not sell your personal data or your resume content to third parties. Your uploaded resumes are securely stored in our encrypted database and are only used to generate your tailored applications.",
  },
  {
    question: "What happens when I hit the Free limit?",
    answer: "The Free plan gives you 3 complete AI analyses (Resume Tailoring + Match Score + Cover Letter). Once you use those 3, you'll be prompted to upgrade to Pro for unlimited analyses. You will still have access to your saved resumes and history.",
  },
  {
    question: "Does this guarantee me an interview?",
    answer: "While we can't guarantee an interview, users who optimize their resumes to match the job description see on average a 3.2x increase in callback rates. You still need to have the underlying skills required for the role!",
  },
];

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-32 pb-24 px-6 relative overflow-hidden">
      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-6xl font-bold mb-6">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about the platform and how it works.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 sm:p-10 shadow-2xl"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-white/10">
                <AccordionTrigger className="text-left text-lg hover:text-primary transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </div>
  );
}
