import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Book,
  Search,
  Printer,
  ChevronRight,
  Database,
  ShieldCheck,
  Zap,
  Terminal,
  FileJson,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
const SECTIONS = [
  {
    id: 'ingest',
    title: 'File Ingestion',
    icon: Database,
    content: 'VideoMeta Pro supports high-throughput file ingestion for enterprise AV workflows. Drag and drop assets directly into the dashboard. The system creates a unique digital fingerprint for every file, mapping it to a storage path and initializing the deterministic probe thread.'
  },
  {
    id: 'validation',
    title: 'Validation Engine',
    icon: ShieldCheck,
    content: 'The core of our platform. Validation runs are executed inside a secure Durable Object environment. We measure every stream attribute—bitrate, GOP structure, codec profile—against your defined compliance rules. Results are classified as Pass, Warning, or Critical Failure.'
  },
  {
    id: 'profiles',
    title: 'Compliance Profiles',
    icon: Layers,
    content: 'Profiles are deterministic sets of rules. Create custom profiles for specific hardware players (e.g., Retail 1080p, Stadium 4K). Each rule within a profile provides a human-readable reason and a deterministic fix command, ensuring engineers know exactly why an asset failed.'
  },
  {
    id: 'transform',
    title: 'Transformations',
    icon: Zap,
    content: 'The Remediation engine uses FFmpeg-powered deterministic re-encoding. If an asset fails compliance, the transform tool generates a compliant variant by applying the precise parameters required by the target profile. This eliminates the trial-and-error cycle of manual transcoding.'
  },
  {
    id: 'api',
    title: 'System API',
    icon: Terminal,
    content: 'Integrate VideoMeta Pro into your existing automation pipelines. Our REST API exposes endpoints for batch ingestion, job auditing, and profile management. Every action is logged in our enterprise job history for full audit transparency.'
  },
  {
    id: 'export',
    title: 'Reporting & Export',
    icon: FileJson,
    content: 'Generate professional Technical Compliance Certificates (PDF) for any asset. Batch export asset metadata in CSV or JSON formats for inventory management and compliance reporting.'
  }
];
export function ManualPage() {
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const filteredSections = SECTIONS.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    s.content.toLowerCase().includes(search.toLowerCase())
  );
  const handlePrint = () => window.print();
  return (
    <AppLayout>
      <div className="space-y-8 print:block">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight">User Manual</h1>
            <p className="text-muted-foreground text-lg">Comprehensive platform documentation and operational guidance.</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print PDF
          </Button>
        </div>
        <div className="relative max-w-2xl print:hidden">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search manual (e.g. 'bitrate', 'transcode')..." 
            className="pl-12 h-14 text-lg bg-card rounded-2xl shadow-sm border-muted-foreground/20"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sticky Sidebar Navigation */}
          <aside className="lg:col-span-3 space-y-2 sticky top-20 h-fit print:hidden">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4 px-4">Documentation Map</p>
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  activeSection === section.id 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <section.icon className="h-4 w-4" />
                {section.title}
                <ChevronRight className={cn("ml-auto h-4 w-4 transition-transform", activeSection === section.id ? "rotate-90" : "")} />
              </button>
            ))}
          </aside>
          {/* Documentation Content */}
          <div className="lg:col-span-9 space-y-12">
            {filteredSections.map((section) => (
              <Card 
                key={section.id} 
                id={section.id}
                className={cn(
                  "border-none shadow-none bg-transparent scroll-mt-24 transition-opacity",
                  activeSection !== section.id && "opacity-40 hover:opacity-100 hidden md:block print:opacity-100 print:block"
                )}
              >
                <CardContent className="p-0 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-primary">
                      <section.icon className="h-6 w-6" />
                    </div>
                    <h2 className="text-3xl font-bold">{section.title}</h2>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                    {section.content}
                  </p>
                  <div className="p-6 bg-muted/30 rounded-2xl border border-dashed font-mono text-xs text-muted-foreground">
                    REFERENCE_TAG: PRO_DOC_{section.id.toUpperCase()} v5.1
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredSections.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed rounded-3xl space-y-4">
                <Book className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">No documentation found for "{search}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}