import React from "react";
import { motion } from "motion/react";
import { Globe, ShoppingCart, Zap, ArrowRight, Bot, Layers } from "lucide-react";
import SpotlightCard from "./react-bits/SpotlightCard";
import BorderGlow from "./react-bits/BorderGlow";
import SplitText from "./react-bits/SplitText";

const services = [
  {
    title: "Landing Pages & Websites",
    description: "High-performance, visually stunning digital experiences designed to convert visitors into customers. Built with speed and SEO in mind.",
    icon: Globe,
    color: "from-blue-500/20 to-cyan-500/20",
    accent: "bg-blue-500",
  },
  {
    title: "E-commerce Solutions",
    description: "Scalable online stores with seamless checkout flows and robust architecture. Focused on user experience and driving sales growth.",
    icon: ShoppingCart,
    color: "from-purple-500/20 to-pink-500/20",
    accent: "bg-purple-500",
  },
  {
    title: "AI & Chatbots",
    description: "Intelligent automation using custom AI agents and LLMs. Enhancing customer support and streamlining complex business operations.",
    icon: Bot,
    color: "from-green-500/20 to-emerald-500/20",
    accent: "bg-green-500",
  },
  {
    title: "Custom API & Systems",
    description: "Complex integrations and scalable backend systems. Automating workflows and connecting your business tools for maximum efficiency.",
    icon: Zap,
    color: "from-amber-500/20 to-orange-500/20",
    accent: "bg-amber-500",
  },
];

export function Services() {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-blue-600/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-purple-600/5 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tighter uppercase flex items-center justify-center flex-wrap gap-y-4">
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mr-4 text-blue-500"
          >
            <Layers className="w-16 h-16" />
          </motion.div>

          <SplitText
            text="How I can"
            delay={30}
            animationFrom={{ opacity: 0, transform: "translate3d(0, 30px, 0)" }}
            animationTo={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
          />

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              delay: 0.1,
            }}
            className="mx-4 md:mx-8 w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.8)]"
          />

          <span className="text-white/40">
            <SplitText
              text="help you."
              delay={30}
              animationFrom={{ opacity: 0, transform: "translate3d(0, 30px, 0)" }}
              animationTo={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
            />
          </span>
        </h2>
          
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            From initial concept to production-ready platforms, I deliver high-end technical solutions tailored to your business goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: idx * 0.1 }}
            >
              <BorderGlow glowColor="rgba(59, 130, 246, 0.2)" glowRadius={200}>
                <SpotlightCard className="h-full p-8 flex flex-col items-start text-left" spotlightColor="rgba(59, 130, 246, 0.05)">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${service.color} border border-white/5 mb-6`}>
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
                    {service.title}
                  </h3>
                  
                  <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-1">
                    {service.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm font-bold text-blue-400 uppercase tracking-widest group cursor-pointer hover:text-blue-300 transition-colors">
                    Learn More
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </SpotlightCard>
              </BorderGlow>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
