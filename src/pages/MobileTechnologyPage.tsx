import { Link } from "react-router-dom";
import { PremiumFooter } from "@/components/PremiumFooter";
import { NWLogo } from "@/components/NWLogo";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Smartphone, Tablet, ArrowRight, CheckCircle2, Apple, Monitor,
  Zap, Shield, Globe, Download, Star, Users, Layers, Code2, Gauge
} from "lucide-react";

const MobileTechnologyPage = () => {
  usePageTitle("Mobile Technology", "Native iOS & Android app development — React Native, Flutter, Swift, and Kotlin solutions by NextWeb Australia.");

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-[#d4a853]/20">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
          <Link to="/"><NWLogo /></Link>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link to="/web-development" className="text-gray-400 hover:text-[#d4a853]">Web Development</Link>
            <Link to="/mobile-technology" className="text-[#d4a853] font-medium">Mobile Technology</Link>
            <Link to="/it-solutions" className="text-gray-400 hover:text-[#d4a853]">IT Solutions</Link>
            <Link to="/e-marketing" className="text-gray-400 hover:text-[#d4a853]">E-Marketing</Link>
            <Link to="/automation" className="text-gray-400 hover:text-[#d4a853]">Automation</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" className="text-gray-300 hover:text-[#d4a853]">Sign In</Button></Link>
            <Link to="/demo"><Button className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold">Get a Quote</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 min-h-[70vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#111832] to-[#0a0e1a]" />
        <div className="absolute top-40 right-20 h-80 w-80 bg-[#2563eb]/5 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 md:px-8 relative z-10 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#2563eb]/10 border border-[#2563eb]/30 rounded-full px-4 py-2 mb-6">
              <Smartphone className="h-4 w-4 text-[#2563eb]" />
              <span className="text-sm text-[#2563eb] font-medium">Mobile App Development</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Build <span className="bg-gradient-to-r from-[#2563eb] to-[#0ea5e9] bg-clip-text text-transparent">Mobile Apps</span> That Users Love
            </h1>
            <p className="text-lg text-gray-400 mt-6 max-w-2xl">
              Native iOS & Android apps, cross-platform solutions, and progressive web apps — we build mobile experiences that engage users and drive business growth.
            </p>
            <div className="flex gap-4 mt-8">
              <Link to="/demo"><Button size="lg" className="bg-gradient-to-r from-[#2563eb] to-[#0ea5e9] text-white font-bold px-8">Start Your App Project <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="py-20 bg-[#0d1225]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">Platforms We <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">Build For</span></h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Smartphone, title: "iPhone App Development", desc: "Swift & SwiftUI native apps designed for Apple's ecosystem. App Store compliant, performant, and beautiful.", features: ["Swift & SwiftUI", "Apple App Store Compliance", "ARKit & CoreML Integration", "Apple Pay & Sign-in with Apple"] },
              { icon: Smartphone, title: "Android App Development", desc: "Kotlin & Jetpack Compose apps optimized for the full range of Android devices and form factors.", features: ["Kotlin & Jetpack Compose", "Google Play Store Compliance", "Material Design 3", "Firebase Integration"] },
              { icon: Tablet, title: "iPad App Development", desc: "Tablet-optimized apps with split-view, drag & drop, and Apple Pencil support for professional workflows.", features: ["Multi-tasking Support", "Apple Pencil Integration", "Split View & Slide Over", "Keyboard Shortcuts"] },
              { icon: Layers, title: "Cross-Platform Apps", desc: "React Native and Flutter solutions that deliver native performance with a single codebase across iOS and Android.", features: ["React Native", "Flutter & Dart", "Single Codebase", "Native Performance"] },
              { icon: Globe, title: "Progressive Web Apps", desc: "Installable web applications with offline capability, push notifications, and app-like user experience.", features: ["Offline Support", "Push Notifications", "Installable on Home Screen", "Automatic Updates"] },
              { icon: Monitor, title: "Hybrid App Development", desc: "Capacitor and Ionic-based hybrid apps that leverage web technologies with native device access.", features: ["Capacitor Framework", "Web Technology Stack", "Native API Access", "Rapid Development"] },
            ].map((platform) => (
              <div key={platform.title} className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-6 hover:border-[#2563eb]/40 transition-all group">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#0ea5e9] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <platform.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{platform.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{platform.desc}</p>
                <ul className="space-y-2">
                  {platform.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="h-4 w-4 text-[#2563eb] flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Features */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Features We <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">Implement</span></h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "GPS & Location Services", "Push Notifications", "In-App Payments", "Biometric Auth",
              "Camera & Photo Upload", "Offline Mode", "Real-time Chat", "Social Login",
              "Analytics & Tracking", "Cloud Sync", "Voice & Video Calls", "AR/VR Integration",
            ].map((feature) => (
              <div key={feature} className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-4 flex items-center gap-3 hover:border-[#d4a853]/30 transition-all">
                <CheckCircle2 className="h-5 w-5 text-[#d4a853] flex-shrink-0" />
                <span className="text-sm text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-[#d4a853]/10 bg-[#0d1225]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "200+", label: "Apps Delivered" },
              { value: "4.8★", label: "Avg Store Rating" },
              { value: "1M+", label: "Total Downloads" },
              { value: "50+", label: "Enterprise Clients" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold bg-gradient-to-r from-[#2563eb] to-[#0ea5e9] bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-gray-400 mt-2 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Launch Your <span className="bg-gradient-to-r from-[#2563eb] to-[#0ea5e9] bg-clip-text text-transparent">Mobile App?</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-10">From concept to App Store — our team delivers world-class mobile experiences.</p>
          <Link to="/demo"><Button size="lg" className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-bold text-lg px-10 py-6 hover:scale-105 transition-all">Get a Free Quote <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
        </div>
      </section>

      <PremiumFooter />
    </div>
  );
};

export default MobileTechnologyPage;
