import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Upload,
  BarChart3,
  FileVideo,
  ShieldCheck,
  ArrowRight,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ApiResponse, SystemActivity, Asset } from '@shared/types';
import { format } from 'date-fns';
export function HomePage() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const { data: activityData } = useQuery<ApiResponse<SystemActivity[]>>({
    queryKey: ['activity'],
    queryFn: () => fetch('/api/activity').then(res => res.json()),
    refetchInterval: 5000
  });
  const { data: assetsData } = useQuery<ApiResponse<Asset[]>>({
    queryKey: ['assets'],
    queryFn: () => fetch('/api/assets').then(res => res.json())
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
        toast.success("Asset ingested successfully");
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
  const assets = assetsData?.data ?? [];
  // Simulated trend data
  const trendData = Array.from({ length: 7 }).map((_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    rate: 85 + Math.random() * 14
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
                  Intelligence Hub
                </h1>
                <p className="text-lg text-zinc-400 mb-8">
                  Autonomous technical compliance for mission-critical video workflows.
                </p>
                <div {...getRootProps()} className={`
                  border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer text-center
                  ${isDragActive ? 'border-primary bg-white/10' : 'border-zinc-800 hover:border-zinc-700 bg-white/5'}
                `}>
                  <input {...getInputProps()} />
                  <Upload className="h-6 w-6 mx-auto mb-3 text-zinc-500" />
                  <p className="text-sm font-medium">{isUploading ? 'Ingesting...' : 'Drop video to analyze'}</p>
                </div>
              </div>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Compliance Health</CardTitle></CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                      <XAxis dataKey="day" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis hide domain={[80, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Queue Stats</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-end border-b pb-4">
                    <span className="text-sm text-muted-foreground">Total Ingested</span>
                    <span className="text-3xl font-mono font-bold">{assets.length}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-muted-foreground">Active Jobs</span>
                    <span className="text-3xl font-mono font-bold text-blue-500">
                      {assets.filter(a => a.status === 'processing' || a.status === 'transcoding').length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <aside className="w-full lg:w-96">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Clock className="h-4 w-4" /> System Feed
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">LIVE</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {activities.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground text-sm italic">No recent activity.</div>
                  ) : (
                    activities.map((item) => (
                      <div key={item.id} className="p-4 hover:bg-muted/10 transition-colors">
                        <div className="flex gap-3">
                          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                            item.status === 'success' ? 'bg-emerald-500' :
                            item.status === 'failure' ? 'bg-rose-500' : 'bg-blue-500'
                          }`} />
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-tight">{item.message}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{format(new Date(item.timestamp), 'HH:mm:ss')}</p>
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