import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PremiumFooter } from "@/components/PremiumFooter";
import { BookOpen, ArrowRight, Calendar, User, Clock, Tag } from "lucide-react";
import { NWLogo } from "@/components/NWLogo";
import { usePageTitle } from "@/hooks/usePageTitle";

const posts = [
  { title: "How AI is Transforming Digital Agency Operations in 2026", excerpt: "Explore how autonomous AI agents are automating lead scoring, client management, and sales forecasting for modern agencies.", category: "AI & Automation", author: "Rajeev Kumar", date: "Feb 28, 2026", readTime: "8 min" },
  { title: "The Complete Guide to Multi-Tenant SaaS Architecture", excerpt: "Learn the technical foundations behind building a secure, scalable multi-tenant platform — including row-level security and tenant isolation.", category: "Engineering", author: "Priya Sharma", date: "Feb 20, 2026", readTime: "12 min" },
  { title: "Why Agencies Are Consolidating to All-in-One Platforms", excerpt: "The hidden cost of using 15+ separate tools. How NextWeb OS helped a 50-person agency save $3,000/month.", category: "Case Study", author: "Daniel Young", date: "Feb 15, 2026", readTime: "6 min" },
  { title: "SEO Operations at Scale: Managing 100+ Client Campaigns", excerpt: "Best practices for keyword tracking, content pipelines, GBP management, and monthly reporting across a large client portfolio.", category: "SEO", author: "Sarah Mitchell", date: "Feb 10, 2026", readTime: "10 min" },
  { title: "Building Mobile-First Business Apps with Capacitor", excerpt: "How we built native iOS and Android apps sharing the same codebase as our web platform for field service teams.", category: "Mobile", author: "James Chen", date: "Feb 5, 2026", readTime: "7 min" },
  { title: "Enterprise Security Checklist for SaaS Platforms", excerpt: "From encryption to audit logging — the essential security measures every SaaS platform should implement.", category: "Security", author: "Priya Sharma", date: "Jan 28, 2026", readTime: "9 min" },
  { title: "Revenue Intelligence: Predicting Growth Before It Happens", excerpt: "How predictive analytics and cohort analysis can help agencies forecast revenue with 95% accuracy.", category: "Analytics", author: "Rajeev Kumar", date: "Jan 20, 2026", readTime: "8 min" },
  { title: "From Startup to Government Supplier: Our Journey", excerpt: "The story of how Nextweb became an approved IT supplier for 4 Australian state governments.", category: "Company", author: "Rajeev Kumar", date: "Jan 15, 2026", readTime: "5 min" },
];

const BlogPage = () => {
  usePageTitle("Blog & Insights", "Industry insights, product updates, and best practices for running a modern digital agency with NextWeb OS.");
  return (
  <div className="min-h-screen bg-[#0a0e1a] text-white">
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-[#d4a853]/20">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
        <Link to="/"><NWLogo /></Link>
        <Link to="/signup"><Button className="bg-gradient-to-r from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-semibold">Get Started</Button></Link>
      </div>
    </nav>

    <section className="pt-32 pb-16 text-center">
      <div className="container mx-auto px-4 md:px-8">
        <div className="inline-flex items-center gap-2 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full px-4 py-2 mb-8">
          <BookOpen className="h-4 w-4 text-[#d4a853]" />
          <span className="text-sm text-[#d4a853] font-medium">Blog & Insights</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Latest from <span className="bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent">NextWeb OS</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">Industry insights, product updates, and best practices for running a modern digital agency.</p>
      </div>
    </section>

    <section className="pb-20">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl">
        {/* Featured */}
        <div className="bg-gradient-to-br from-[#111832] to-[#0d1225] border border-[#1e2a4a] rounded-2xl p-8 mb-8 hover:border-[#d4a853]/30 transition-all">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-[#d4a853]/10 text-[#d4a853] rounded-full text-xs font-medium">{posts[0].category}</span>
            <span className="text-xs text-gray-600">Featured</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 hover:text-[#d4a853] transition-colors cursor-pointer">{posts[0].title}</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">{posts[0].excerpt}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {posts[0].author}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {posts[0].date}</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {posts[0].readTime}</span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {posts.slice(1).map((post) => (
            <div key={post.title} className="bg-[#111832] border border-[#1e2a4a] rounded-xl p-6 hover:border-[#d4a853]/30 transition-all cursor-pointer group">
              <span className="px-2.5 py-1 bg-[#d4a853]/10 text-[#d4a853] rounded-full text-xs font-medium">{post.category}</span>
              <h3 className="text-lg font-semibold mt-3 mb-2 group-hover:text-[#d4a853] transition-colors">{post.title}</h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">{post.excerpt}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{post.author}</span>
                <span>•</span>
                <span>{post.date}</span>
                <span>•</span>
                <span>{post.readTime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
    <PremiumFooter />
  </div>
  );
};

export default BlogPage;
