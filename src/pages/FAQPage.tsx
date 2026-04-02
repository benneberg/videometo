import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Terminal, ShieldAlert, Cpu } from 'lucide-react';
const FAQ_DATA = [
  {
    category: "Technical Analysis",
    icon: Cpu,
    items: [
      {
        q: "How accurate is the metadata extraction?",
        a: "VideoMeta Pro uses a deterministic probe engine that simulates industry-standard ffprobe behavior. It analyzes both container headers and elementary stream attributes to provide engineering-grade metadata."
      },
      {
        q: "What file formats are currently supported?",
        a: "We currently support MP4, MOV, and MXF containers with common professional codecs like H.264, H.265 (HEVC), and Apple ProRes."
      }
    ]
  },
  {
    category: "Compliance & Rules",
    icon: ShieldAlert,
    items: [
      {
        q: "What is the difference between Warning and Critical severity?",
        a: "Critical failures indicate an asset will not play back on the target hardware (e.g., wrong codec). Warnings indicate sub-optimal conditions (e.g., bitrate higher than recommended but still playable)."
      },
      {
        q: "Can I define custom validation rules?",
        a: "Yes, via the Profiles Manager. You can define rules for any technical field, including resolution bounds, bitrate limits, and required frame rates."
      }
    ]
  },
  {
    category: "Workflow & Jobs",
    icon: Terminal,
    items: [
      {
        q: "Why do some jobs take longer to process?",
        a: "Transformation jobs (Remediation) require deterministic re-encoding of the video stream, which is more resource-intensive than simple metadata extraction."
      },
      {
        q: "How do I export a compliance report for a client?",
        a: "Navigate to the Asset Detail page and click 'Export Audit'. This generates a formal Technical Compliance Certificate in PDF format."
      }
    ]
  }
];
export function FAQPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto">
            <HelpCircle className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Platform FAQ</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Frequently asked questions about technical compliance, validation rules, and transformation logic.
          </p>
        </div>
        <div className="space-y-10">
          {FAQ_DATA.map((group, i) => (
            <div key={i} className="space-y-6">
              <div className="flex items-center gap-3 px-4">
                <group.icon className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold uppercase tracking-widest text-muted-foreground text-sm">
                  {group.category}
                </h2>
              </div>
              <div className="grid gap-4">
                <Accordion type="single" collapsible className="w-full space-y-3">
                  {group.items.map((item, j) => (
                    <AccordionItem 
                      key={j} 
                      value={`item-${i}-${j}`}
                      className="bg-card border rounded-2xl px-6 py-1 shadow-sm overflow-hidden"
                    >
                      <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-zinc-950 p-8 rounded-3xl text-center space-y-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-mesh opacity-10 pointer-events-none" />
          <h3 className="text-white text-xl font-bold relative z-10">Still have technical questions?</h3>
          <p className="text-zinc-400 relative z-10">Our engineering team is available for deep-dive technical support.</p>
          <Button className="bg-white text-black hover:bg-zinc-200 relative z-10 px-8">
            Contact System Administrator
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}