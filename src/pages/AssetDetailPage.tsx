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
  RefreshCw, CheckCircle2,
  Terminal,
  BarChart3,
  Lightbulb,
  GitBranch,
  ArrowRightLeft,
  Zap,
  Play,
  FileBadge
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Asset, ApiResponse, Profile } from '@shared/types';
import { toast } from 'sonner';
import { AssetCompareOverlay } from '@/components/AssetCompareOverlay';
import { ComplianceReportModal } from '@/components/ComplianceReportModal';
export function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareAssetId, setCompareAssetId] = useState<string | null>(null);
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
  const { data: variantsData } = useQuery<ApiResponse<Asset[]>>({
    queryKey: ['asset-variants', id],
    queryFn: () => fetch(`/api/assets/${id}/variants`).then(res => res.json()),
    enabled: !!id
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
  const activeProfile = profiles.find(p => p.id === asset?.profile_id);
  const chartData = useMemo(() => {
    if (!asset?.metadata?.video?.bitrate) return [];
    const base = asset.metadata.video.bitrate / 1000000;
    return Array.from({ length: 20 }).map((_, i) => ({
      time: `${i}s`,
      bitrate: Number((base + (Math.random() * 2 - 1)).toFixed(2))
    }));
  }, [asset]);
  if (isLoading) return <AppLayout><div className="animate-pulse py-12 text-center">Analysing...</div></AppLayout>;
  if (!asset) return <AppLayout><div className="py-12 text-center">Not found.</div></AppLayout>;
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Link to="/assets" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back to Library
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsReportOpen(true)}>
              <FileBadge className="h-4 w-4" /> Export Report
            </Button>
            <Dialog open={isTransformDialogOpen} onOpenChange={setIsTransformDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Zap className="h-4 w-4" /> Transform
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Initiate Transformation</DialogTitle></DialogHeader>
                <div className="py-6 space-y-4">
                  <Label>Target Compliance Profile</Label>
                  <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                    <SelectTrigger><SelectValue placeholder="Select profile..." /></SelectTrigger>
                    <SelectContent>
                      {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsTransformDialogOpen(false)}>Cancel</Button>
                  <Button onClick={() => transformMutation.mutate(selectedProfileId)} disabled={!selectedProfileId}>Run Job</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={() => revalidateMutation.mutate()} disabled={revalidateMutation.isPending}>
              <RefreshCw className={`mr-2 h-4 w-4 ${revalidateMutation.isPending ? 'animate-spin' : ''}`} />
              Re-run Validation
            </Button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight font-mono">{asset.filename}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {asset.parent_id && <Badge variant="outline" className="gap-1"><GitBranch className="h-3 w-3" /> Derived</Badge>}
              <span>ID: <span className="font-mono">{asset.id.slice(0, 8)}</span></span>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border">
            <div className="text-right">
              <p className="text-2xs font-bold text-muted-foreground uppercase">System Compliance</p>
              <p className="text-xs text-muted-foreground mt-0.5">{activeProfile?.name || "Global Default"}</p>
            </div>
            <StatusBadge status={asset.status as StatusType} className="scale-110" />
          </div>
        </div>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-[720px] h-12 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="gap-2"><Activity className="h-4 w-4" /> Summary</TabsTrigger>
            <TabsTrigger value="metadata" className="gap-2"><FileText className="h-4 w-4" /> Technical Specs</TabsTrigger>
            <TabsTrigger value="validation" className="gap-2"><ShieldAlert className="h-4 w-4" /> Validation</TabsTrigger>
            <TabsTrigger value="lineage" className="gap-2"><GitBranch className="h-4 w-4" /> Variants</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle className="text-sm font-semibold">Bitrate Distribution</CardTitle></CardHeader>
                <CardContent className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
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
                <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><Lightbulb className="h-4 w-4" /> Remediation</CardTitle></CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    {asset.status === 'pass' ? "Asset is fully compliant." : "Violations detected. Run 'Transform' to automatically fix constraints."}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="validation" className="space-y-4 pt-6">
            {!asset.validation?.violations.length ? (
              <Alert className="bg-emerald-500/5 py-10 flex flex-col items-center border-emerald-500/20 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 mb-4" />
                <AlertTitle className="text-emerald-800 text-xl font-bold">Compliant Asset</AlertTitle>
                <AlertDescription className="text-emerald-700/80">Asset satisfies all rules for {activeProfile?.name}.</AlertDescription>
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
                          <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Expected</p>
                          <p className="font-mono text-emerald-600 font-bold">{v.expected}</p>
                        </div>
                      </div>
                      {v.reason && (
                        <div className="mb-4 p-4 bg-muted/30 rounded-lg text-sm italic">
                          <strong>Rationale:</strong> {v.reason}
                        </div>
                      )}
                      <div className="bg-zinc-950 p-4 rounded text-zinc-300 font-mono text-xs">
                        <p className="text-zinc-500 mb-2 uppercase tracking-widest text-[10px]">Fix Command</p>
                        {v.fix}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="lineage" className="pt-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-sm">Parent Source</CardTitle></CardHeader>
                <CardContent>
                  {asset.parent_id ? (
                    <Link to={`/assets/${asset.parent_id}`} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30">
                      <div className="flex items-center gap-4">
                        <Play className="h-5 w-5" />
                        <span className="font-medium">Original Asset</span>
                      </div>
                      <StatusBadge status="pass" />
                    </Link>
                  ) : <div className="py-8 text-center border-2 border-dashed rounded-xl text-muted-foreground">Master Asset</div>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Derived Variants</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {variants.length === 0 ? (
                    <div className="py-8 text-center border-2 border-dashed rounded-xl text-muted-foreground">No variants found.</div>
                  ) : variants.map(v => (
                    <div key={v.id} className="flex items-center justify-between p-4 border rounded-xl hover:border-primary/50 cursor-pointer" onClick={() => navigate(`/assets/${v.id}`)}>
                      <div className="flex items-center gap-3">
                        <GitBranch className="h-4 w-4" />
                        <span className="text-sm font-medium">{v.filename}</span>
                      </div>
                      <StatusBadge status={v.status as StatusType} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {isCompareOpen && compareAssetId && (
        <AssetCompareOverlay sourceAssetId={id!} variantAssetId={compareAssetId} onClose={() => setIsCompareOpen(false)} />
      )}
      <ComplianceReportModal 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)} 
        asset={asset} 
        profile={activeProfile} 
      />
    </AppLayout>
  );
}