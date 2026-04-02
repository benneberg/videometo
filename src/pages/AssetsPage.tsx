import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { format } from 'date-fns';
import type { Asset, ApiResponse } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
export function AssetsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery<ApiResponse<Asset[]>>({
    queryKey: ['assets'],
    queryFn: () => fetch('/api/assets').then(res => res.json())
  });
  const assets = data?.data ?? [];
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Asset Library</h1>
            <p className="text-muted-foreground">Comprehensive history of ingested and validated assets.</p>
          </div>
        </div>
        <div className="border rounded-xl bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[300px]">Filename</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Resolution</TableHead>
                <TableHead>Codec</TableHead>
                <TableHead className="text-right">Ingest Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No assets found. Upload one from the dashboard.
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow 
                    key={asset.id} 
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => navigate(`/assets/${asset.id}`)}
                  >
                    <TableCell className="font-medium text-foreground">
                      {asset.filename}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={asset.status} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {asset.metadata?.video.resolution ?? '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs uppercase">
                      {asset.metadata?.video.codec ?? '-'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm font-mono">
                      {format(new Date(asset.created_at), 'yyyy-MM-dd HH:mm')}
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