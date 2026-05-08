import { useState } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Briefcase, UserPlus, ArrowRight, Loader2 } from "lucide-react";

export default function SignupPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please make sure your passwords match.",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Your password must be at least 6 characters long.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      // Automatically sync the user to our backend if they are logged in immediately
      if (data.user && data.session) {
         try {
           await fetch("/api/auth/sync", {
             method: "POST",
             headers: {
               "Content-Type": "application/json",
               "Authorization": `Bearer ${data.session.access_token}`,
             },
             body: JSON.stringify({
               id: data.user.id,
               email: data.user.email,
               firstName,
               lastName,
             }),
           });
           
           toast({
             title: "Account created!",
             description: "You have successfully signed up.",
           });
           setLocation("/dashboard");
           return;
         } catch (syncError) {
           console.error("Failed to sync user to backend", syncError);
         }
      }

      // If no session, it means email confirmation is likely enabled in Supabase
      if (!data.session) {
        toast({
          title: "Verify your email",
          description: "We've sent a confirmation link to your email address. Please verify it to log in.",
        });
        setLocation("/login");
      } else {
        setLocation("/dashboard");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up.",
      });
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
      toast({
        variant: "destructive",
        title: "Google login failed",
        description: error.message || "An error occurred during Google login.",
      });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden p-4">
      {/* Hyper-Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Blob 1: Emerald / Cyan mix */}
        <motion.div
          animate={{
            x: [0, -150, 80, 0],
            y: [0, 100, -150, 0],
            scale: [1.2, 1.6, 1.3, 1.2],
            rotate: [0, -60, 60, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-[15%] -right-[15%] w-[65%] h-[65%] rounded-full bg-emerald-500/20 blur-[110px] opacity-70"
        />
        
        {/* Blob 2: Primary Cyan */}
        <motion.div
          animate={{
            x: [0, 140, -60, 0],
            y: [0, -120, 100, 0],
            scale: [1, 1.4, 1.2, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute -bottom-[25%] -left-[15%] w-[75%] h-[75%] rounded-full bg-primary/15 blur-[130px] opacity-65"
        />

        {/* Blob 3: Soft Indigo accent */}
        <motion.div
          animate={{
            x: [0, -80, 120, 0],
            y: [0, -80, 80, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-[30%] left-[20%] w-[35%] h-[35%] rounded-full bg-indigo-600/10 blur-[150px]"
        />

        {/* Particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: 0 
            }}
            animate={{ 
              y: ["0%", "100%"],
              opacity: [0, 0.4, 0]
            }}
            transition={{ 
              duration: Math.random() * 8 + 12,
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
        className="relative z-10 w-full max-w-lg"
      >
        <div className="flex flex-col items-center mb-8">
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
          <p className="text-muted-foreground font-medium tracking-wide">Join thousands of smart job seekers</p>
        </div>

        <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-t-white/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 pointer-events-none" />
          
          <CardHeader className="space-y-2 relative z-10">
            <CardTitle className="text-3xl font-extrabold tracking-tight">Create Account</CardTitle>
            <CardDescription className="text-muted-foreground/80">
              Set up your profile and start landing more interviews today.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-widest opacity-70 ml-1">First name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-widest opacity-70 ml-1">Last name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all h-11"
                  />
                </div>
              </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest opacity-70 ml-1">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest opacity-70 ml-1">Confirm</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all h-11"
                  />
                </div>
              </div>
              <Button 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_10px_20px_rgba(0,230,153,0.2)] hover:shadow-[0_15px_30px_rgba(0,230,153,0.4)] transition-all h-12 font-bold text-base gap-2 mt-2 group" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Create My Account
                    <UserPlus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="bg-black/20 px-3 text-muted-foreground/60 backdrop-blur-xl">
                  Quick Join
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
              Sign up with Google
            </Button>
          </CardContent>
          <CardFooter className="relative z-10 pt-2 pb-6">
            <div className="text-sm text-muted-foreground text-center w-full">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
