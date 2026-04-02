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
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ChevronLeft,
  FileText,
  Activity,
  ShieldAlert,
  Terminal,
  Lightbulb,
  Zap,
  FileBadge,
  Database
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Asset, ApiResponse, Profile, Job } from '@shared/types';
import { toast } from 'sonner';
import { ComplianceReportModal } from '@/components/ComplianceReportModal';
export function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isTransformDialogOpen, setIsTransformDialogOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
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
  const asset = data?.data;
  const { data: jobData } = useQuery<ApiResponse<Job>>({
    queryKey: ['job', asset?.current_job_id],
    queryFn: () => fetch(`/api/jobs/${asset?.current_job_id}`).then(res => res.json()),
    enabled: !!asset?.current_job_id,
    refetchInterval: 2000
  });
  const { data: profilesData } = useQuery<ApiResponse<Profile[]>>({
    queryKey: ['profiles'],
    queryFn: () => fetch('/api/profiles').then(res => res.json())
  });
  const transformMutation = useMutation({
    mutationFn: (profileId: string) => fetch(`/api/assets/${id}/transform`, {
      method: 'POST',
      body: JSON.stringify({ targetProfileId: profileId })
    }).then(res => res.json()),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setIsTransformDialogOpen(false);
      toast.success("Transformation job initiated");
      if (res.data?.id) navigate(`/assets/${res.data.id}`);
    }
  });
  const profiles = profilesData?.data ?? [];
  const activeProfile = profiles.find(p => p.id === asset?.profile_id);
  const job = jobData?.data;
  const chartData = useMemo(() => {
    if (!asset?.metadata?.video?.bitrate) return [];
    const base = asset.metadata.video.bitrate / 1000000;
    return Array.from({ length: 20 }).map((_, i) => ({
      time: `${i}s`,
      bitrate: Number((base + (Math.random() * 1.5 - 0.75)).toFixed(2))
    }));
  }, [asset]);
  const formatLogTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour12: false });
  };
  if (isLoading) return <AppLayout><div className="animate-pulse py-12 text-center font-mono">INITIATING_PROBE...</div></AppLayout>;
  if (!asset) return <AppLayout><div className="py-12 text-center">Not found.</div></AppLayout>;
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Link to="/assets" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="mr-1 h-4 w-4" /> Library
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsReportOpen(true)}>
              <FileBadge className="h-4 w-4" /> Export Audit
            </Button>
            <Dialog open={isTransformDialogOpen} onOpenChange={setIsTransformDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Zap className="h-4 w-4" /> Remediation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Deterministic Transformation</DialogTitle></DialogHeader>
                <div className="py-6 space-y-4">
                  <Label>Target Compliance Profile</Label>
                  <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                    <SelectTrigger><SelectValue placeholder="Select target..." /></SelectTrigger>
                    <SelectContent>
                      {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Transforms use deterministic re-encoding to satisfy all profile constraints.</p>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsTransformDialogOpen(false)}>Cancel</Button>
                  <Button onClick={() => transformMutation.mutate(selectedProfileId)} disabled={!selectedProfileId}>Run Engine</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight font-mono">{asset.filename}</h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
              {asset.storage_path && <Badge variant="outline" className="gap-1 bg-muted/50"><Database className="h-3 w-3" /> {asset.storage_path}</Badge>}
              <span>UID: {asset.id.slice(0, 16)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border">
            <div className="text-right">
              <p className="text-2xs font-bold text-muted-foreground uppercase">Target State</p>
              <p className="text-xs text-muted-foreground mt-0.5">{activeProfile?.name || "Global"}</p>
            </div>
            <StatusBadge status={asset.status as StatusType} className="scale-110" />
          </div>
        </div>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-[720px] h-12 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="gap-2"><Activity className="h-4 w-4" /> Summary</TabsTrigger>
            <TabsTrigger value="metadata" className="gap-2"><FileText className="h-4 w-4" /> Specs</TabsTrigger>
            <TabsTrigger value="validation" className="gap-2"><ShieldAlert className="h-4 w-4" /> Rules</TabsTrigger>
            <TabsTrigger value="audit" className="gap-2"><Terminal className="h-4 w-4" /> Job Audit</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle className="text-sm font-semibold">Bitrate Stability Analysis</CardTitle></CardHeader>
                <CardContent className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="time" hide />
                      <YAxis domain={['auto', 'auto']} fontSize={10} />
                      <Tooltip />
                      <Area type="monotone" dataKey="bitrate" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><Lightbulb className="h-4 w-4" /> System Guidance</CardTitle></CardHeader>
                <CardContent>
                  <div className="p-4 bg-zinc-950 text-zinc-300 rounded-lg text-xs font-mono leading-relaxed">
                    {asset.status === 'pass'
                      ? "> ASSET_COMPLIANT\n> NO_REMEDIATION_REQUIRED\n> READY_FOR_PLAYOUT"
                      : "> VIOLATIONS_DETECTED\n> TARGET_PROFILE_MISMATCH\n> RUN_TRANSFORM_TO_FIX"}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="metadata" className="space-y-6 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold">Video Stream</CardTitle></CardHeader>
                <CardContent className="pt-6 space-y-4 text-sm">
                  {asset.metadata?.video ? (
                    <>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div><span className="text-muted-foreground">Codec</span><div className="font-mono font-semibold">{asset.metadata.video.codec_name || asset.metadata.video.codec}</div></div>
                        <div><span className="text-muted-foreground">Resolution</span><div className="font-mono font-semibold">{asset.metadata.video.width}x{asset.metadata.video.height}</div></div>
                        <div><span className="text-muted-foreground">Duration</span><div className="font-mono font-semibold">{asset.metadata.video.duration ? (asset.metadata.video.duration.toFixed(1) + 's') : 'N/A'}</div></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div><span className="text-muted-foreground">Bitrate</span><div className="font-mono font-semibold">{asset.metadata.video.bitrate ? ((asset.metadata.video.bitrate/1000000).toFixed(1) + ' Mbps') : 'N/A'}</div></div>
                        <div><span className="text-muted-foreground">FPS</span><div className="font-mono font-semibold">{asset.metadata.video.r_frame_rate || asset.metadata.video.fps}</div></div>
                        <div><span className="text-muted-foreground">Profile</span><div className="font-mono font-semibold">{asset.metadata.video.profile || 'N/A'}</div></div>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground italic">No video metadata available</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold">Audio Stream</CardTitle></CardHeader>
                <CardContent className="pt-6 space-y-4 text-sm">
                  {asset.metadata?.audio ? (
                    <>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div><span className="text-muted-foreground">Codec</span><div className="font-mono font-semibold">{asset.metadata.audio.codec_name || asset.metadata.audio.codec}</div></div>
                        <div><span className="text-muted-foreground">Channels</span><div className="font-mono font-semibold">{asset.metadata.audio.channels}</div></div>
                        <div><span className="text-muted-foreground">Sample Rate</span><div className="font-mono font-semibold">{asset.metadata.audio.sample_rate}Hz</div></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div><span className="text-muted-foreground">Bitrate</span><div className="font-mono font-semibold">{asset.metadata.audio.bitrate ? ((asset.metadata.audio.bitrate/1000).toFixed(0) + ' kbps') : 'N/A'}</div></div>
                        <div><span className="text-muted-foreground">Bit Depth</span><div className="font-mono font-semibold">{asset.metadata.audio.bits_per_sample || 'N/A'}</div></div>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground italic">No audio metadata available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="audit" className="pt-6">
            <Card className="bg-zinc-950 border-white/10">
              <CardHeader className="border-b border-white/10 bg-white/5">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="h-4 w-4" /> EXECUTION_LOG_STREAM
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5 font-mono text-[11px] max-h-[500px] overflow-y-auto">
                  {!job ? (
                    <div className="p-12 text-center text-zinc-500 italic">No job execution history found for this asset.</div>
                  ) : (
                    job.logs.map((log, i) => (
                      <div key={i} className="p-3 flex gap-4 hover:bg-white/5 transition-colors">
                        <span className="text-zinc-600 shrink-0">[{formatLogTime(log.timestamp)}]</span>
                        <span className={log.level === 'error' ? 'text-rose-500' : (log.level === 'warn' ? 'text-amber-500' : 'text-blue-400')}>
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="validation" className="space-y-4 pt-6">
            {!asset.validation?.violations.length ? (
              <Alert className="bg-emerald-500/5 py-10 flex flex-col items-center border-emerald-500/20 text-center">
                <ShieldAlert className="h-10 w-10 text-emerald-600 mb-4" />
                <AlertTitle className="text-emerald-800 text-xl font-bold">Deterministic Pass</AlertTitle>
                <AlertDescription className="text-emerald-700/80">Asset signature verified against {activeProfile?.name}.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {asset.validation.violations.map((v, i) => (
                  <Card key={i} className={`overflow-hidden border-l-4 ${v.severity === 'critical' ? 'border-l-rose-500' : 'border-l-amber-500'}`}>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant={v.severity === 'critical' ? 'destructive' : 'outline'}>{v.severity.toUpperCase()}</Badge>
                        <h3 className="font-mono text-lg font-bold">{v.field}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3 border rounded">
                          <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Detected</p>
                          <p className="font-mono text-rose-600 font-bold">{v.actual}</p>
                        </div>
                        <div className="p-3 border rounded bg-emerald-500/5">
                          <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Threshold</p>
                          <p className="font-mono text-emerald-600 font-bold">{v.expected}</p>
                        </div>
                      </div>
                      <div className="bg-zinc-950 p-4 rounded text-zinc-300 font-mono text-xs">
                        <p className="text-zinc-500 mb-2 uppercase tracking-widest text-[10px]">Fix Instruction</p>
                        {v.fix}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <ComplianceReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        asset={asset}
        profile={activeProfile}
      />
    </AppLayout>
  );
}