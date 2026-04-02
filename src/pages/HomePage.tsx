import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, BarChart3, FileVideo, ShieldCheck, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
export function HomePage() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
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
      toast.error("Upload simulation failed");
    } finally {
      setIsUploading(false);
    }
  }, [navigate]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    multiple: false,
    accept: { 'video/*': ['.mp4', '.mov', '.mxf', '.mkv'] }
  });
  return (
    <AppLayout>
      <div className="space-y-12">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-zinc-950 p-8 md:p-12 text-white"
        >
          <div className="absolute inset-0 bg-gradient-mesh opacity-20 pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
              Enterprise Grade <br /> <span className="text-zinc-400">Media Compliance</span>
            </h1>
            <p className="text-lg text-zinc-400 mb-8 text-pretty">
              Automate metadata extraction and deterministic profile validation. 
              Upload an asset to begin the compliance check.
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="bg-white text-black hover:bg-zinc-200" onClick={() => navigate('/assets')}>
                View Library <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Ingested', value: '1,284', icon: FileVideo, sub: '+12% this week' },
            { label: 'Avg Compliance', value: '94.2%', icon: ShieldCheck, sub: 'Target: >95%' },
            { label: 'Validation Runs', value: '45.1k', icon: BarChart3, sub: 'Real-time engine' },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono tracking-tight">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        {/* Upload Zone */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div 
            {...getRootProps()} 
            className={`
              border-2 border-dashed rounded-3xl p-16 text-center transition-all cursor-pointer
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50'}
              ${isUploading ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-secondary">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-xl font-semibold">
                  {isUploading ? 'Ingesting Asset...' : 'Drop media file here'}
                </p>
                <p className="text-muted-foreground">
                  Support for MP4, MOV, MXF (Max 5GB)
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}