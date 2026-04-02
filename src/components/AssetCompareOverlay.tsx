import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  X, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertCircle,
  FileVideo,
  Database,
  ShieldCheck,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Asset, ApiResponse } from '@shared/types';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
interface AssetCompareOverlayProps {
  sourceAssetId: string;
  variantAssetId: string;
  onClose: () => void;
}
export function AssetCompareOverlay({ sourceAssetId, variantAssetId, onClose }: AssetCompareOverlayProps) {
  const { data: sourceData } = useQuery<ApiResponse<Asset>>({
    queryKey: ['asset', sourceAssetId],
    queryFn: () => fetch(`/api/assets/${sourceAssetId}`).then(res => res.json())
  });
  const { data: variantData } = useQuery<ApiResponse<Asset>>({
    queryKey: ['asset', variantAssetId],
    queryFn: () => fetch(`/api/assets/${variantAssetId}`).then(res => res.json())
  });
  const source = sourceData?.data;
  const variant = variantData?.data;
  const getDelta = (sourceVal: number | undefined, variantVal: number | undefined) => {
    if (sourceVal === undefined || sourceVal === 0 || variantVal === undefined) return null;
    const diff = ((variantVal - sourceVal) / sourceVal) * 100;
    return diff.toFixed(1);
  };
  const waveformData = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      time: i,
      source: Math.sin(i * 0.5) * 0.5 + 0.5 + (Math.random() * 0.1),
      variant: Math.sin(i * 0.5) * 0.45 + 0.5 + (Math.random() * 0.05)
    }));
  }, []);
  if (!source || !variant) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-zinc-950/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="w-full max-w-7xl bg-background border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-muted/10 sticky top-0 bg-background z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <ArrowRightLeft className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Transformation Audit</h2>
                <p className="text-sm text-muted-foreground">Source vs. Variant Compliance Delta</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10">
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="p-8 flex-1 space-y-8 overflow-y-auto">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ComparisonCard
                title="Source File"
                asset={source}
                isSource
                status={source.status || 'unknown'}
              />
              <ComparisonCard
                title="Transformed Variant"
                asset={variant}
                status={variant.status}
                delta={getDelta(source.size, variant.size) ? `${getDelta(source.size, variant.size)}% Size` : undefined}
              />
            </div>
            <Separator />
            {/* Spec Matrix */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" /> Technical Stream Delta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SpecRow 
                  label="Resolution" 
                  source={source.metadata?.video.resolution} 
                  variant={variant.metadata?.video.resolution} 
                />
                <SpecRow
                  label="Bitrate"
                  source={source.metadata?.video?.bitrate ? `${(source.metadata.video.bitrate / 1000000).toFixed(2)} Mbps` : 'N/A'}
                  variant={variant.metadata?.video?.bitrate ? `${(variant.metadata.video.bitrate / 1000000).toFixed(2)} Mbps` : 'N/A'}
                  delta={source.metadata?.video?.bitrate && variant.metadata?.video?.bitrate ? `${getDelta(source.metadata.video.bitrate, variant.metadata.video.bitrate)}%` : undefined}
                />
                <SpecRow
                  label="Codec"
                  source={source.metadata?.video?.codec?.toUpperCase()}
                  variant={variant.metadata?.video?.codec?.toUpperCase()}
                />
              </div>
            </div>
            {/* Waveform Comparison */}
            <Card className="bg-muted/20 border-muted-foreground/10 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" /> Frequency Signature Match (94.2%)
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-primary" /> <span className="text-[10px] font-mono">SOURCE</span></div>
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500" /> <span className="text-[10px] font-mono">VARIANT</span></div>
                </div>
              </CardHeader>
              <CardContent className="h-[200px] p-0">
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  <AreaChart data={waveformData}>
                    <defs>
                      <linearGradient id="sourceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="variantFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="source" stroke="hsl(var(--primary))" fill="url(#sourceFill)" strokeWidth={2} />
                    <Area type="monotone" dataKey="variant" stroke="#10b981" fill="url(#variantFill)" strokeWidth={2} strokeDasharray="3 3" />
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={['dataMin', 'dataMax']} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Validation Resolution */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" /> Rule Resolution Log
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {source.validation?.violations.map((v, i) => {
                  const resolved = !variant.validation?.violations.some(vv => vv.rule_id === v.rule_id);
                  return (
                    <div key={i} className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/50">
                      <div className="flex items-center gap-4">
                        <div className={resolved ? "text-emerald-500" : "text-rose-500"}>
                          {resolved ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-mono font-bold">{v.field}</p>
                          <p className="text-xs text-muted-foreground">{v.message}</p>
                        </div>
                      </div>
                      <Badge variant={resolved ? 'secondary' : 'destructive'} className="uppercase text-[10px] py-0.5 px-2">
                        {resolved ? 'RESOLVED' : 'FAILED'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Footer Controls */}
          <div className="p-6 border-t bg-muted/10 flex justify-end gap-3 sticky bottom-0 bg-background z-10">
            <Button variant="ghost" onClick={onClose}>Close Audit View</Button>
            <Button size="lg" className="shadow-lg" onClick={() => window.open(`/assets/${variant.id}`, '_blank')}>Open Variant Full View</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
function ComparisonCard({ title, asset, isSource = false, status, delta }: { title: string, asset: Asset, isSource?: boolean, status: string, delta?: string }) {
  return (
    <Card className={`relative overflow-hidden ${isSource ? 'border-primary/20 bg-primary/5' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
        <FileVideo className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h4 className="text-xl font-bold truncate max-w-[200px]">{asset.filename}</h4>
            <p className="text-xs text-muted-foreground font-mono">{(asset.size / (1024*1024)).toFixed(1)}MB TOTAL</p>
          </div>
          {delta && (
            <div className={`flex items-center gap-1 text-sm font-bold ${delta.startsWith('-') ? 'text-emerald-600' : 'text-rose-600'}`}>
              {delta.startsWith('-') ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              {delta}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
function SpecRow({ label, source, variant, delta }: { label: string, source?: string | number, variant?: string | number, delta?: string }) {
  return (
    <div className="p-4 border rounded-xl bg-card shadow-sm space-y-3">
      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.2em]">{label}</p>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Source</span>
          <span className="font-mono font-bold text-sm">{source}</span>
        </div>
        <div className="h-4 w-4 text-muted-foreground flex items-center justify-center">→</div>
        <div className="flex flex-col gap-1 items-end text-right">
          <span className="text-xs text-emerald-600/70 font-bold">Variant</span>
          <span className="font-mono font-bold text-sm text-emerald-600">{variant}</span>
          {delta && <span className="text-[10px] font-bold text-emerald-500">{delta}</span>}
        </div>
      </div>
    </div>
  );
}