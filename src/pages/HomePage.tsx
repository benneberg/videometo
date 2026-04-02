import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Upload,
  BarChart3,
  ShieldCheck,
  Activity,
  Clock,
  Cpu,
  Layers,
  Zap
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ApiResponse, SystemActivity, QueueStats } from '@shared/types';
import { format } from 'date-fns';
export function HomePage() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const { data: activityData } = useQuery<ApiResponse<SystemActivity[]>>({
    queryKey: ['activity'],
    queryFn: () => fetch('/api/activity').then(res => res.json()),
    refetchInterval: 3000
  });
  const { data: statsData } = useQuery<ApiResponse<QueueStats>>({
    queryKey: ['system-stats'],
    queryFn: () => fetch('/api/system/stats').then(res => res.json()),
    refetchInterval: 5000
  });
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setIsUploading(true);
    const file = acceptedFiles[0];
    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, size: file.size })
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Asset queued for analysis");
        navigate(`/assets/${result.data.id}`);
      }
    } catch (error) {
      toast.error("Ingestion failed");
    } finally {
      setIsUploading(false);
    }
  }, [navigate]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'video/*': ['.mp4', '.mov', '.mxf'] }
  });
  const activities = activityData?.data ?? [];
  const stats = statsData?.data;
  // Static visualization data for throughput trend
  const trendData = Array.from({ length: 7 }).map((_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    rate: 92 + Math.random() * 7
  }));
  return (
    <AppLayout>
      <div className="space-y-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl bg-zinc-950 p-8 md:p-12 text-white"
            >
              <div className="absolute inset-0 bg-gradient-mesh opacity-20" />
              <div className="relative z-10 max-w-xl">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
                  Deterministic Ingest
                </h1>
                <p className="text-lg text-zinc-400 mb-8">
                  Enterprise-grade technical compliance for mission-critical video assets.
                </p>
                <div {...getRootProps()} className={`
                  border-2 border-dashed rounded-2xl p-10 transition-all cursor-pointer text-center
                  ${isDragActive ? 'border-primary bg-white/10' : 'border-zinc-800 hover:border-zinc-700 bg-white/5'}
                `}>
                  <input {...getInputProps()} />
                  <Upload className="h-8 w-8 mx-auto mb-4 text-zinc-500" />
                  <p className="text-base font-medium">{isUploading ? 'Allocating Resources...' : 'Drop video to analyze'}</p>
                  <p className="text-xs text-zinc-500 mt-2">MP4, MOV, MXF up to 10GB</p>
                </div>
              </div>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><Cpu className="h-4 w-4" /> System Load</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-mono font-bold">{stats?.system_load.toFixed(1) || '0.0'}%</div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${stats?.system_load || 0}%` }} />
                  </div>
                  <p className="text-2xs text-muted-foreground uppercase tracking-widest">Active Worker Threads: {stats?.active_jobs || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><Layers className="h-4 w-4" /> Queue Latency</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-mono font-bold">{stats?.avg_wait_time || '0.0'}s</div>
                  <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
                    <Zap className="h-3 w-3" /> NOMINAL PERFORMANCE
                  </div>
                  <p className="text-2xs text-muted-foreground uppercase tracking-widest">Queued Requests: {stats?.queued_jobs || 0}</p>
                </CardContent>
              </Card>
              <Card className="md:col-span-2 lg:col-span-1">
                <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><BarChart3 className="h-4 w-4" /> 24h Throughput</CardTitle></CardHeader>
                <CardContent>
                   <div className="text-3xl font-mono font-bold mb-4">{stats?.completed_24h || 0}</div>
                   <div className="h-[60px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                   </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <aside className="w-full lg:w-96">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Event Stream
                </CardTitle>
                <Badge variant="outline" className="text-[10px] animate-pulse">LIVE_FEED</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {activities.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground text-sm italic font-mono">NO_ACTIVE_EVENTS</div>
                  ) : (
                    activities.map((item) => (
                      <div key={item.id} className="p-4 hover:bg-muted/10 transition-colors">
                        <div className="flex gap-3">
                          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                            item.status === 'success' ? 'bg-emerald-500' :
                            item.status === 'failure' ? 'bg-rose-500' : 'bg-blue-500'
                          }`} />
                          <div className="space-y-1">
                            <p className="text-xs font-medium leading-tight font-mono">{item.message}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{format(new Date(item.timestamp), 'HH:mm:ss.SSS')}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}