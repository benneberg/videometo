import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Plus, Trash2, Info, AlertTriangle, Terminal, Zap, BookOpen } from 'lucide-react';
import type { Profile, ApiResponse, Rule, RuleOperator, ProfileCreate } from '@shared/types';
import { toast } from 'sonner';
export function ProfilesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data, isLoading } = useQuery<ApiResponse<Profile[]>>({
    queryKey: ['profiles'],
    queryFn: () => fetch('/api/profiles').then(res => res.json())
  });
  const createMutation = useMutation({
    mutationFn: (newProfile: ProfileCreate) => fetch('/api/profiles', {
      method: 'POST',
      body: JSON.stringify(newProfile)
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setIsCreateOpen(false);
      toast.success("Profile created successfully");
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/profiles/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success("Profile deleted");
    }
  });
  const profiles = data?.data ?? [];
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Compliance Profiles</h1>
            <p className="text-muted-foreground">Define deployment targets and explainable playback rules.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg"><Plus className="h-4 w-4 mr-2" /> Create Profile</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <ProfileForm
                onSubmit={(data) => createMutation.mutate(data)}
                onCancel={() => setIsCreateOpen(false)}
                isSubmitting={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse h-[280px] bg-muted/20" />
            ))
          ) : profiles.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl space-y-4">
              <div className="bg-muted p-4 rounded-full w-fit mx-auto"><ShieldCheck className="h-8 w-8 text-muted-foreground" /></div>
              <p className="text-muted-foreground">No profiles configured. Create one to begin validation.</p>
            </div>
          ) : (
            profiles.map((profile) => (
              <Card key={profile.id} className="group relative border-border/60 hover:border-primary/50 transition-all shadow-sm hover:shadow-md overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <ShieldCheck className="h-7 w-7" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        if (confirm('Delete this profile?')) deleteMutation.mutate(profile.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </Button>
                  </div>
                  <CardTitle className="mt-6 text-xl">{profile.name}</CardTitle>
                  <CardDescription className="text-sm h-10 line-clamp-2">{profile.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">Active Constraints ({profile.rules.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.rules.slice(0, 4).map((rule) => (
                        <Badge key={rule.id} variant="secondary" className="font-mono text-[10px]">
                          {rule.field.split('.').pop()} {rule.operator} {rule.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/10 py-4 flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                  <span>ID: {profile.id.slice(0, 8)}</span>
                  <span>UPDATED: {new Date(profile.updated_at).toLocaleDateString()}</span>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
function ProfileForm({ onSubmit, onCancel, isSubmitting }: { onSubmit: (data: ProfileCreate) => void, onCancel: () => void, isSubmitting: boolean }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState<Rule[]>([]);
  const addRule = () => {
    const newRule: Rule = {
      id: crypto.randomUUID(),
      field: 'video.resolution',
      operator: 'eq',
      value: '',
      severity: 'critical',
      message: 'Resolution mismatch detected',
      fix: 'ffmpeg -i input -vf scale=1920:1080 output.mp4',
      reason: ''
    };
    setRules([...rules, newRule]);
  };
  const updateRule = (id: string, updates: Partial<Rule>) => {
    setRules(rules.map(r => r.id === id ? { ...r, ...updates } : r));
  };
  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };
  const handleSave = () => {
    if (!name || rules.length === 0) return toast.error("Missing required fields");
    onSubmit({ name, description, rules });
  };
  return (
    <div className="space-y-8 py-4">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold flex items-center gap-2"><Zap className="h-6 w-6 text-primary" /> New Deployment Profile</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-muted-foreground">Profile Identity</Label>
          <Input placeholder="Profile Name" className="h-11" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-muted-foreground">Target Description</Label>
          <Input placeholder="Profile Purpose" className="h-11" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h3 className="text-lg font-bold">Rule Definitions</h3>
          <Button variant="outline" size="sm" onClick={addRule}><Plus className="h-4 w-4 mr-2" /> Add Constraint</Button>
        </div>
        <div className="space-y-4">
          {rules.map((rule) => (
            <div key={rule.id} className="p-6 border rounded-2xl bg-card space-y-6 relative border-border/80">
              <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8 hover:text-rose-500" onClick={() => removeRule(rule.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Target Field</Label>
                  <Select value={rule.field} onValueChange={val => updateRule(rule.id, { field: val })}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video.resolution">Video: Resolution</SelectItem>
                      <SelectItem value="video.codec">Video: Codec</SelectItem>
                      <SelectItem value="video.bitrate">Video: Bitrate (bps)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Logic Operator</Label>
                  <Select value={rule.operator} onValueChange={val => updateRule(rule.id, { operator: val as RuleOperator })}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eq">Equal To (==)</SelectItem>
                      <SelectItem value="lte">{"Max Bound (<=)"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Expected Value</Label>
                  <Input className="h-10 font-mono" placeholder="Value" value={rule.value} onChange={e => updateRule(rule.id, { value: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5"><BookOpen className="h-3 w-3" /> Engineering Rationale (Why this rule?)</Label>
                <Textarea 
                  placeholder="e.g. Prevents memory overflow on legacy hardware player buffers." 
                  className="min-h-[80px] text-sm" 
                  value={rule.reason} 
                  onChange={e => updateRule(rule.id, { reason: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
        <Button variant="ghost" onClick={onCancel}>Discard</Button>
        <Button size="lg" className="px-8 shadow-primary" onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Finalize Profile"}
        </Button>
      </DialogFooter>
    </div>
  );
}