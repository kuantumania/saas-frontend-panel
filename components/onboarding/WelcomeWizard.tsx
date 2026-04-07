"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Upload, Users, Package, X } from "lucide-react";

interface WelcomeWizardProps {
  studioName: string;
  onComplete: () => void;
  onSkip: () => void;
}

export default function WelcomeWizard({ studioName, onComplete, onSkip }: WelcomeWizardProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: `Welcome to ${studioName || "Kuantum"}!`,
      description: "Let's get your studio set up for the fastest Unity asset pipeline. It will only take a minute.",
      icon: <Package className="w-12 h-12 text-indigo-400" />,
      actionText: "Get Started",
    },
    {
      title: "Invite your team",
      description: "Asset management is better together. We'll set up your first member role.",
      icon: <Users className="w-12 h-12 text-blue-400" />,
      actionText: "Next: Your First Asset",
    },
    {
      title: "Upload & Verify automatically",
      description: "Upload an asset. Our Tech Art AI and Rules Engine will immediately check it against your studio quality gates.",
      icon: <Upload className="w-12 h-12 text-emerald-400" />,
      actionText: "Next: Unity Sync",
    },
    {
      title: "Sync to Unity",
      description: "Approved assets appear instantly in your Unity project, correctly organized. No Git LFS headaches.",
      icon: <Check className="w-12 h-12 text-purple-400" />,
      actionText: "Go to Dashboard",
    }
  ];

  const handleNext = () => {
    if (step === steps.length - 1) {
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#161618] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative"
      >
        <button 
          onClick={onSkip}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-white/5">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: "0%" }}
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-8 pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center mt-4"
            >
              <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                {steps[step].icon}
              </div>
              
              <h2 className="text-2xl font-semibold text-white mb-3">
                {steps[step].title}
              </h2>
              
              <p className="text-white/60 mb-10 leading-relaxed max-w-sm">
                {steps[step].description}
              </p>

              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-xl font-medium hover:bg-neutral-200 transition-all active:scale-95"
              >
                {steps[step].actionText}
                {step < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
