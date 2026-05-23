import { Link } from "wouter";
import { ArrowRight, Zap, Target, FileText, CheckCircle, Star, Users, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { useListReviews, getListReviewsQueryKey, useCreateReview } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const features = [
  {
    icon: Target,
    title: "ATS Match Score",
    desc: "Get a precise 0-100 score showing how well your resume matches the job description before you apply.",
  },
  {
    icon: Zap,
    title: "Instant Tailoring",
    desc: "AI rewrites your resume in seconds, highlighting exactly the skills and experience that matter for this role.",
  },
  {
    icon: FileText,
    title: "Cover Letter Generation",
    desc: "A personalized, role-specific cover letter — not a template. Reads like it was written by you, on your best day.",
  },
];

const stats = [
  { value: "3.2x", label: "more interview callbacks" },
  { value: "87%", label: "average match score improvement" },
  { value: "< 30s", label: "per tailored application" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function ReviewDialog() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("");
  const [text, setText] = useState("");
  const [score, setScore] = useState("95");

  const createReview = useCreateReview({
    mutation: {
      onSuccess: () => {
        toast({ title: "Review submitted", description: "Thank you for your feedback!" });
        setOpen(false);
        setRole("");
        setText("");
        setScore("95");
        qc.invalidateQueries({ queryKey: getListReviewsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to submit review.", variant: "destructive" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReview.mutate({
      data: {
        role,
        text,
        score: parseInt(score, 10),
      }
    });
  };

  if (!user) {
    return (
      <Link href="/login">
        <Button variant="outline" className="border-primary/20 hover:bg-primary/10 text-primary mt-6 shadow-[0_0_15px_rgba(0,230,153,0.1)]">
          Sign In to Leave a Review
        </Button>
      </Link>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-primary/20 hover:bg-primary/10 text-primary mt-6 shadow-[0_0_15px_rgba(0,230,153,0.1)]">
          Leave a Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share your experience</DialogTitle>
          <DialogDescription>
            Help others know how MatchFolio worked for you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="role">Your Role / Job Title</Label>
            <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Software Engineer" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="text">Review</Label>
            <Textarea id="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="How did MatchFolio help you?" className="min-h-[100px]" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="score">Match Score achieved (0-100)</Label>
            <Input id="score" type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={createReview.isPending}>
            {createReview.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Landing() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);

  const { data: reviews } = useListReviews({}, { query: { queryKey: getListReviewsQueryKey() } });

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[150px]" />
      </div>

      {/* Nav */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl"
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary tracking-tight">
            <Briefcase className="h-5 w-5" />
            MatchFolio
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">Free plan — 3 analyses</span>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,230,153,0.3)] transition-all hover:shadow-[0_0_25px_rgba(0,230,153,0.5)]">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section ref={heroRef} className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-24 text-center">
        <motion.div 
          style={{ opacity: heroOpacity, y: heroY }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary bg-primary/5 text-xs tracking-wider uppercase backdrop-blur-md">
              Match your resume to every role
            </Badge>
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6 drop-shadow-2xl">
            Stop sending the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">
              wrong resume
            </span>
            {" "}to every job
          </motion.h1>
          <motion.p variants={itemVariants} className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Match your resume to every role. Paste a job description, get a tailored resume, a match score, and a cover letter in under 30 seconds.
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-base px-8 h-12 shadow-[0_0_20px_rgba(0,230,153,0.2)] hover:shadow-[0_0_30px_rgba(0,230,153,0.4)] transition-all">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white/10 text-foreground hover:bg-white/5 h-12 text-base px-8 backdrop-blur-sm">
                Sign In
              </Button>
            </Link>
          </motion.div>
          <motion.p variants={itemVariants} className="mt-6 text-xs text-muted-foreground opacity-80">
            No credit card required. Includes 3 free analyses.
          </motion.p>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 border-y border-white/5 bg-black/20 backdrop-blur-md">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-3 gap-8 text-center"
        >
          {stats.map((s) => (
            <motion.div key={s.value} variants={itemVariants}>
              <div className="text-3xl sm:text-5xl font-bold text-primary mb-2 drop-shadow-[0_0_15px_rgba(0,230,153,0.3)]">{s.value}</div>
              <div className="text-sm sm:text-base text-muted-foreground font-medium">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-32">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="text-center mb-20"
        >
          <motion.h2 variants={itemVariants} className="text-3xl sm:text-5xl font-bold mb-6">Everything you need. Nothing you don't.</motion.h2>
          <motion.p variants={itemVariants} className="text-muted-foreground text-lg max-w-xl mx-auto">
            Three tools that cover the entire job application workflow perfectly.
          </motion.p>
        </motion.div>
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="grid md:grid-cols-3 gap-6"
        >
          {features.map((f) => (
            <motion.div 
              key={f.title} 
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 hover:border-primary/40 hover:bg-card/60 transition-colors shadow-2xl relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(0,230,153,0.15)] group-hover:shadow-[0_0_25px_rgba(0,230,153,0.3)] transition-shadow">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="relative z-10 font-bold text-xl mb-3">{f.title}</h3>
              <p className="relative z-10 text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section className="relative z-10 bg-black/30 border-y border-white/5 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-32">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="text-center mb-20"
          >
            <motion.h2 variants={itemVariants} className="text-3xl sm:text-5xl font-bold mb-4">How it works</motion.h2>
          </motion.div>
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid md:grid-cols-3 gap-12"
          >
            {[
              { step: "01", title: "Paste the job", desc: "Copy any job description — from LinkedIn, company sites, anywhere." },
              { step: "02", title: "Add your resume", desc: "Paste your existing resume text. No upload required." },
              { step: "03", title: "Get your results", desc: "In under 30 seconds: tailored resume, cover letter, match score, and keyword gaps." },
            ].map((item, i) => (
              <motion.div key={item.step} variants={itemVariants} className="flex flex-col gap-4 relative">
                {i !== 2 && (
                  <div className="hidden md:block absolute top-8 right-[-15%] w-[30%] h-[1px] bg-gradient-to-r from-primary/50 to-transparent" />
                )}
                <div className="text-6xl font-bold text-primary/10 font-mono tracking-tighter">{item.step}</div>
                <h3 className="font-bold text-xl">{item.title}</h3>
                <p className="text-muted-foreground text-base leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-32">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="text-center mb-20"
        >
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-primary text-primary drop-shadow-[0_0_8px_rgba(0,230,153,0.5)]" />
            ))}
          </motion.div>
          <motion.h2 variants={itemVariants} className="text-3xl sm:text-5xl font-bold mb-6">Real people, real results</motion.h2>
          <motion.p variants={itemVariants} className="text-muted-foreground text-lg flex items-center justify-center gap-2">
            <Users className="h-5 w-5" />
            Join thousands of job seekers who apply smarter
          </motion.p>
          
          <motion.div variants={itemVariants}>
            <ReviewDialog />
          </motion.div>
        </motion.div>
        
        {reviews && reviews.length > 0 ? (
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid md:grid-cols-3 gap-6"
          >
            {reviews.map((t) => (
              <motion.div 
                key={t.id} 
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="bg-card/30 backdrop-blur-lg border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-colors shadow-xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="font-bold text-base text-foreground">{t.name}</div>
                    <div className="text-sm text-primary/80">{t.role}</div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 shadow-[0_0_10px_rgba(0,230,153,0.1)]">
                    <Target className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-bold text-primary">{t.score}%</span>
                  </div>
                </div>
                <p className="text-base text-muted-foreground leading-relaxed">"{t.text}"</p>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center py-20 bg-card/20 backdrop-blur-md rounded-2xl border border-white/5"
          >
            <Star className="h-12 w-12 text-primary/20 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">No reviews yet</h3>
            <p className="text-muted-foreground mb-6">Be the first to share your experience with MatchFolio!</p>
          </motion.div>
        )}
      </section>

      {/* CTA */}
      <section className="relative z-10 border-t border-white/5 bg-gradient-to-b from-black/0 to-primary/5">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto px-6 py-32 text-center"
        >
          <h2 className="text-4xl sm:text-6xl font-bold mb-6 drop-shadow-lg">
            Your next job starts with the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">
              right resume
            </span>
          </h2>
          <p className="text-muted-foreground text-xl mb-12 max-w-2xl mx-auto">
            Free to start. No credit card needed. Results in under 30 seconds.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-lg px-12 h-14 rounded-full shadow-[0_0_30px_rgba(0,230,153,0.3)] hover:shadow-[0_0_40px_rgba(0,230,153,0.5)] transition-all transform hover:scale-105">
              Create Your Account
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Standard Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-black/40 backdrop-blur-md pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 text-lg font-bold text-primary mb-4">
                <Briefcase className="h-6 w-6" />
                MatchFolio
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Match your resume to every role with tailored resumes, match scores, and role-focused cover letters.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/analyze" className="hover:text-primary transition-colors cursor-pointer">Analyze Resume</Link></li>
                <li><Link href="/dashboard" className="hover:text-primary transition-colors cursor-pointer">Dashboard</Link></li>
                <li><Link href="/pricing" className="hover:text-primary transition-colors cursor-pointer">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-foreground">Resources</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/help" className="hover:text-primary transition-colors cursor-pointer">Help Center</Link></li>
                <li><Link href="/faq" className="hover:text-primary transition-colors cursor-pointer">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors cursor-pointer">Contact Support</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors cursor-pointer">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} MatchFolio. All rights reserved.
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary" />
              Free plan includes 3 full AI analyses
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
