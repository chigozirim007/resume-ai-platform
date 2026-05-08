import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function CheckoutSuccess() {
  const [location] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") || params.get("trxref");

    if (!reference) {
      // Paystack sometimes redirects without a reference on failure
      setStatus("error");
      return;
    }

    fetch(`/api/paystack/verify?reference=${reference}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: { success?: boolean; error?: string }) => {
        if (data.success) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card/60 backdrop-blur-xl border border-white/5 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl relative z-10"
      >
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-2">Verifying your payment...</h1>
            <p className="text-muted-foreground text-sm">Please wait while we confirm your subscription with Paystack.</p>
          </>
        )}

        {status === "success" && (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
            </motion.div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Pro! 🎉</h1>
            <p className="text-muted-foreground mb-8">
              Your subscription is now active. You have access to unlimited AI resume analyses and all premium features.
            </p>
            <Link href="/dashboard">
              <Button className="w-full gap-2 bg-primary text-primary-foreground shadow-[0_0_20px_rgba(0,230,153,0.3)] hover:shadow-[0_0_30px_rgba(0,230,153,0.5)]">
                Go to Dashboard
              </Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-2">Payment Not Confirmed</h1>
            <p className="text-muted-foreground mb-8">
              We could not verify your payment. If you were charged, please contact our support team and we'll resolve it immediately.
            </p>
            <div className="flex gap-3">
              <Link href="/contact" className="flex-1">
                <Button variant="outline" className="w-full">Contact Support</Button>
              </Link>
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full">Back to Dashboard</Button>
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
