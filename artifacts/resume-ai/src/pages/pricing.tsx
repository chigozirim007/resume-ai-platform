import { Link } from "wouter";
import { Check, Target, Zap, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for testing the waters and getting a feel for the platform.",
    features: [
      "3 AI Resume Analyses",
      "Basic ATS Match Scoring",
      "Standard Cover Letter Generation",
      "Save up to 5 Resume Templates",
    ],
    buttonText: "Get Started",
    href: "/signup",
    popular: false,
  },
  {
    name: "Pro",
    price: "$15",
    period: "/month",
    description: "Everything you need to apply to unlimited jobs with confidence.",
    features: [
      "Unlimited AI Resume Analyses",
      "Advanced ATS Keyword Gap Analysis",
      "Premium Cover Letter Generation",
      "Unlimited Saved Resumes",
      "Priority AI Processing",
    ],
    buttonText: "Upgrade to Pro",
    href: "/dashboard",
    popular: true,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-32 pb-24 px-6 relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[150px]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-6xl font-bold mb-6">Simple, transparent pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop guessing what recruiters want. Get the tools you need to land your dream job faster.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              className={`relative bg-card/40 backdrop-blur-xl border rounded-2xl p-8 flex flex-col ${
                plan.popular 
                  ? "border-primary shadow-[0_0_30px_rgba(0,230,153,0.15)]" 
                  : "border-white/5"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm h-10">{plan.description}</p>
              </div>
              
              <div className="mb-8">
                <span className="text-5xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/90">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href={plan.href}>
                <Button 
                  className={`w-full h-12 text-base ${
                    plan.popular 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,230,153,0.3)] hover:shadow-[0_0_25px_rgba(0,230,153,0.5)]" 
                      : "variant-outline border-primary/20 hover:bg-primary/10 text-primary"
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.buttonText}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
