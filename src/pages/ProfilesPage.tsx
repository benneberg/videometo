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
import { ShieldCheck, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
import type { Profile, ApiResponse, Rule, RuleOperator, ProfileCreate } from '@shared/types';
import { toast } from 'sonner';
export function ProfilesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
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
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Compliance Profiles</h1>
            <p className="text-muted-foreground">Manage target deployment profiles and their technical rulesets.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Create Profile</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <ProfileForm 
                onSubmit={(data) => createMutation.mutate(data)} 
                onCancel={() => setIsCreateOpen(false)}
                isSubmitting={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
             Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="animate-pulse h-[240px] bg-muted" />
            ))
          ) : (
            profiles.map((profile) => (
              <Card key={profile.id} className="group hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(profile.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="mt-4">{profile.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{profile.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <p className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">Validation Rules ({profile.rules.length})</p>
                    {profile.rules.slice(0, 3).map((rule) => (
                      <div key={rule.id} className="flex items-center gap-2 text-xs font-mono bg-muted/50 p-1.5 rounded">
                        <span className="text-blue-600">{rule.field}</span>
                        <span className="text-muted-foreground">{rule.operator}</span>
                        <span className="text-emerald-600">{rule.value}</span>
                      </div>
                    ))}
                    {profile.rules.length > 3 && (
                      <p className="text-xs text-muted-foreground italic">+{profile.rules.length - 3} more rules...</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                   <div className="text-xs text-muted-foreground font-mono">
                     CREATED: {new Date(profile.created_at).toLocaleDateString()}
                   </div>
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
      message: 'Validation failed',
      fix: 'Fix recommended'
    };
    setRules([...rules, newRule]);
  };
  const updateRule = (id: string, updates: Partial<Rule>) => {
    setRules(rules.map(r => r.id === id ? { ...r, ...updates } : r));
  };
  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };
  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>New Compliance Profile</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Profile Name</Label>
          <Input placeholder="e.g. Retail 4K Standard" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input placeholder="Brief description of deployment target" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-lg">Validation Rules</Label>
          <Button variant="outline" size="sm" onClick={addRule}><Plus className="h-3 w-3 mr-1" /> Add Rule</Button>
        </div>
        <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
          {rules.length === 0 && (
            <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
              No rules defined yet.
            </div>
          )}
          {rules.map((rule) => (
            <div key={rule.id} className="p-4 border rounded-lg bg-muted/30 space-y-3 relative group">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeRule(rule.id)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-2xs uppercase">Field</Label>
                  <Select value={rule.field} onValueChange={val => updateRule(rule.id, { field: val })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video.resolution">Resolution</SelectItem>
                      <SelectItem value="video.codec">Codec</SelectItem>
                      <SelectItem value="video.bitrate">Bitrate</SelectItem>
                      <SelectItem value="video.fps">Frame Rate</SelectItem>
                      <SelectItem value="audio.codec">Audio Codec</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-2xs uppercase">Operator</Label>
                  <Select value={rule.operator} onValueChange={val => updateRule(rule.id, { operator: val as RuleOperator })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eq">Equals</SelectItem>
                      <SelectItem value="lte">Less Than or Equal</SelectItem>
                      <SelectItem value="gte">Greater Than or Equal</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-2xs uppercase">Target Value</Label>
                  <Input className="h-8" value={rule.value} onChange={e => updateRule(rule.id, { value: e.target.value })} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit({ name, description, rules })} disabled={isSubmitting || !name}>
          {isSubmitting ? "Creating..." : "Save Profile"}
        </Button>
      </DialogFooter>
    </div>
  );
}