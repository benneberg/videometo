import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronUp,
  ChevronDown,
  Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { ApiResponse, SystemActivity } from '@shared/types';
export function JobMonitor() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { data } = useQuery<ApiResponse<SystemActivity[]>>({
    queryKey: ['activity'],
    queryFn: () => fetch('/api/activity').then(res => res.json()),
    refetchInterval: 3000
  });
  const activities = (data?.data ?? []).slice(0, 5);
  const activeCount = activities.filter(a => a.status === 'info').length;
  return (
    <div className="fixed bottom-6 right-6 z-50 w-80">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-zinc-950 text-white rounded-2xl border border-white/10 shadow-2xl overflow-hidden mb-3 glass"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-blue-400" />
                Processing Engine
              </h3>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                {activeCount} ACTIVE
              </Badge>
            </div>
            <div className="max-h-[300px] overflow-y-auto divide-y divide-white/5">
              {activities.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs italic">
                  Queue idle.
                </div>
              ) : (
                activities.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-white/5 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="space-y-1">
                        <p className="text-xs font-bold font-mono truncate max-w-[140px]">
                          {item.type.toUpperCase()}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {item.message}
                        </p>
                      </div>
                      {item.status === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : item.status === 'failure' ? (
                        <XCircle className="h-4 w-4 text-rose-500" />
                      ) : (
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                      )}
                    </div>
                    {item.status === 'info' && (
                       <Progress value={45} className="h-1 bg-white/10" />
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="p-3 bg-white/5 border-t border-white/10">
              <Button variant="ghost" size="sm" className="w-full text-zinc-400 hover:text-white text-[10px] gap-2">
                <Terminal className="h-3 w-3" /> OPEN SYSTEM CONSOLE
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-12 rounded-2xl shadow-xl transition-all duration-300 ${
          isOpen ? 'bg-zinc-800' : 'bg-primary'
        }`}
      >
        <div className="flex items-center justify-between w-full px-2">
          <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${activeCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
            <span className="text-sm font-bold tracking-tight">
              {activeCount > 0 ? `${activeCount} Jobs Running` : 'System Ready'}
            </span>
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>
      </Button>
    </div>
  );
}