import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight, Shield, Zap, BarChart3 } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg gradient-accent flex items-center justify-center">
              <Building2 className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="text-lg font-bold">NextWeb OS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
          Your business
          <span className="text-gradient"> operating system</span>
        </h1>
        <p className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto">
          CRM, project management, invoicing, and automation — unified in one powerful platform for digital agencies.
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link to="/signup">
            <Button size="lg" className="shadow-glow">
              Start Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Multi-Tenant Security</h3>
            <p className="text-sm text-muted-foreground">
              Complete tenant isolation with role-based access control and audit logging.
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto">
              <Zap className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold">Automation Engine</h3>
            <p className="text-sm text-muted-foreground">
              Email, SMS, WhatsApp and push notifications with SLA escalation built in.
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-info/10 flex items-center justify-center mx-auto">
              <BarChart3 className="h-6 w-6 text-info" />
            </div>
            <h3 className="text-lg font-semibold">Analytics & Reports</h3>
            <p className="text-sm text-muted-foreground">
              Google Analytics, Ads, Search Console and Maps — all in one dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} NextWeb OS. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
