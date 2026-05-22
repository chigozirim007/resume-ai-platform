import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, ArrowRight, Loader2, AlertCircle, X } from "lucide-react";

export default function LoginPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      setLocation("/dashboard");
    } catch (error: any) {
      setErrorModal(error.message || "Invalid email or password. Please try again.");
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => {
        setErrorModal(null);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setErrorModal(error.message || "An error occurred during Google login.");
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => {
        setErrorModal(null);
      }, 5000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden p-4">
      {/* Hyper-Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Blob 1: Primary Cyan */}
        <motion.div
          animate={{
            x: [0, 150, -50, 0],
            y: [0, 80, 150, 0],
            scale: [1, 1.4, 1.1, 1],
            rotate: [0, 45, -45, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[100px] opacity-70"
        />
        
        {/* Blob 2: Emerald Green */}
        <motion.div
          animate={{
            x: [0, -120, 40, 0],
            y: [0, 150, -60, 0],
            scale: [1, 1.3, 1.5, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-emerald-500/15 blur-[120px] opacity-60"
        />

        {/* Blob 3: Deep Indigo / Purple accent */}
        <motion.div
          animate={{
            x: [0, 100, -100, 0],
            y: [0, -100, 100, 0],
            scale: [0.8, 1.2, 0.9, 0.8],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[140px] opacity-40"
        />

        {/* Animated Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: 0 
            }}
            animate={{ 
              y: ["0%", "100%"],
              opacity: [0, 0.5, 0]
            }}
            transition={{ 
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5
            }}
            className="absolute w-1 h-1 bg-primary rounded-full blur-[1px]"
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 100,
          damping: 20,
          duration: 0.6 
        }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/">
              <div className="flex items-center gap-2 font-black text-3xl text-primary cursor-pointer mb-2 drop-shadow-[0_0_15px_rgba(0,230,153,0.4)]">
                <Briefcase className="h-8 w-8" />
                ResumeAI
              </div>
            </Link>
          </motion.div>
          <p className="text-muted-foreground font-medium tracking-wide">Sign in to your professional toolkit</p>
        </div>

        <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-t-white/20 relative overflow-hidden group">
          {/* Subtle card edge glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 pointer-events-none" />
          
          <CardHeader className="space-y-2 relative z-10">
            <CardTitle className="text-3xl font-extrabold tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground/80">
              Enter your credentials to continue your career journey.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest opacity-70 ml-1">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all h-11"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest opacity-70">Password</Label>
                  <a href="#" className="text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest transition-colors">Forgot password?</a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all h-11"
                />
              </div>
              <Button 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_10px_20px_rgba(0,230,153,0.2)] hover:shadow-[0_15px_30px_rgba(0,230,153,0.4)] transition-all h-12 font-bold text-base gap-2 group" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="bg-black/20 px-3 text-muted-foreground/60 backdrop-blur-xl">
                  Social Authentication
                </span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full border-white/10 hover:bg-white/5 hover:border-white/20 transition-all h-11 font-semibold gap-3" 
              onClick={handleGoogleLogin}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </Button>
          </CardContent>
          <CardFooter className="relative z-10 pt-2 pb-6">
            <div className="text-sm text-muted-foreground text-center w-full">
              New to ResumeAI?{" "}
              <Link href="/signup" className="text-primary font-bold hover:underline">
                Create an account
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      <AnimatePresence>
        {errorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-red-500/30 rounded-xl shadow-[0_0_40px_rgba(239,68,68,0.2)] max-w-sm w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
              <button
                onClick={() => {
                  setErrorModal(null);
                  if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
                }}
                className="absolute top-3 right-3 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="p-6 pt-8 flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Login Failed</h3>
                  <p className="text-sm text-zinc-300">{errorModal}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
