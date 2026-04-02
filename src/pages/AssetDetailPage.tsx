import React, { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, type StatusType } from '@/components/ui/status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ChevronLeft,
  FileText,
  Activity,
  ShieldAlert,
  RefreshCw,
  Terminal,
  BarChart3,
  Lightbulb,
  GitBranch,
  ArrowRightLeft,
  Zap,
  Play
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Asset, ApiResponse, Profile } from '@shared/types';
import { toast } from 'sonner';
import { AssetCompareOverlay } from '@/components/AssetCompareOverlay';
export function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareAssetId, setCompareAssetId] = useState<string | null>(null);
  const [isTransformDialogOpen, setIsTransformDialogOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const { data, isLoading } = useQuery<ApiResponse<Asset>>({
    queryKey: ['asset', id],
    queryFn: () => fetch(`/api/assets/${id}`).then(res => res.json()),
    enabled: !!id,
    refetchInterval: (query) => {
      const asset = query.state.data?.data;
      return (asset?.status === 'processing' || asset?.status === 'queued' || asset?.status === 'transcoding') ? 1000 : false;
    }
  });
  const { data: variantsData } = useQuery<ApiResponse<Asset[]>>({
    queryKey: ['asset-variants', id],
    queryFn: () => fetch(`/api/assets/${id}/variants`).then(res => res.json()),
    enabled: !!id,
    refetchInterval: (query) => {
      const items = query.state.data?.data || [];
      return items.some(a => a.status === 'transcoding') ? 2000 : false;
    }
  });
  const { data: profilesData } = useQuery<ApiResponse<Profile[]>>({
    queryKey: ['profiles'],
    queryFn: () => fetch('/api/profiles').then(res => res.json())
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
  const transformMutation = useMutation({
    mutationFn: (profileId: string) => fetch(`/api/assets/${id}/transform`, {
      method: 'POST',
      body: JSON.stringify({ targetProfileId: profileId })
    }).then(res => res.json()),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['asset-variants', id] });
      setIsTransformDialogOpen(false);
      toast.success("Transformation job initiated");
      if (res.data?.id) navigate(`/assets/${res.data.id}`);
    }
  });
  const asset = data?.data;
  const variants = variantsData?.data ?? [];
  const profiles = profilesData?.data ?? [];
  const chartData = useMemo(() => {
    if (!asset?.metadata?.video?.bitrate) return [];
    const base = asset.metadata.video.bitrate / 1000000;
    return Array.from({ length: 20 }).map((_, i) => ({
      time: `${i}s`,
      bitrate: Number((base + (Math.random() * 2 - 1)).toFixed(2))
    }));
  }, [asset]);
  if (isLoading) return <AppLayout><div className="animate-pulse py-12 text-center text-muted-foreground">Analysing streams...</div></AppLayout>;
  if (!asset) return <AppLayout><div className="py-12 text-center">Asset not found.</div></AppLayout>;
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Link to="/assets" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back to Library
          </Link>
          <div className="flex gap-2">
            <Dialog open={isTransformDialogOpen} onOpenChange={setIsTransformDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Zap className="h-4 w-4" /> Transform
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Initiate Transformation</DialogTitle>
                </DialogHeader>
                <div className="py-6 space-y-4">
                  <Label>Target Compliance Profile</Label>
                  <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                    <SelectTrigger><SelectValue placeholder="Select a profile..." /></SelectTrigger>
                    <SelectContent>
                      {profiles.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Transcoding will create a new variant of this asset aligned with the selected profile rules.</p>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsTransformDialogOpen(false)}>Cancel</Button>
                  <Button onClick={() => transformMutation.mutate(selectedProfileId)} disabled={!selectedProfileId || transformMutation.isPending}>
                    {transformMutation.isPending ? "Starting..." : "Run Job"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={() => revalidateMutation.mutate()} disabled={revalidateMutation.isPending || asset.status === 'processing'}>
              <RefreshCw className={`mr-2 h-4 w-4 ${revalidateMutation.isPending || asset.status === 'processing' ? 'animate-spin' : ''}`} />
              Re-run Validation
            </Button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight font-mono">{asset.filename}</h1>
              <Badge variant="secondary" className="font-mono text-xs">{asset.metadata?.video.format.toUpperCase() || 'RAW'}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {asset.parent_id && (
                <Link to={`/assets/${asset.parent_id}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                  <GitBranch className="h-3 w-3" /> Derived from parent
                </Link>
              )}
              <span className="opacity-60">UID: <span className="font-mono">{asset.id.slice(0, 8)}</span></span>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
            <div className="text-right">
              <p className="text-2xs font-bold text-muted-foreground uppercase tracking-widest">Compliance Status</p>
              <p className="text-xs text-muted-foreground mt-0.5">Profile: {profiles.find(p => p.id === asset.profile_id)?.name || "Global Default"}</p>
            </div>
            <StatusBadge status={asset.status as StatusType} className="scale-110 px-4 h-8" />
          </div>
        </div>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-[720px] h-12 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="gap-2"><Activity className="h-4 w-4" /> Summary</TabsTrigger>
            <TabsTrigger value="metadata" className="gap-2"><FileText className="h-4 w-4" /> Technical Specs</TabsTrigger>
            <TabsTrigger value="validation" className="gap-2 relative">
              <ShieldAlert className="h-4 w-4" /> Validation
              {asset.validation?.violations.length ? (
                <span className="ml-2 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {asset.validation.violations.length}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="lineage" className="gap-2"><GitBranch className="h-4 w-4" /> Lineage & Variants</TabsTrigger>
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
                         : "Transform this asset to the target profile to resolve compliance violations automatically."}
                     </p>
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
          <TabsContent value="lineage" className="pt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Parent Asset</CardTitle>
                </CardHeader>
                <CardContent>
                  {asset.parent_id ? (
                    <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/assets/${asset.parent_id}`)}>
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/5 rounded-lg text-primary"><Play className="h-5 w-5" /></div>
                        <div>
                          <p className="font-medium">Original Source</p>
                          <p className="text-xs text-muted-foreground font-mono">UID: {asset.parent_id.slice(0, 12)}...</p>
                        </div>
                      </div>
                      <StatusBadge status="pass" />
                    </div>
                  ) : (
                    <div className="py-8 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                      This is a root-level master asset.
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generated Variants</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {variants.length === 0 ? (
                    <div className="py-8 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                      No variants generated yet. Use 'Transform' to create one.
                    </div>
                  ) : (
                    variants.map(v => (
                      <div key={v.id} className="flex items-center justify-between p-4 border rounded-xl group hover:border-primary/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${v.status === 'transcoding' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/5 text-primary'}`}>
                            {v.status === 'transcoding' ? <RefreshCw className="h-5 w-5 animate-spin" /> : <GitBranch className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm truncate max-w-[200px]">{v.filename}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{(v.size / (1024*1024)).toFixed(1)}MB • {profiles.find(p => p.id === v.profile_id)?.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={v.status as StatusType} />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setCompareAssetId(v.id);
                              setIsCompareOpen(true);
                            }}
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
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
                  Asset satisfies all rules for <strong>{profiles.find(p => p.id === asset.profile_id)?.name || 'System Default'}</strong>.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {asset.validation.violations.map((v, i) => (
                  <Card key={i} className={`overflow-hidden border-l-4 ${v.severity === 'critical' ? 'border-l-rose-500' : 'border-l-amber-500'}`}>
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
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-muted/50 p-4 rounded-lg border">
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
      {isCompareOpen && compareAssetId && (
        <AssetCompareOverlay 
          sourceAssetId={id!} 
          variantAssetId={compareAssetId} 
          onClose={() => setIsCompareOpen(false)} 
        />
      )}
    </AppLayout>
  );
}
function MetadataSection({ title, data }: { title: string, data: any }) {
  if (!data) return null;
  return (
    <Card className="overflow-hidden shadow-sm">
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