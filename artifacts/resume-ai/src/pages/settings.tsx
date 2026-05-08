import { useState, useEffect } from "react";
import { User, Save, Shield, CreditCard, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useGetUserSettings, useUpdateUserSettings, getGetUserSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isUpgrading, setIsUpgrading] = useState(false);

  const { data: user, isLoading } = useGetUserSettings({
    query: { queryKey: getGetUserSettingsQueryKey() }
  });

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
    }
  }, [user]);

  const updateSettings = useUpdateUserSettings({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetUserSettingsQueryKey() });
        toast({ title: "Settings updated", description: "Your profile has been saved." });
      },
      onError: () => {
        toast({ title: "Update failed", description: "Could not save your settings.", variant: "destructive" });
      }
    }
  });

  const handleSave = () => {
    updateSettings.mutate({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      }
    });
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const res = await fetch("/api/paystack/initialize", { method: "POST", credentials: "include" });
      const data = await res.json() as { authorization_url?: string; error?: string };
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast({ title: "Payment Error", description: data.error || "Could not start payment. Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network Error", description: "Could not reach the server. Please try again.", variant: "destructive" });
    } finally {
      setIsUpgrading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading settings...</div>;
  }

  const isPro = user?.plan === "pro";

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account preferences and profile details.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/30 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Profile Information</span>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your last name"
                />
              </div>
            </div>
            <div className="space-y-1.5 opacity-60">
              <Label>Email Address</Label>
              <Input
                value={user?.email || ""}
                disabled
                className="bg-secondary/50 cursor-not-allowed"
              />
            </div>
          </div>
          <div className="p-4 bg-secondary/10 border-t border-border flex justify-end">
            <Button
              size="sm"
              className="gap-2"
              onClick={handleSave}
              disabled={updateSettings.isPending}
            >
              <Save className="h-3.5 w-3.5" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Account Security */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/30 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Account Security</span>
          </div>
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Your account is secured via Supabase Authentication. Password changes are managed through your account provider.
            </p>
            <Button variant="outline" size="sm" className="text-xs" disabled>
              Update Password
            </Button>
          </div>
        </div>

        {/* Billing Section */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/30 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Subscription & Billing</span>
          </div>
          <div className="p-6">
            {isPro ? (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Pro Plan Active</span>
                  <Badge className="bg-primary/20 text-primary border-primary/20 text-xs">PRO</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  You have unlimited analyses and access to all premium features.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  You are on the <strong>Free Plan</strong> — {user?.usageCount ?? 0}/3 analyses used.
                  Upgrade to Pro for unlimited analyses, priority AI processing, and more.
                </p>
                <Button
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="gap-2 bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,230,153,0.3)] hover:shadow-[0_0_25px_rgba(0,230,153,0.5)]"
                >
                  <Zap className="h-4 w-4" />
                  {isUpgrading ? "Redirecting to Paystack..." : "Upgrade to Pro — $15/month"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
