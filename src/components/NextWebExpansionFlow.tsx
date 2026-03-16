import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Brain, Users, Building2 } from "lucide-react";

export default function NextWebExpansionFlow() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-[hsl(220,25%,97%)] to-[hsl(225,25%,96%)] relative overflow-hidden">
      {/* Soft background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[400px] h-[400px] rounded-full blur-[120px] bg-[hsl(252,85%,70%,0.06)] top-[10%] left-[-5%]" />
        <div className="absolute w-[350px] h-[350px] rounded-full blur-[100px] bg-[hsl(190,80%,60%,0.05)] bottom-[10%] right-[-5%]" />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10" ref={ref}>
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-[hsl(224,28%,12%)] tracking-tight">
            How NextWeb OS{" "}
            <span className="bg-gradient-to-r from-[hsl(252,85%,58%)] via-[hsl(190,80%,50%)] to-[hsl(152,60%,45%)] bg-clip-text text-transparent">
              Expands Your Business
            </span>
          </h2>
          <p className="text-[hsl(220,15%,45%)] mt-4 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            NextWeb OS begins as a powerful CRM and expands into a complete intelligent business operating system that manages sales, marketing, automation and operations from one platform.
          </p>
        </motion.div>

        {/* Flow Diagram */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0 max-w-4xl mx-auto">
          {/* LEFT — CRM NEXT */}
          <motion.div
            className="flex flex-col items-center text-center w-full md:w-52 shrink-0"
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[hsl(190,80%,50%)] to-[hsl(190,80%,40%)] flex items-center justify-center shadow-lg shadow-[hsl(190,80%,50%)]/20">
              <Users className="h-7 w-7 text-white" />
            </div>
            <span className="mt-3 text-sm font-bold tracking-wider text-[hsl(190,80%,42%)] uppercase">CRM Next</span>
            <span className="text-xs text-[hsl(220,15%,50%)] mt-1">Customers · Leads · Sales</span>
          </motion.div>

          {/* LEFT ARROW */}
          <div className="hidden md:flex items-center flex-1 min-w-[60px]">
            <svg className="w-full h-8" viewBox="0 0 200 32" fill="none" preserveAspectRatio="none">
              <motion.line
                x1="0" y1="16" x2="170" y2="16"
                stroke="url(#gradLeft)" strokeWidth="2.5" strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={inView ? { pathLength: 1 } : {}}
                transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
              />
              <motion.polygon
                points="168,8 185,16 168,24"
                fill="hsl(252,85%,58%)"
                initial={{ opacity: 0, scale: 0 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 1.3 }}
                style={{ transformOrigin: "176px 16px" }}
              />
              <defs>
                <linearGradient id="gradLeft" x1="0" y1="0" x2="170" y2="0">
                  <stop offset="0%" stopColor="hsl(190,80%,50%)" />
                  <stop offset="100%" stopColor="hsl(252,85%,58%)" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* MOBILE ARROW DOWN (left) */}
          <div className="md:hidden flex items-center justify-center">
            <svg className="w-8 h-12" viewBox="0 0 32 48" fill="none">
              <motion.line
                x1="16" y1="0" x2="16" y2="36"
                stroke="hsl(252,85%,58%)" strokeWidth="2.5" strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={inView ? { pathLength: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
              <motion.polygon
                points="8,34 16,46 24,34"
                fill="hsl(252,85%,58%)"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.3, delay: 1.2 }}
              />
            </svg>
          </div>

          {/* CENTER — Intelligence Engine */}
          <motion.div
            className="relative flex items-center justify-center shrink-0"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.2, type: "spring", stiffness: 120 }}
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute h-44 w-44 md:h-52 md:w-52 rounded-full border-2 border-[hsl(252,85%,62%)]/15"
              animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.15, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute h-36 w-36 md:h-44 md:w-44 rounded-full border border-[hsl(190,80%,50%)]/10"
              animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            {/* Core circle */}
            <motion.div
              className="relative h-28 w-28 md:h-36 md:w-36 rounded-full bg-gradient-to-br from-[hsl(252,85%,58%)] via-[hsl(252,85%,52%)] to-[hsl(270,70%,50%)] flex flex-col items-center justify-center shadow-xl shadow-[hsl(252,85%,58%)]/25 z-10"
              animate={{
                boxShadow: [
                  "0 0 30px -5px hsl(252,85%,58%,0.25)",
                  "0 0 50px -5px hsl(252,85%,58%,0.4)",
                  "0 0 30px -5px hsl(252,85%,58%,0.25)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Brain className="h-8 w-8 md:h-10 md:w-10 text-white mb-1" />
              <span className="text-[9px] md:text-[10px] font-bold text-white/90 uppercase tracking-wider text-center leading-tight px-2">
                NextWeb<br />Intelligence<br />Engine
              </span>
            </motion.div>
          </motion.div>

          {/* RIGHT ARROW */}
          <div className="hidden md:flex items-center flex-1 min-w-[60px]">
            <svg className="w-full h-8" viewBox="0 0 200 32" fill="none" preserveAspectRatio="none">
              <motion.line
                x1="30" y1="16" x2="200" y2="16"
                stroke="url(#gradRight)" strokeWidth="2.5" strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={inView ? { pathLength: 1 } : {}}
                transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
              />
              <motion.polygon
                points="15,8 0,16 15,24"
                fill="hsl(252,85%,58%)"
                initial={{ opacity: 0, scale: 0 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 1.3 }}
                style={{ transformOrigin: "8px 16px" }}
              />
              <defs>
                <linearGradient id="gradRight" x1="30" y1="0" x2="200" y2="0">
                  <stop offset="0%" stopColor="hsl(252,85%,58%)" />
                  <stop offset="100%" stopColor="hsl(152,60%,42%)" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* MOBILE ARROW DOWN (right) */}
          <div className="md:hidden flex items-center justify-center">
            <svg className="w-8 h-12" viewBox="0 0 32 48" fill="none">
              <motion.line
                x1="16" y1="0" x2="16" y2="36"
                stroke="hsl(152,60%,42%)" strokeWidth="2.5" strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={inView ? { pathLength: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
              <motion.polygon
                points="8,34 16,46 24,34"
                fill="hsl(152,60%,42%)"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.3, delay: 1.2 }}
              />
            </svg>
          </div>

          {/* RIGHT — BUSINESS NEXT */}
          <motion.div
            className="flex flex-col items-center text-center w-full md:w-52 shrink-0"
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[hsl(152,60%,42%)] to-[hsl(152,60%,34%)] flex items-center justify-center shadow-lg shadow-[hsl(152,60%,42%)]/20">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <span className="mt-3 text-sm font-bold tracking-wider text-[hsl(152,60%,36%)] uppercase">Business Next</span>
            <span className="text-xs text-[hsl(220,15%,50%)] mt-1">Operations · Marketing · Automation</span>
          </motion.div>
        </div>

        {/* Subtle looping pulse on arrows — desktop only */}
        <div className="hidden md:flex justify-center mt-6">
          <motion.div
            className="flex items-center gap-2 text-xs text-[hsl(220,15%,55%)] font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(252,85%,58%)]" />
            Continuously expanding
          </motion.div>
        </div>
      </div>
    </section>
  );
}
