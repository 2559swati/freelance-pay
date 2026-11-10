// src/components/Hero.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Steps with emojis for a cutesy feel
const steps = [
  "🛠️ Client creates a job and locks funds",
  "📤 Freelancer submits work (IPFS CID)",
  "✅ Client approves and releases payment",
  "⚖️ Dispute can be resolved by arbitrator",
];

const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden min-h-[80vh] flex flex-col justify-center items-center text-center py-12 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
      {/* Animated floating orbs background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="orb bg-indigo-500 opacity-30 rounded-full absolute"
            style={{
              width: `${Math.random() * 120 + 80}px`,
              height: `${Math.random() * 120 + 80}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 20 + 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Main headline with emoji and pulse animation */}
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 animate-pulse">
        🌟 Freelance Without Boundaries 🌟
      </h1>
      <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl">
        Work smarter. Get paid securely. Build trust with blockchain‑powered freelance payments.
      </p>

      {/* Steps appear with staggered animation */}
      <motion.div
        className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.2 } },
        }}
      >
        {steps.map((s, i) => (
          <motion.div
            key={i}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center text-white"
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            <span className="text-primary font-bold mr-2 text-2xl">{i + 1}.</span>
            <span>{s}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA buttons with cute emojis */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => navigate("/create")}
          className="bg-primary text-white px-6 py-3 rounded-full shadow-lg hover:bg-indigo-700 transition transform hover:scale-105"
        >
          I'm a Client 🚀
        </button>
        <button
          onClick={() => navigate("/my-jobs")}
          className="bg-gray-200 text-gray-800 px-6 py-3 rounded-full shadow hover:bg-gray-300 transition transform hover:scale-105"
        >
          I'm a Freelancer 🎯
        </button>
      </div>
    </section>
  );
};

export default Hero;
