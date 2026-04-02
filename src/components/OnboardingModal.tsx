import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  Search,
  ShieldCheck,
  Zap,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
const STEPS = [
  {
    title: "Welcome to VideoMeta Pro",
    description: "Enterprise-grade technical compliance for mission-critical video workflows. Automate validation, extraction, and remediation.",
    icon: ShieldCheck,
    color: "bg-blue-500"
  },
  {
    title: "Step 1: File Ingestion",
    description: "Drop your files into the Dashboard. Our deterministic engine instantly begins deep probing of video and audio bitstreams.",
    icon: UploadCloud,
    color: "bg-emerald-500"
  },
  {
    title: "Step 2: Validation",
    description: "Assets are measured against strict technical profiles. We detect codec mismatches, bitrate spikes, and resolution errors.",
    icon: Search,
    color: "bg-amber-500"
  },
  {
    title: "Step 3: Remediation",
    description: "Not compliant? Use our built-in transformation engine to re-encode assets into deterministic, profile-perfect variants.",
    icon: Zap,
    color: "bg-indigo-500"
  }
];
export function OnboardingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const next = () => setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setCurrentStep(s => Math.max(s - 1, 0));
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-transparent shadow-none ring-0">
        <div className="relative bg-zinc-950 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-mesh opacity-20 pointer-events-none" />
          <div className="p-12 relative z-10 flex flex-col items-center text-center">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 py-8"
              >
                <div className={`h-20 w-20 rounded-2xl ${STEPS[currentStep].color} flex items-center justify-center mx-auto shadow-2xl shadow-current/20`}>
                  {React.createElement(STEPS[currentStep].icon, { className: "h-10 w-10 text-white" })}
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-white tracking-tight">{STEPS[currentStep].title}</h2>
                  <p className="text-zinc-400 text-lg leading-relaxed max-w-md mx-auto">
                    {STEPS[currentStep].description}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center gap-2 mb-12">
              {STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-white' : 'w-2 bg-zinc-800'}`}
                />
              ))}
            </div>
            <div className="flex justify-between w-full pt-8 border-t border-white/5">
              <Button variant="ghost" className="text-zinc-500 hover:text-white" onClick={prev} disabled={currentStep === 0}>
                <ChevronLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
              {currentStep === STEPS.length - 1 ? (
                <Button className="bg-white text-black hover:bg-zinc-200 px-8" onClick={onClose}>
                  Get Started
                </Button>
              ) : (
                <Button className="bg-white text-black hover:bg-zinc-200 px-8" onClick={next}>
                  Next <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}