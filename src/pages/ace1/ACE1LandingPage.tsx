import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Building2, Users, ArrowRight } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

const ACE1LandingPage: React.FC = () => {
  usePageTitle("ACE1 — Property Investment Advisory", "ACE1 Command Centre — Employee & Client access portal.");

  return (
    <div className="min-h-screen bg-[#0e0e12] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Shield className="h-4.5 w-4.5 text-amber-400" />
          </div>
          <span className="text-lg font-bold text-amber-100 tracking-wide">ACE1</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/ace1/login">
            <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-200 hover:bg-amber-500/10 gap-1.5">
              <Users className="h-3.5 w-3.5" /> Employee Login
            </Button>
          </Link>
          <Link to="/ace1/portal">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Client Portal
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-2xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-white tracking-tight">
              Property Investment
              <span className="block text-amber-400">Command Centre</span>
            </h1>
            <p className="text-lg text-white/50 max-w-lg mx-auto">
              Full lifecycle management for property investment advisory — from lead capture to settlement.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/ace1/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-amber-500/30 text-amber-200 hover:bg-amber-500/10 gap-2 h-13 px-8">
                <Users className="h-4 w-4" /> Employee Login <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/ace1/portal">
              <Button size="lg" className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white gap-2 h-13 px-8">
                <Building2 className="h-4 w-4" /> Client Portal <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-4">
            {["Lead Engine", "Deal Pipeline", "Investor CRM", "Property Inventory", "Settlement Tracking", "Client Portal"].map(f => (
              <span key={f} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-white/40 border border-white/10">
                {f}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-5 border-t border-white/5 flex items-center justify-between text-xs text-white/25">
        <span>Powered by NextWeb OS</span>
        <div className="flex gap-4">
          <Link to="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
        </div>
      </footer>
    </div>
  );
};

export default ACE1LandingPage;
