import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PremiumFooter } from "@/components/PremiumFooter";
import { toast } from "sonner";
import {
  MapPin, Phone, Mail, Globe, Clock, Send, MessageSquare,
  Headphones, ArrowRight, Sparkles, CheckCircle2
} from "lucide-react";
import { NWLogo } from "@/components/NWLogo";
import { usePageTitle } from "@/hooks/usePageTitle";

const ContactPage = () => {
  usePageTitle("Contact Us", "Get in touch with Nextweb — 1800 365 247. Office: Broadbeach, Gold Coast, Australia.");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success("Thank you! We'll get back to you within 24 hours.");
      setForm({ name: "", email: "", phone: "", company: "", subject: "", message: "" });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-[#d4a853]/20">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
        <Link to="/" className="flex items-center gap-3">
          <NWLogo />
        </Link>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" className="text-gray-300 hover:text-[#d4a853]">Sign In</Button></Link>
            <Link to="/signup"><Button className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 relative">
        <div className="absolute top-20 right-1/4 h-96 w-96 bg-[#2563eb]/5 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full px-4 py-2 mb-8">
            <MessageSquare className="h-4 w-4 text-[#d4a853]" />
            <span className="text-sm text-[#d4a853] font-medium">Get In Touch</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Let's <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">Collaborate</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Whether you need a demo, have questions, or want to discuss a partnership — our team is ready to help.
          </p>
        </div>
      </section>

      {/* Contact cards + Form */}
      <section className="py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Info cards */}
            <div className="space-y-6">
              {[
                { icon: MapPin, title: "Office Address", lines: ["Level 2, Suite 38,", "Oasis Shopping Centre,", "75 Surf Parade,", "Broadbeach QLD 4218", "Australia"] },
                { icon: Phone, title: "Phone", lines: ["1800 365 247 (Toll Free)", "Mon–Fri, 9AM–6PM AEST"] },
                { icon: Mail, title: "Email", lines: ["info@nextweb.com.au", "support@nextweb.com.au"] },
                { icon: Globe, title: "Website", lines: ["www.nextweb.com.au"] },
                { icon: Clock, title: "Business Hours", lines: ["Monday – Friday: 9AM – 6PM AEST", "Saturday: 10AM – 2PM", "Sunday: Closed"] },
              ].map((card) => (
                <div key={card.title} className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-5 hover:border-[#d4a853]/30 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#d4a853]/10 to-[#d4a853]/5 border border-[#d4a853]/20 flex items-center justify-center">
                      <card.icon className="h-4 w-4 text-[#d4a853]" />
                    </div>
                    <h3 className="font-semibold text-white text-sm">{card.title}</h3>
                  </div>
                  {card.lines.map((line, i) => (
                    <p key={i} className="text-gray-400 text-sm">{line}</p>
                  ))}
                </div>
              ))}

              <div className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-5">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Business Registration</p>
                <p className="text-gray-400 text-sm">ABN: 94 613 674 445</p>
                <p className="text-gray-400 text-sm">ACN: 613 674 445</p>
                <p className="text-[#d4a853] text-xs mt-2 font-medium">Government Approved IT Supplier</p>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-[#111832] border border-[#1e2a4a] rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-2">Send Us a Message</h2>
                <p className="text-gray-500 mb-8">Fill out the form below and we'll get back to you within 24 hours.</p>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300 text-sm">Full Name *</Label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" required className="h-11 bg-[#0a0e1a] border-[#1e2a4a] text-white placeholder:text-gray-600 focus:border-[#d4a853]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300 text-sm">Email Address *</Label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" required className="h-11 bg-[#0a0e1a] border-[#1e2a4a] text-white placeholder:text-gray-600 focus:border-[#d4a853]" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300 text-sm">Phone</Label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+61 400 000 000" className="h-11 bg-[#0a0e1a] border-[#1e2a4a] text-white placeholder:text-gray-600 focus:border-[#d4a853]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300 text-sm">Company</Label>
                      <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Your Company" className="h-11 bg-[#0a0e1a] border-[#1e2a4a] text-white placeholder:text-gray-600 focus:border-[#d4a853]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300 text-sm">Subject *</Label>
                    <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required className="w-full h-11 px-3 rounded-md bg-[#0a0e1a] border border-[#1e2a4a] text-white text-sm focus:border-[#d4a853] focus:outline-none">
                      <option value="">Select a topic</option>
                      <option value="demo">Request a Demo</option>
                      <option value="sales">Sales Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300 text-sm">Message *</Label>
                    <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us about your needs..." required rows={5} className="w-full px-3 py-2 rounded-md bg-[#0a0e1a] border border-[#1e2a4a] text-white text-sm placeholder:text-gray-600 focus:border-[#d4a853] focus:outline-none resize-none" />
                  </div>
                  <Button type="submit" className="w-full h-12 bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold text-base" disabled={loading}>
                    {loading ? "Sending..." : <><Send className="mr-2 h-4 w-4" /> Send Message</>}
                  </Button>
                </form>

                <div className="flex flex-wrap gap-4 mt-6 text-xs text-gray-500">
                  <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Response within 24h</div>
                  <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Free consultation</div>
                  <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> No obligation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map placeholder */}
      <section className="py-16 bg-[#0d1225]">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Visit Our Office</h2>
          <p className="text-gray-400 mb-8">Located in the heart of Broadbeach, Gold Coast — Australia's premier business hub.</p>
          <div className="bg-[#111832] border border-[#1e2a4a] rounded-2xl h-64 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-10 w-10 text-[#d4a853] mx-auto mb-3" />
              <p className="text-gray-400 text-sm">75 Surf Parade, Broadbeach QLD 4218</p>
              <a href="https://maps.google.com/?q=75+Surf+Parade+Broadbeach+QLD+4218" target="_blank" rel="noopener noreferrer" className="text-[#d4a853] text-sm font-medium mt-2 inline-flex items-center gap-1 hover:text-[#f0d48a]">
                Open in Google Maps <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <PremiumFooter />
    </div>
  );
};

export default ContactPage;
