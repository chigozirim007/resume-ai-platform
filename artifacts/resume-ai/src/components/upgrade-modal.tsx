import { useState } from "react";
import { Zap, Lock, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const proFeatures = [
  "Unlimited AI analyses",
  "Unlimited resume storage",
  "Priority AI processing",
  "Full history & export",
];

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        credentials: "include",
      });
      
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? "Could not initialize payment. Please try again.");
      }
      
      const { authorization_url } = await res.json() as { authorization_url: string };
      window.location.href = authorization_url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary text-xs">
              Free plan limit reached
            </Badge>
          </div>
          <DialogTitle className="text-xl">Upgrade to Pro</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            You've used all 3 free analyses. Upgrade to Pro for unlimited analyses, more resume storage, and faster AI processing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 my-2">
          {proFeatures.map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm">
              <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-primary mb-0.5">$15<span className="text-base font-normal text-muted-foreground">/mo</span></div>
          <p className="text-xs text-muted-foreground">Cancel anytime. No commitment.</p>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <div className="flex flex-col gap-2 mt-1">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {loading ? "Redirecting to checkout..." : "Upgrade to Pro — $15/mo"}
          </Button>
          <Button variant="ghost" className="text-muted-foreground text-sm" onClick={onClose} disabled={loading}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
