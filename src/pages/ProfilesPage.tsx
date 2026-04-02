import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Plus, Trash2, Info, AlertTriangle, Terminal } from 'lucide-react';
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
            <p className="text-muted-foreground">Define deployment targets and deterministic playback rules.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg"><Plus className="h-4 w-4 mr-2" /> Create Profile</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
              <Card key={profile.id} className="group relative border-border/60 hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
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
                        if (confirm('Delete this profile? Existing assets using it will be unaffected.')) {
                          deleteMutation.mutate(profile.id);
                        }
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
                    <div className="flex items-center justify-between">
                      <p className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">Rules Engine ({profile.rules.length})</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.rules.slice(0, 4).map((rule) => (
                        <Badge key={rule.id} variant="secondary" className="font-mono text-[10px] py-1 px-2 border-border/40">
                          {rule.field.split('.').pop()} {rule.operator} {rule.value}
                        </Badge>
                      ))}
                      {profile.rules.length > 4 && (
                        <Badge variant="outline" className="text-[10px]">+{profile.rules.length - 4} more</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/10 py-4 flex justify-between items-center">
                   <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">ID: {profile.id.slice(0, 8)}...</span>
                   <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">Updated: {new Date(profile.updated_at).toLocaleDateString()}</span>
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
      fix: 'ffmpeg -i input -vf scale=1920:1080 output.mp4'
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
    if (!name) return toast.error("Profile name is required");
    if (rules.length === 0) return toast.error("At least one rule is required");
    onSubmit({ name, description, rules });
  };
  return (
    <div className="space-y-8 py-4">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold">New Deployment Profile</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Profile Identity</Label>
          <Input placeholder="e.g. Retail 4K H265 High-Dynamic" className="h-11" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Target Description</Label>
          <Input placeholder="e.g. For BrightSign XT1144 Playback" className="h-11" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <div className="space-y-1">
            <Label className="text-lg font-bold">Validation Matrix</Label>
            <p className="text-xs text-muted-foreground">Define deterministic limits for media streams.</p>
          </div>
          <Button variant="outline" size="sm" className="h-10" onClick={addRule}><Plus className="h-4 w-4 mr-2" /> Add Constraint</Button>
        </div>
        <div className="space-y-4 pr-1">
          {rules.length === 0 && (
            <div className="text-center py-12 border border-dashed rounded-2xl bg-muted/20">
              <Terminal className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No constraints defined. Add a rule to evaluate bitrates, codecs, or resolutions.</p>
            </div>
          )}
          {rules.map((rule) => (
            <div key={rule.id} className="p-6 border rounded-2xl bg-card shadow-sm space-y-6 relative group border-border/80">
              <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-all" onClick={() => removeRule(rule.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Target Field</Label>
                  <Select value={rule.field} onValueChange={val => updateRule(rule.id, { field: val })}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video.resolution">Video: Resolution</SelectItem>
                      <SelectItem value="video.codec">Video: Codec</SelectItem>
                      <SelectItem value="video.bitrate">Video: Bitrate (bps)</SelectItem>
                      <SelectItem value="video.fps">Video: Frame Rate</SelectItem>
                      <SelectItem value="audio.codec">Audio: Codec</SelectItem>
                      <SelectItem value="audio.bitrate">Audio: Bitrate (bps)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Logic Operator</Label>
                  <Select value={rule.operator} onValueChange={val => updateRule(rule.id, { operator: val as RuleOperator })}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eq">Equal To (==)</SelectItem>
                      <SelectItem value="lte">Max Bound (<=)</SelectItem>
                      <SelectItem value="gte">Min Bound (>=)</SelectItem>
                      <SelectItem value="contains">Includes (str)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Expected Value</Label>
                  <Input className="h-10 font-mono" placeholder="1920x1080" value={rule.value} onChange={e => updateRule(rule.id, { value: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Failure Severity</Label>
                  <div className="flex gap-4">
                    <Button 
                      type="button"
                      variant={rule.severity === 'critical' ? 'default' : 'outline'} 
                      className={`flex-1 h-9 gap-2 ${rule.severity === 'critical' ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
                      onClick={() => updateRule(rule.id, { severity: 'critical' })}
                    >
                      <AlertTriangle className="h-3 w-3" /> Critical
                    </Button>
                    <Button 
                      type="button"
                      variant={rule.severity === 'warning' ? 'secondary' : 'outline'} 
                      className="flex-1 h-9 gap-2"
                      onClick={() => updateRule(rule.id, { severity: 'warning' })}
                    >
                      <Info className="h-3 w-3" /> Warning
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Remediation Suggestion</Label>
                  <Input placeholder="Command or process to fix..." className="h-9 text-xs" value={rule.fix} onChange={e => updateRule(rule.id, { fix: e.target.value })} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t gap-2">
        <Button variant="ghost" onClick={onCancel}>Discard Changes</Button>
        <Button size="lg" className="px-8" onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? "Compiling Profile..." : "Finalize Profile"}
        </Button>
      </DialogFooter>
    </div>
  );
}