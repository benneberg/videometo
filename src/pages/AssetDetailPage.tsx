import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChevronLeft, Info, FileText, Activity, ShieldAlert } from 'lucide-react';
import type { Asset, ApiResponse } from '@shared/types';
export function AssetDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = useQuery<ApiResponse<Asset>>({
    queryKey: ['asset', id],
    queryFn: () => fetch(`/api/assets/${id}`).then(res => res.json()),
    enabled: !!id
  });
  const asset = data?.data;
  if (isLoading) return <AppLayout><div>Loading detailed metadata...</div></AppLayout>;
  if (!asset) return <AppLayout><div>Asset not found.</div></AppLayout>;
  return (
    <AppLayout>
      <div className="space-y-8">
        <Link to="/assets" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-1 h-4 w-4" /> Back to Library
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-mono">{asset.filename}</h1>
            <p className="text-muted-foreground">ID: <span className="font-mono text-xs">{asset.id}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">COMPLIANCE:</span>
            <StatusBadge status={asset.status} className="scale-110" />
          </div>
        </div>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
            <TabsTrigger value="overview"><Activity className="h-4 w-4 mr-2" /> Overview</TabsTrigger>
            <TabsTrigger value="metadata"><FileText className="h-4 w-4 mr-2" /> Metadata</TabsTrigger>
            <TabsTrigger value="validation"><ShieldAlert className="h-4 w-4 mr-2" /> Validation</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-sm">Quick Specs</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between"><span className="text-muted-foreground">Resolution</span><span className="font-mono">{asset.metadata?.video.resolution}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Frame Rate</span><span className="font-mono">{asset.metadata?.video.fps} fps</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Container</span><span className="font-mono uppercase">{asset.metadata?.video.format}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Size</span><span className="font-mono">{(asset.size / (1024 * 1024)).toFixed(2)} MB</span></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Compliance Summary</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-2">
                    {asset.validation?.violations.length === 0 ? 'CLEAN' : `${asset.validation?.violations.length} VIOLATIONS`}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tested against <span className="font-medium text-foreground">Retail 1080p H264</span>
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="metadata" className="pt-4">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Video Stream</h3>
                    <div className="space-y-2 border-l pl-4 border-muted">
                      {Object.entries(asset.metadata?.video ?? {}).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-sm py-1 border-b border-muted/50 last:border-0">
                          <span className="text-muted-foreground">{k.replace('_', ' ')}</span>
                          <span className="font-mono font-medium">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Audio Stream</h3>
                    <div className="space-y-2 border-l pl-4 border-muted">
                      {Object.entries(asset.metadata?.audio ?? {}).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-sm py-1 border-b border-muted/50 last:border-0">
                          <span className="text-muted-foreground">{k.replace('_', ' ')}</span>
                          <span className="font-mono font-medium">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="validation" className="space-y-4 pt-4">
            {asset.validation?.violations.length === 0 ? (
              <Alert className="bg-emerald-500/5 border-emerald-500/20">
                <Info className="h-4 w-4 text-emerald-600" />
                <AlertTitle className="text-emerald-800">Compliance Pass</AlertTitle>
                <AlertDescription className="text-emerald-700/80">This asset meets all technical requirements for the selected playback profile.</AlertDescription>
              </Alert>
            ) : (
              asset.validation?.violations.map((v, i) => (
                <Card key={i} className={`border-l-4 ${v.severity === 'critical' ? 'border-l-rose-500' : 'border-l-amber-500'}`}>
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-2xs font-bold px-2 py-0.5 rounded uppercase ${v.severity === 'critical' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>
                          {v.severity}
                        </span>
                        <CardTitle className="text-base font-mono">{v.field}</CardTitle>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">Rule: {v.rule_id}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 bg-muted/50 p-3 rounded-lg font-mono text-sm">
                      <div>
                        <p className="text-2xs text-muted-foreground uppercase mb-1">Expected Value</p>
                        <p className="text-emerald-600">{String(v.expected)}</p>
                      </div>
                      <div>
                        <p className="text-2xs text-muted-foreground uppercase mb-1">Actual Value</p>
                        <p className="text-rose-600">{String(v.actual)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Remediation Path:</p>
                      <p className="text-sm text-muted-foreground">{v.fix}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}