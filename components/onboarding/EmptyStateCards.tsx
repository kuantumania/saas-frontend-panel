"use client";

import { Upload, Users, Package, Settings } from "lucide-react";
import { motion } from "framer-motion";

export default function EmptyStateCards() {
  const cards = [
    {
      title: "Upload First Asset",
      description: "Drag and drop your fbx, obj, or image files.",
      icon: <Upload className="w-6 h-6 text-emerald-400" />,
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Create Rule Gate",
      description: "Define quality standards for your studio.",
      icon: <Settings className="w-6 h-6 text-indigo-400" />,
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      title: "Invite Artists",
      description: "Add team members & set permissions.",
      icon: <Users className="w-6 h-6 text-blue-400" />,
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "Connect Unity",
      description: "Link your engine for drag & drop magic.",
      icon: <Package className="w-6 h-6 text-purple-400" />,
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    }
  ];

  return (
    <div className="w-full mt-10">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-semibold text-white mb-2">Your workspace is ready</h2>
        <p className="text-white/50">To get the most out of Kuantum, complete these next steps.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-6 rounded-2xl border ${card.border} bg-[#1C1C1E] hover:bg-[#222224] transition-all cursor-pointer flex items-start gap-4 group`}
          >
            <div className={`p-4 rounded-xl ${card.bg} flex-shrink-0 group-hover:scale-105 transition-transform`}>
              {card.icon}
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-1">{card.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-4">{card.description}</p>
              <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                Get started &rarr;
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
