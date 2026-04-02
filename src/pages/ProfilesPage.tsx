import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Profile, ApiResponse } from '@shared/types';
import { ShieldCheck, ArrowRight } from 'lucide-react';
export function ProfilesPage() {
  const { data, isLoading } = useQuery<ApiResponse<Profile[]>>({
    queryKey: ['profiles'],
    queryFn: () => fetch('/api/profiles').then(res => res.json())
  });
  const profiles = data?.data ?? [];
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Profiles</h1>
          <p className="text-muted-foreground">Manage target deployment profiles and their technical rulesets.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
             Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="animate-pulse h-[200px] bg-muted" />
            ))
          ) : (
            profiles.map((profile) => (
              <Card key={profile.id} className="group hover:border-primary/50 transition-all cursor-default">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <Badge variant="secondary" className="font-mono">{profile.rules.length} Rules</Badge>
                  </div>
                  <CardTitle className="mt-4">{profile.name}</CardTitle>
                  <CardDescription>{profile.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-6">
                    {profile.rules.slice(0, 3).map((rule) => (
                      <div key={rule.id} className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                        <div className="h-1 w-1 rounded-full bg-zinc-400" />
                        {rule.field} {rule.operator} {rule.value}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center text-sm font-medium text-primary cursor-pointer hover:underline">
                    View full ruleset <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}