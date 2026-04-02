import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, Download, ShieldCheck, FileText, CheckCircle2, XCircle, Info } from "lucide-react";
import type { Asset, Profile } from "@shared/types";
import { format } from "date-fns";
interface ComplianceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
  profile?: Profile;
}
export function ComplianceReportModal({ isOpen, onClose, asset, profile }: ComplianceReportModalProps) {
  const handlePrint = () => {
    window.print();
  };
  const violations = asset.validation?.violations || [];
  const hasFailures = violations.some(v => v.severity === 'critical');
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="p-8 print:p-0" id="report-content">
          <header className="flex justify-between items-start mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 bg-black text-white rounded flex items-center justify-center font-bold">V</div>
                <h1 className="text-2xl font-bold tracking-tight">VideoMeta Pro</h1>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Technical Compliance Certificate</p>
            </div>
            <div className="text-right space-y-1">
              <Badge variant={hasFailures ? "destructive" : "secondary"} className="h-8 px-4 text-sm font-bold">
                {hasFailures ? "NON-COMPLIANT" : "COMPLIANT"}
              </Badge>
              <p className="text-xs text-muted-foreground font-mono">GEN_ID: {asset.id.slice(0, 12)}</p>
            </div>
          </header>
          <section className="grid grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase text-muted-foreground border-b pb-2">Asset Details</h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-muted-foreground">Filename</span>
                <span className="font-medium text-right truncate">{asset.filename}</span>
                <span className="text-muted-foreground">File Size</span>
                <span className="font-medium text-right">{(asset.size / (1024 * 1024)).toFixed(2)} MB</span>
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium text-right">{format(new Date(asset.created_at), 'PPP')}</span>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase text-muted-foreground border-b pb-2">Validation Context</h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-muted-foreground">Profile</span>
                <span className="font-medium text-right">{profile?.name || "N/A"}</span>
                <span className="text-muted-foreground">Rules Evaluated</span>
                <span className="font-medium text-right">{profile?.rules.length || 0}</span>
                <span className="text-muted-foreground">Validated At</span>
                <span className="font-medium text-right">{asset.validation ? format(new Date(asset.validation.validated_at), 'HH:mm:ss') : 'N/A'}</span>
              </div>
            </div>
          </section>
          <section className="mb-8">
            <h3 className="text-sm font-bold uppercase text-muted-foreground mb-4">Stream Summary</h3>
            <div className="bg-muted/30 rounded-xl p-6 grid grid-cols-4 gap-4 border border-border/50">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Codec</p>
                <p className="text-sm font-mono font-bold">{asset.metadata?.video.codec.toUpperCase()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Resolution</p>
                <p className="text-sm font-mono font-bold">{asset.metadata?.video.resolution}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Bitrate</p>
                <p className="text-sm font-mono font-bold">{( (asset.metadata?.video.bitrate ?? 0) / 1000000).toFixed(1)} Mbps</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Frame Rate</p>
                <p className="text-sm font-mono font-bold">{asset.metadata?.video.fps} FPS</p>
              </div>
            </div>
          </section>
          <Separator className="my-8" />
          <section className="space-y-6">
            <h3 className="text-lg font-bold">Violation Audit Log</h3>
            {violations.length === 0 ? (
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">All technical constraints satisfied. No violations detected.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {violations.map((v, i) => (
                  <div key={i} className="p-4 border rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {v.severity === 'critical' ? <XCircle className="h-4 w-4 text-rose-500" /> : <Info className="h-4 w-4 text-amber-500" />}
                        <span className="text-sm font-mono font-bold">{v.field}</span>
                      </div>
                      <Badge variant={v.severity === 'critical' ? 'destructive' : 'outline'} className="text-[10px]">
                        {v.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm">{v.message}</p>
                    {v.reason && (
                      <div className="bg-muted/50 p-3 rounded text-xs italic text-muted-foreground">
                        <strong>Rationale:</strong> {v.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
          <footer className="mt-12 pt-8 border-t text-[10px] text-muted-foreground flex justify-between uppercase font-mono tracking-widest">
            <span>VideoMeta Reporting Engine v5.1.0</span>
            <span>Digital Fingerprint: {asset.id.slice(0, 16)}</span>
          </footer>
        </div>
        <DialogFooter className="bg-muted/50 p-4 border-t sticky bottom-0">
          <Button variant="ghost" onClick={onClose}>Close Report</Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" /> Print PDF
            </Button>
            <Button size="sm" className="gap-2">
              <Download className="h-4 w-4" /> Export Data
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}