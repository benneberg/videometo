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
import { StatusBadge, type StatusType } from '@/components/ui/status-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Trash2,
  ShieldCheck,
  FileJson,
  FileSpreadsheet,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import type { Asset, ApiResponse } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { exportAssetsToCSV, exportAssetsToJSON } from '@/lib/export-utils';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
export function AssetsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
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
  const allAssets = data?.data ?? [];
  const filteredAssets = allAssets.filter(a => a.filename.toLowerCase().includes(search.toLowerCase()));
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const toggleAll = () => {
    setSelectedIds(prev => prev.length === filteredAssets.length ? [] : filteredAssets.map(a => a.id));
  };
  const handleExportCSV = () => {
    const toExport = allAssets.filter(a => selectedIds.includes(a.id));
    exportAssetsToCSV(toExport);
    toast.success("Exporting to CSV...");
  };
  const handleExportJSON = () => {
    const toExport = allAssets.filter(a => selectedIds.includes(a.id));
    exportAssetsToJSON(toExport);
    toast.success("Exporting to JSON...");
  };
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Asset Library</h1>
            <p className="text-muted-foreground">Deterministic history of validated media assets.</p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search files..." 
                className="pl-9 h-10" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
          </div>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-zinc-950 text-white px-4 py-3 rounded-xl border border-white/10 animate-in slide-in-from-top-2 duration-300">
            <span className="text-xs font-mono font-bold text-zinc-400 mr-4 tracking-widest">{selectedIds.length} SELECTED</span>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => batchMutation.mutate({ assetIds: selectedIds, action: 'validate' })}>
              <ShieldCheck className="h-4 w-4 mr-2" /> Validate
            </Button>
            <div className="h-4 w-[1px] bg-white/20" />
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={handleExportCSV}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> CSV
            </Button>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={handleExportJSON}>
              <FileJson className="h-4 w-4 mr-2" /> JSON
            </Button>
            <div className="h-4 w-[1px] bg-white/20" />
            <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onClick={() => batchMutation.mutate({ assetIds: selectedIds, action: 'delete' })}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </div>
        )}
        <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-12"><Checkbox checked={selectedIds.length === filteredAssets.length && filteredAssets.length > 0} onCheckedChange={toggleAll} /></TableHead>
                <TableHead className="min-w-[280px]">Filename</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Specs (V/A)</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Ingested</TableHead>
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
              ) : filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground italic">
                    {search ? `No results for "${search}"` : 'No assets found. Drop a file on the Dashboard to start.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((asset) => (
                  <TableRow
                    key={asset.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors group"
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.includes(asset.id)} onCheckedChange={() => toggleSelect(asset.id)} />
                    </TableCell>
                    <TableCell className="font-medium" onClick={() => navigate(`/assets/${asset.id}`)}>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-foreground group-hover:text-primary transition-colors">{asset.filename}</span>
                        {asset.status === 'processing' && (
                          <div className="w-48">
                             <Progress value={asset.processing_progress} className="h-1 bg-muted" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={() => navigate(`/assets/${asset.id}`)}>
                      <StatusBadge status={asset.status as StatusType} />
                    </TableCell>
                    <TableCell className="font-mono text-[10px] space-y-1" onClick={() => navigate(`/assets/${asset.id}`)}>
                      {asset.metadata ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="text-zinc-600 font-bold">{asset.metadata.video.resolution} • {asset.metadata.video.fps}fps</div>
                          <div className="text-muted-foreground uppercase">{asset.metadata.video.codec} / {asset.metadata.audio.codec}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic opacity-60">Pending analysis...</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs opacity-80" onClick={() => navigate(`/assets/${asset.id}`)}>
                      {(asset.size / (1024 * 1024)).toFixed(1)}MB
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs font-mono" onClick={() => navigate(`/assets/${asset.id}`)}>
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