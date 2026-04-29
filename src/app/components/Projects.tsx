import React from "react";
import { motion } from "motion/react";
import SpotlightCard from "./react-bits/SpotlightCard";
import BorderGlow from "./react-bits/BorderGlow";
import TiltedCard from "./react-bits/TiltedCard";
import SplitText from "./react-bits/SplitText";
import GradientText from "./react-bits/GradientText";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ExternalLink, ShoppingBag, Layout } from "lucide-react";

export function Projects() {
  const projects = [
    {
      title: "Secret Boutique",
      category: "E-commerce Platform",
      description: "End-to-end development of a niche e-commerce focused on sensual and self-care products. A 100% finished platform with full, secure payment gateway integration, structured for high performance and conversion.",
      image: "https://images.unsplash.com/photo-1667188225162-03bc16ca7d88?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjBwcmVtaXVtJTIwc3BhY2V8ZW58MXx8fHwxNzc3NDQ3NjExfDA&ixlib=rb-4.1.0&q=80&w=1080",
      icon: ShoppingBag,
      glowColor: "rgba(236, 72, 153, 0.5)",
      spotlightColor: "rgba(236, 72, 153, 0.12)",
      tagColor: "text-pink-400",
      gradientColors: ["#ec4899", "#f472b6", "#f9a8d4", "#ec4899"],
    },
    {
      title: "Dallas Motel Landing Page",
      category: "High-Performance Frontend",
      description: "Official digital presence of a hospitality business. A high-performance front-end designed for conversion, featuring a responsive design entirely focused on the user experience.",
      image: "https://images.unsplash.com/photo-1765211369986-22057b702ef4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkYXJrJTIwbmVvbiUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3Nzc0NDc2MTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      icon: Layout,
      glowColor: "rgba(16, 185, 129, 0.5)",
      spotlightColor: "rgba(16, 185, 129, 0.12)",
      tagColor: "text-emerald-400",
      gradientColors: ["#10b981", "#34d399", "#6ee7b7", "#10b981"],
    }
  ];

  return (
    <section className="relative py-32 px-6 max-w-6xl mx-auto z-10">
      {/* Heavy ambient blurred orbs for Apple iOS style depth */}
      <motion.div
        className="absolute top-40 -left-20 w-[40rem] h-[40rem] bg-pink-600/20 rounded-full mix-blend-screen filter blur-[140px] pointer-events-none"
        animate={{ x: [0, 15, -20, 0], y: [0, -20, 10, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-10 -right-20 w-[35rem] h-[35rem] bg-emerald-600/20 rounded-full mix-blend-screen filter blur-[140px] pointer-events-none"
        animate={{ x: [0, -15, 25, 0], y: [0, 15, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      <div className="mb-20 relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tighter uppercase">
          <SplitText
            text="Personal Archives."
            delay={30}
            animationFrom={{ opacity: 0, transform: "translate3d(0, 30px, 0)" }}
            animationTo={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
          />
          {" "}
          <span className="text-white/40">
            <SplitText
              text="Projects."
              delay={30}
              animationFrom={{ opacity: 0, transform: "translate3d(0, 30px, 0)" }}
              animationTo={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
            />
          </span>
        </h2>
        <motion.div
          className="w-24 h-1 bg-pink-500/50 rounded-full shadow-[0_0_15px_rgba(236,72,153,0.6)]"
          initial={{ width: 0 }}
          whileInView={{ width: 96 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-8 relative z-10">
        {projects.map((project, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: idx * 0.2 }}
          >
            <TiltedCard
              rotateAmplitude={8}
              scaleOnHover={1.02}
              containerClassName="h-full"
              className="h-full"
            >
              <BorderGlow
                glowColor={project.glowColor}
                spread={300}
                borderWidth={1}
                className="h-full"
              >
                <SpotlightCard
                  spotlightColor={project.spotlightColor}
                  className="p-0 overflow-hidden h-full flex flex-col group"
                >
                  <div className="relative h-64 overflow-hidden rounded-t-3xl">
                    <motion.div
                      className="absolute inset-0 bg-black/40 z-10"
                      whileHover={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    />
                    <ImageWithFallback 
                      src={project.image} 
                      alt={project.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter brightness-75 group-hover:brightness-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030305]/80 to-transparent z-10" />
                    <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-lg">
                      <project.icon className={`w-4 h-4 ${project.tagColor}`} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${project.tagColor}`}>
                        {project.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-8 flex-1 flex flex-col bg-gradient-to-b from-[#030305]/60 to-transparent backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-white tracking-tight">
                        <GradientText
                          colors={project.gradientColors}
                          animationSpeed={8}
                        >
                          {project.title}
                        </GradientText>
                      </h3>
                      <motion.button
                        className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 shadow-xl backdrop-blur-md"
                        whileHover={{ scale: 1.15, rotate: -15 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <ExternalLink className="w-5 h-5 text-white/90" />
                      </motion.button>
                    </div>
                    <p className="text-gray-400 leading-relaxed font-light">
                      {project.description}
                    </p>
                  </div>
                </SpotlightCard>
              </BorderGlow>
            </TiltedCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
