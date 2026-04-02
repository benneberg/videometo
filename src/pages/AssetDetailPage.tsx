import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, type StatusType } from '@/components/ui/status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  FileText, 
  Activity, 
  ShieldAlert, 
  RefreshCw, 
  Terminal,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Asset, ApiResponse } from '@shared/types';
import { toast } from 'sonner';
export function AssetDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<ApiResponse<Asset>>({
    queryKey: ['asset', id],
    queryFn: () => fetch(`/api/assets/${id}`).then(res => res.json()),
    enabled: !!id,
    refetchInterval: (query) => {
      const asset = query.state.data?.data;
      return (asset?.status === 'processing' || asset?.status === 'queued') ? 1000 : false;
    }
  });
  const revalidateMutation = useMutation({
    mutationFn: () => fetch('/api/assets/batch', {
      method: 'POST',
      body: JSON.stringify({ assetIds: [id], action: 'validate' })
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
      toast.success("Validation re-queued");
    }
  });
  const asset = data?.data;
  const chartData = useMemo(() => {
    if (!asset?.metadata?.video?.bitrate) return [];
    const base = asset.metadata.video.bitrate / 1000000;
    return Array.from({ length: 20 }).map((_, i) => ({
      time: `${i}s`,
      bitrate: Number((base + (Math.random() * 2 - 1)).toFixed(2))
    }));
  }, [asset]);
  if (isLoading) return <AppLayout><div className="animate-pulse py-12 text-center text-muted-foreground">Analysing binary streams...</div></AppLayout>;
  if (!asset) return <AppLayout><div className="py-12 text-center">Asset not found or access denied.</div></AppLayout>;
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Link to="/assets" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back to Library
          </Link>
          <Button variant="outline" size="sm" onClick={() => revalidateMutation.mutate()} disabled={revalidateMutation.isPending || asset.status === 'processing'}>
            <RefreshCw className={`mr-2 h-4 w-4 ${revalidateMutation.isPending || asset.status === 'processing' ? 'animate-spin' : ''}`} />
            Re-run Validation
          </Button>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight font-mono">{asset.filename}</h1>
              <Badge variant="secondary" className="font-mono text-xs">{asset.metadata?.video.format.toUpperCase() || 'RAW'}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">UID: <span className="font-mono opacity-60">{asset.id}</span></p>
          </div>
          <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
            <div className="text-right">
              <p className="text-2xs font-bold text-muted-foreground uppercase tracking-widest">Compliance Status</p>
              <p className="text-xs text-muted-foreground mt-0.5">Profile: {asset.profile_id || "Global Default"}</p>
            </div>
            <StatusBadge status={asset.status as StatusType} className="scale-110 px-4 h-8" />
          </div>
        </div>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-[540px] h-12 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Activity className="h-4 w-4 mr-2" /> Summary</TabsTrigger>
            <TabsTrigger value="metadata" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><FileText className="h-4 w-4 mr-2" /> Technical Specs</TabsTrigger>
            <TabsTrigger value="validation" className="data-[state=active]:bg-background data-[state=active]:shadow-sm relative">
              <ShieldAlert className="h-4 w-4 mr-2" />
              Validation
              {asset.validation?.violations.length ? (
                <span className="ml-2 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {asset.validation.violations.length}
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" /> Bitrate Distribution (Simulated)
                  </CardTitle>
                  <span className="text-2xs font-mono text-muted-foreground">SAMPLE_RATE: 1Hz</span>
                </CardHeader>
                <CardContent className="h-[240px] pt-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorBitrate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis dataKey="time" hide />
                      <YAxis domain={['auto', 'auto']} fontSize={10} tickFormatter={(val) => `${val}M`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="bitrate" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorBitrate)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500" /> Remediation Logic</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                     <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Recommended Action</p>
                     <p className="text-sm">
                       {asset.status === 'pass' 
                         ? "No remediation required. Asset is production-ready."
                         : "Check specific rule violations in the Validation tab for ffmpeg commands."}
                     </p>
                   </div>
                   <div className="text-2xs text-muted-foreground leading-relaxed">
                     Automated remediation guidance is based on deterministic profile deltas. Ensure target playback hardware supports calculated bitrates.
                   </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardContent className="p-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                  {[
                    { label: 'Resolution', value: asset.metadata?.video.resolution },
                    { label: 'Frame Rate', value: asset.metadata?.video.fps ? `${asset.metadata.video.fps} FPS` : undefined },
                    { label: 'Bitrate', value: asset.metadata?.video.bitrate ? `${(asset.metadata.video.bitrate / 1000000).toFixed(2)} Mbps` : undefined },
                    { label: 'Duration', value: asset.metadata?.video.duration ? `${asset.metadata.video.duration}s` : undefined },
                  ].map((spec, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-2xs font-bold text-muted-foreground uppercase tracking-widest">{spec.label}</p>
                      <p className="text-xl font-mono font-bold">{spec.value ?? 'PENDING'}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="metadata" className="pt-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MetadataSection title="Video Stream (0)" data={asset.metadata?.video} />
                <MetadataSection title="Audio Stream (1)" data={asset.metadata?.audio} />
             </div>
          </TabsContent>
          <TabsContent value="validation" className="space-y-4 pt-6">
            {!asset.validation || asset.validation.violations.length === 0 ? (
              <Alert className="bg-emerald-500/5 border-emerald-500/20 py-10 flex flex-col items-center text-center">
                <ShieldAlert className="h-10 w-10 text-emerald-600 mb-4" />
                <AlertTitle className="text-emerald-800 text-xl font-bold">Compliant Asset</AlertTitle>
                <AlertDescription className="text-emerald-700/80 max-w-lg mt-2">
                  Validation complete. This asset satisfies 100% of the deterministic rules defined in <strong>{asset.profile_id || 'System Default'}</strong>.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {asset.validation.violations.map((v, i) => (
                  <Card key={i} className={`overflow-hidden border-l-4 ${v.severity === 'critical' ? 'border-l-rose-500 shadow-sm shadow-rose-500/5' : 'border-l-amber-500 shadow-sm shadow-amber-500/5'}`}>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={v.severity === 'critical' ? 'destructive' : 'outline'} className="uppercase text-[10px] font-bold">
                              {v.severity}
                            </Badge>
                            <h3 className="font-mono text-lg font-bold">{v.field}</h3>
                          </div>
                          <p className="text-muted-foreground text-sm">{v.message}</p>
                        </div>
                        <div className="text-right hidden sm:block">
                           <p className="text-2xs font-mono text-muted-foreground">RULE_UID: {v.rule_id}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                          <p className="text-2xs font-bold text-muted-foreground uppercase mb-2">Detected Value</p>
                          <p className="font-mono text-rose-600 text-lg font-bold">{String(v.actual)}</p>
                        </div>
                        <div className="bg-emerald-500/5 p-4 rounded-lg border border-emerald-500/20">
                          <p className="text-2xs font-bold text-emerald-600/70 uppercase mb-2">Profile Requirement</p>
                          <p className="font-mono text-emerald-600 text-lg font-bold">{String(v.expected)}</p>
                        </div>
                      </div>
                      <div className="bg-zinc-950 rounded-xl p-5 text-zinc-300 ring-1 ring-white/10">
                        <div className="flex items-center gap-2 mb-3 text-zinc-500">
                          <Terminal className="h-4 w-4" />
                          <span className="text-xs font-mono font-bold tracking-widest uppercase">Remediation Script</span>
                        </div>
                        <code className="text-sm font-mono block whitespace-pre-wrap leading-relaxed text-zinc-100">
                          {v.fix}
                        </code>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
function MetadataSection({ title, data }: { title: string, data: any }) {
  if (!data) return null;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30 py-4">
        <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/40">
          {Object.entries(data).map(([k, v]) => (
            <div key={k} className="flex justify-between items-center px-6 py-3.5 hover:bg-muted/10 transition-colors">
              <span className="text-sm text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
              <span className="font-mono text-sm font-bold">{String(v)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}