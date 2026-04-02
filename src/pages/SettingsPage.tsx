import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Bell, Shield, Key, Save } from 'lucide-react';
import { toast } from 'sonner';
export function SettingsPage() {
  const handleSave = () => {
    toast.success("Settings saved successfully");
  };
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">Manage global application preferences and security.</p>
        </div>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-[600px] h-12 bg-muted/50 p-1">
            <TabsTrigger value="general" className="gap-2"><Globe className="h-4 w-4" /> General</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" /> Alerts</TabsTrigger>
            <TabsTrigger value="compliance" className="gap-2"><Shield className="h-4 w-4" /> Validation</TabsTrigger>
            <TabsTrigger value="advanced" className="gap-2"><Key className="h-4 w-4" /> Advanced</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="pt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Global Environment</CardTitle>
                <CardDescription>Configure localization and regional formatting for technical reports.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>App Identifier</Label>
                    <Input defaultValue="VideoMeta Pro Enterprise" />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Timezone</Label>
                    <Select defaultValue="UTC">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC (Universal)</SelectItem>
                        <SelectItem value="EST">EST (New York)</SelectItem>
                        <SelectItem value="PST">PST (Los Angeles)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notifications" className="pt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Validation Alerts</CardTitle>
                <CardDescription>Control how the system notifies users about compliance results.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Browser Notifications</Label>
                    <p className="text-sm text-muted-foreground">Notify when a long-running batch validation completes.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Critical Failure Sound</Label>
                    <p className="text-sm text-muted-foreground">Play an alert sound when a 'Critical' violation is detected.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="compliance" className="pt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Validation Policy</CardTitle>
                <CardDescription>Configure default behaviors for the deterministic validation engine.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="space-y-2">
                    <Label>Auto-Ingest Profile</Label>
                    <Select defaultValue="p1">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="p1">Retail 1080p H264</SelectItem>
                        <SelectItem value="none">No Default Profile</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Profile to apply automatically to new uploads if not specified.</p>
                 </div>
                 <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Run Validation</Label>
                    <p className="text-sm text-muted-foreground">Trigger analysis immediately upon file ingestion.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="advanced" className="pt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Access</CardTitle>
                <CardDescription>Manage credentials for third-party automation integration.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>System API Key</Label>
                  <div className="flex gap-2">
                    <Input value="vmeta_live_4921x_bb32_k9120" readOnly className="font-mono bg-muted" />
                    <Button variant="outline">Regenerate</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <div className="flex justify-end pt-4 border-t">
          <Button size="lg" className="px-12" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" /> Save Changes
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}