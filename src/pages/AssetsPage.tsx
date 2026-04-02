import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Trash2, 
  ShieldCheck, 
  MoreHorizontal,
  FileJson,
  FileSpreadsheet
} from 'lucide-react';
import { format } from 'date-fns';
import type { Asset, ApiResponse } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { exportAssetsToCSV, exportAssetsToJSON } from '@/lib/export-utils';
import { toast } from 'sonner';
export function AssetsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { data, isLoading } = useQuery<ApiResponse<Asset[]>>({
    queryKey: ['assets'],
    queryFn: () => fetch('/api/assets').then(res => res.json()),
    refetchInterval: (query) => {
       const assets = query.state.data?.data;
       return assets?.some(a => a.status === 'processing' || a.status === 'queued') ? 2000 : false;
    }
  });
  const batchMutation = useMutation({
    mutationFn: (req: { assetIds: string[], action: string }) => fetch('/api/assets/batch', {
      method: 'POST',
      body: JSON.stringify(req)
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setSelectedIds([]);
      toast.success("Batch operation initiated");
    }
  });
  const assets = data?.data ?? [];
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const toggleAll = () => {
    setSelectedIds(prev => prev.length === assets.length ? [] : assets.map(a => a.id));
  };
  const handleExportCSV = () => {
    const toExport = assets.filter(a => selectedIds.includes(a.id));
    exportAssetsToCSV(toExport);
    toast.success("Exporting to CSV...");
  };
  const handleExportJSON = () => {
    const toExport = assets.filter(a => selectedIds.includes(a.id));
    exportAssetsToJSON(toExport);
    toast.success("Exporting to JSON...");
  };
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Asset Library</h1>
            <p className="text-muted-foreground">Comprehensive history of ingested and validated assets.</p>
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg animate-in slide-in-from-bottom-2">
              <span className="text-sm font-mono mr-4">{selectedIds.length} SELECTED</span>
              <Button size="sm" variant="ghost" className="text-white hover:bg-zinc-800" onClick={() => batchMutation.mutate({ assetIds: selectedIds, action: 'validate' })}>
                <ShieldCheck className="h-4 w-4 mr-2" /> Validate
              </Button>
              <div className="h-4 w-[1px] bg-zinc-700" />
              <Button size="sm" variant="ghost" className="text-white hover:bg-zinc-800" onClick={handleExportCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> CSV
              </Button>
              <Button size="sm" variant="ghost" className="text-white hover:bg-zinc-800" onClick={handleExportJSON}>
                <FileJson className="h-4 w-4 mr-2" /> JSON
              </Button>
              <div className="h-4 w-[1px] bg-zinc-700" />
              <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30" onClick={() => batchMutation.mutate({ assetIds: selectedIds, action: 'delete' })}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
            </div>
          )}
        </div>
        <div className="border rounded-xl bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-12"><Checkbox checked={selectedIds.length === assets.length && assets.length > 0} onCheckedChange={toggleAll} /></TableHead>
                <TableHead className="min-w-[250px]">Filename</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Technical Specs</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Ingest Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No assets found. Upload one from the dashboard.
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow
                    key={asset.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.includes(asset.id)} onCheckedChange={() => toggleSelect(asset.id)} />
                    </TableCell>
                    <TableCell className="font-medium text-foreground" onClick={() => navigate(`/assets/${asset.id}`)}>
                      <div className="flex flex-col">
                        <span>{asset.filename}</span>
                        {asset.status === 'processing' && (
                          <div className="w-full mt-2">
                             <Progress value={asset.processing_progress} className="h-1" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={() => navigate(`/assets/${asset.id}`)}>
                      <StatusBadge status={asset.status} />
                    </TableCell>
                    <TableCell className="font-mono text-2xs space-y-1" onClick={() => navigate(`/assets/${asset.id}`)}>
                      {asset.metadata ? (
                        <>
                          <div className="text-muted-foreground">{asset.metadata.video.resolution} @ {asset.metadata.video.fps}fps</div>
                          <div className="font-bold uppercase text-zinc-500">{asset.metadata.video.codec} • {(asset.metadata.video.bitrate / 1000000).toFixed(1)} Mbps</div>
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">Awaiting analysis...</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs" onClick={() => navigate(`/assets/${asset.id}`)}>
                      {(asset.size / (1024 * 1024)).toFixed(1)}MB
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm font-mono" onClick={() => navigate(`/assets/${asset.id}`)}>
                      {format(new Date(asset.created_at), 'MM-dd HH:mm')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}