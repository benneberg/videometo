import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Info, FileText, Activity, ShieldAlert, RefreshCw, Terminal } from 'lucide-react';
import type { Asset, ApiResponse } from '@shared/types';
import { toast } from 'sonner';
export function AssetDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<ApiResponse<Asset>>({
    queryKey: ['asset', id],
    queryFn: () => fetch(`/api/assets/${id}`).then(res => res.json()),
    enabled: !!id,
    refetchInterval: (data) => data?.data?.status === 'processing' ? 1000 : false
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
  if (isLoading) return <AppLayout><div className="animate-pulse">Loading detailed metadata...</div></AppLayout>;
  if (!asset) return <AppLayout><div>Asset not found.</div></AppLayout>;
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Link to="/assets" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
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
              <Badge variant="secondary" className="font-mono text-xs">{asset.metadata?.video.format.toUpperCase()}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">UUID: <span className="font-mono">{asset.id}</span></p>
          </div>
          <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border">
            <div className="text-right">
              <p className="text-2xs font-bold text-muted-foreground uppercase">Compliance Status</p>
              <p className="text-xs text-muted-foreground mt-0.5">Profile: {asset.profile_id ? "Custom" : "System Default"}</p>
            </div>
            <StatusBadge status={asset.status} className="scale-125 px-4 h-8" />
          </div>
        </div>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-[500px] h-12 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Activity className="h-4 w-4 mr-2" /> Asset Overview</TabsTrigger>
            <TabsTrigger value="metadata" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><FileText className="h-4 w-4 mr-2" /> Technical Metadata</TabsTrigger>
            <TabsTrigger value="validation" className="data-[state=active]:bg-background data-[state=active]:shadow-sm relative">
              <ShieldAlert className="h-4 w-4 mr-2" /> 
              Validation 
              {asset.validation?.violations.length ? (
                <span className="ml-2 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {asset.validation.violations.length}
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader><CardTitle className="text-base">Technical Summary</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                    {[
                      { label: 'Resolution', value: asset.metadata?.video.resolution },
                      { label: 'Frame Rate', value: asset.metadata?.video.fps ? `${asset.metadata.video.fps} FPS` : undefined },
                      { label: 'Bitrate', value: asset.metadata?.video.bitrate ? `${(asset.metadata.video.bitrate / 1000000).toFixed(2)} Mbps` : undefined },
                      { label: 'Duration', value: asset.metadata?.video.duration ? `${asset.metadata.video.duration}s` : undefined },
                    ].map((spec, i) => (
                      <div key={i} className="space-y-1">
                        <p className="text-2xs font-bold text-muted-foreground uppercase">{spec.label}</p>
                        <p className="text-lg font-mono font-medium">{spec.value ?? '---'}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Compliance Score</CardTitle></CardHeader>
                <CardContent className="flex flex-col items-center justify-center pt-0">
                  <div className={`text-5xl font-bold font-mono ${asset.status === 'pass' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {asset.validation?.violations.length === 0 ? '100%' : 'FAIL'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {asset.validation?.violations.length ?? 0} violations found against target profile
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="metadata" className="pt-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MetadataSection title="Video Stream" data={asset.metadata?.video} />
                <MetadataSection title="Audio Stream" data={asset.metadata?.audio} />
             </div>
          </TabsContent>
          <TabsContent value="validation" className="space-y-4 pt-6">
            {!asset.validation || asset.validation.violations.length === 0 ? (
              <Alert className="bg-emerald-500/5 border-emerald-500/20 py-8">
                <ShieldAlert className="h-6 w-6 text-emerald-600" />
                <div className="ml-4">
                  <AlertTitle className="text-emerald-800 text-lg">Full Compliance Achieved</AlertTitle>
                  <AlertDescription className="text-emerald-700/80 max-w-xl">
                    This asset satisfies all deterministic rules within the active playback profile. 
                    No remediation is required for production deployment.
                  </AlertDescription>
                </div>
              </Alert>
            ) : (
              asset.validation.violations.map((v, i) => (
                <Card key={i} className={`overflow-hidden border-l-4 ${v.severity === 'critical' ? 'border-l-rose-500' : 'border-l-amber-500'}`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={v.severity === 'critical' ? 'destructive' : 'outline'} className="uppercase text-[10px]">
                            {v.severity}
                          </Badge>
                          <h3 className="font-mono text-lg font-bold">{v.field}</h3>
                        </div>
                        <p className="text-muted-foreground">{v.message}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-2xs font-mono text-muted-foreground">RULE_ID: {v.rule_id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-muted/50 p-4 rounded-lg border">
                        <p className="text-2xs font-bold text-muted-foreground uppercase mb-2">Current Value</p>
                        <p className="font-mono text-rose-600 text-lg">{String(v.actual)}</p>
                      </div>
                      <div className="bg-emerald-500/5 p-4 rounded-lg border border-emerald-500/10">
                        <p className="text-2xs font-bold text-emerald-600/70 uppercase mb-2">Expected Value</p>
                        <p className="font-mono text-emerald-600 text-lg">{String(v.expected)}</p>
                      </div>
                    </div>
                    <div className="bg-zinc-950 rounded-lg p-4 text-zinc-300">
                      <div className="flex items-center gap-2 mb-2 text-zinc-500">
                        <Terminal className="h-4 w-4" />
                        <span className="text-xs font-mono">Remediation Guidance</span>
                      </div>
                      <code className="text-sm font-mono block whitespace-pre-wrap">
                        {v.fix}
                      </code>
                    </div>
                  </div>
                </Card>
              ))
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
    <Card>
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {Object.entries(data).map(([k, v]) => (
            <div key={k} className="flex justify-between items-center px-6 py-3 hover:bg-muted/10 transition-colors">
              <span className="text-sm text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
              <span className="font-mono text-sm font-medium">{String(v)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}