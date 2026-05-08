import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@workspace/replit-auth-web";
import NotFound from "@/pages/not-found";

import Landing from "./pages/landing";
import Dashboard from "./pages/dashboard";
import Resumes from "./pages/resumes";
import Analyze from "./pages/analyze";
import AnalysisDetail from "./pages/analysis-detail";
import History from "./pages/history";
import Settings from "./pages/settings";
import CheckoutSuccess from "./pages/checkout-success";
import DashboardLayout from "./components/layout/dashboard-layout";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Pricing from "./pages/pricing";
import FAQ from "./pages/faq";
import PrivacyPolicy from "./pages/privacy";
import TermsOfService from "./pages/terms";
import HelpCenter from "./pages/help";
import ContactSupport from "./pages/contact";

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // using setTimeout to avoid rendering issues when triggering location change during render
    setTimeout(() => {
      login();
    }, 0);
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/faq" component={FAQ} />
      <Route path="/help" component={HelpCenter} />
      <Route path="/contact" component={ContactSupport} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/dashboard">
        <AuthGate>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </AuthGate>
      </Route>
      <Route path="/resumes">
        <AuthGate>
          <DashboardLayout>
            <Resumes />
          </DashboardLayout>
        </AuthGate>
      </Route>
      <Route path="/history">
        <AuthGate>
          <DashboardLayout>
            <History />
          </DashboardLayout>
        </AuthGate>
      </Route>
      <Route path="/analyze">
        <AuthGate>
          <DashboardLayout>
            <Analyze />
          </DashboardLayout>
        </AuthGate>
      </Route>
      <Route path="/settings">
        <AuthGate>
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        </AuthGate>
      </Route>
      <Route path="/analyses/:id">
        {(params) => (
          <AuthGate>
            <DashboardLayout>
              <AnalysisDetail id={params.id!} />
            </DashboardLayout>
          </AuthGate>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
