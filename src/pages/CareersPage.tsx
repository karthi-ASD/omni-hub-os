import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PremiumFooter } from "@/components/PremiumFooter";
import { Briefcase, MapPin, ArrowRight, Sparkles, Heart, Zap, Globe, Users } from "lucide-react";
import { NWLogo } from "@/components/NWLogo";
import { usePageTitle } from "@/hooks/usePageTitle";

const openings = [
  { title: "Senior Full-Stack Engineer", dept: "Engineering", location: "Remote / Gold Coast", type: "Full-Time" },
  { title: "AI/ML Engineer", dept: "AI & Data", location: "Remote", type: "Full-Time" },
  { title: "Product Designer (UI/UX)", dept: "Design", location: "Remote / Gold Coast", type: "Full-Time" },
  { title: "DevOps / SRE Engineer", dept: "Infrastructure", location: "Remote", type: "Full-Time" },
  { title: "Customer Success Manager", dept: "Customer Success", location: "Gold Coast, QLD", type: "Full-Time" },
  { title: "Technical Content Writer", dept: "Marketing", location: "Remote", type: "Contract" },
  { title: "Sales Development Representative", dept: "Sales", location: "Gold Coast, QLD", type: "Full-Time" },
  { title: "QA Automation Engineer", dept: "Engineering", location: "Remote", type: "Full-Time" },
];

const perks = [
  { icon: Globe, title: "Remote-First", desc: "Work from anywhere in the world with flexible hours" },
  { icon: Heart, title: "Health & Wellness", desc: "Comprehensive health insurance and wellness stipend" },
  { icon: Zap, title: "Latest Tech Stack", desc: "Work with cutting-edge AI, React, and cloud technologies" },
  { icon: Users, title: "Amazing Team", desc: "Collaborative culture with brilliant minds from 10+ countries" },
];

const CareersPage = () => {
  usePageTitle("Careers", "Join the NextWeb OS team. Remote-first culture, cutting-edge tech stack, and meaningful work building the future of business software.");
  return (
  <div className="min-h-screen bg-[#0a0e1a] text-white">
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-[#d4a853]/20">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
        <Link to="/"><NWLogo /></Link>
        <Link to="/signup"><Button className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold">Get Started</Button></Link>
      </div>
    </nav>

    <section className="pt-32 pb-16 text-center relative">
      <div className="absolute top-20 left-1/3 h-96 w-96 bg-[#2563eb]/5 rounded-full blur-3xl" />
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="inline-flex items-center gap-2 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full px-4 py-2 mb-8">
          <Sparkles className="h-4 w-4 text-[#d4a853]" />
          <span className="text-sm text-[#d4a853] font-medium">Join Our Team</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Build the Future of <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">Business Software</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">We're looking for passionate people who want to revolutionize how businesses operate. Remote-first, impact-driven.</p>
      </div>
    </section>

    {/* Perks */}
    <section className="py-16 bg-[#0d1225]">
      <div className="container mx-auto px-4 md:px-8">
        <h2 className="text-2xl font-bold text-center mb-10">Why Work With Us</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {perks.map((p) => (
            <div key={p.title} className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-6 text-center hover:border-[#d4a853]/30 transition-all">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#d4a853] to-[#b8902e] flex items-center justify-center mb-4 mx-auto">
                <p.icon className="h-6 w-6 text-[#0a0e1a]" />
              </div>
              <h3 className="font-semibold mb-2">{p.title}</h3>
              <p className="text-gray-400 text-sm">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Openings */}
    <section className="py-20">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <h2 className="text-3xl font-bold text-center mb-4">Open Positions</h2>
        <p className="text-gray-400 text-center mb-12">{openings.length} roles available • Apply now</p>
        <div className="space-y-4">
          {openings.map((job) => (
            <Link to="/contact" key={job.title} className="block bg-[#111832] border border-[#1e2a4a] rounded-xl p-5 hover:border-[#d4a853]/30 transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-[#d4a853] transition-colors">{job.title}</h3>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {job.dept}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
                    <span className="px-2 py-0.5 bg-[#d4a853]/10 text-[#d4a853] rounded-full text-xs">{job.type}</span>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-600 group-hover:text-[#d4a853] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
    <PremiumFooter />
  </div>
  );
};

export default CareersPage;
