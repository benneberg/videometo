import { DurableObject } from "cloudflare:workers";
import type { Asset, Profile, Rule, ValidationViolation, ValidationResult, ProfileCreate, ProfileUpdate, AssetStatus } from '@shared/types';
const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'p1',
    name: 'Retail 1080p H264',
    description: 'Standard high-definition profile for retail digital signage.',
    rules: [
      { id: 'r1', field: 'video.resolution', operator: 'eq', value: '1920x1080', severity: 'critical', message: 'Resolution must be exactly 1080p', fix: 'Transcode to 1920x1080' },
      { id: 'r2', field: 'video.bitrate', operator: 'lte', value: 10000000, severity: 'warning', message: 'Bitrate exceeds 10Mbps', fix: 'Reduce constant bitrate to 8-10Mbps' },
      { id: 'r3', field: 'video.codec', operator: 'eq', value: 'h264', severity: 'critical', message: 'Codec must be H.264', fix: 'Re-encode using libx264' }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
export class GlobalDurableObject extends DurableObject {
  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
  }
  async getAssets(): Promise<Asset[]> {
    return (await this.ctx.storage.get<Asset[]>("assets")) || [];
  }
  async getAssetDetails(id: string): Promise<Asset | undefined> {
    const assets = await this.getAssets();
    return assets.find(a => a.id === id);
  }
  async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | undefined> {
    const assets = await this.getAssets();
    const index = assets.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    assets[index] = { ...assets[index], ...updates };
    await this.ctx.storage.put("assets", assets);
    return assets[index];
  }
  async deleteAssets(ids: string[]): Promise<void> {
    const assets = await this.getAssets();
    const updated = assets.filter(a => !ids.includes(a.id));
    await this.ctx.storage.put("assets", updated);
  }
  async getProfiles(): Promise<Profile[]> {
    const stored = await this.ctx.storage.get<Profile[]>("profiles");
    if (stored) return stored;
    await this.ctx.storage.put("profiles", DEFAULT_PROFILES);
    return DEFAULT_PROFILES;
  }
  async createProfile(data: ProfileCreate): Promise<Profile> {
    const profiles = await this.getProfiles();
    const newProfile: Profile = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    profiles.push(newProfile);
    await this.ctx.storage.put("profiles", profiles);
    return newProfile;
  }
  async updateProfile(id: string, data: ProfileUpdate): Promise<Profile | undefined> {
    const profiles = await this.getProfiles();
    const index = profiles.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    profiles[index] = { 
      ...profiles[index], 
      ...data, 
      updated_at: new Date().toISOString() 
    };
    await this.ctx.storage.put("profiles", profiles);
    return profiles[index];
  }
  async deleteProfile(id: string): Promise<void> {
    const profiles = await this.getProfiles();
    const updated = profiles.filter(p => p.id !== id);
    await this.ctx.storage.put("profiles", updated);
  }
  async createAsset(filename: string, size: number, profileId?: string): Promise<Asset> {
    const assets = await this.getAssets();
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      filename,
      size,
      status: 'queued',
      processing_progress: 0,
      profile_id: profileId,
      created_at: new Date().toISOString()
    };
    const updated = [newAsset, ...assets];
    await this.ctx.storage.put("assets", updated);
    // Trigger "async" processing simulation
    this.processAsset(newAsset.id);
    return newAsset;
  }
  private async processAsset(assetId: string) {
    const asset = await this.getAssetDetails(assetId);
    if (!asset) return;
    // Simulate progress
    await this.updateAsset(assetId, { status: 'processing', processing_progress: 25 });
    await new Promise(r => setTimeout(r, 800));
    await this.updateAsset(assetId, { processing_progress: 60 });
    await new Promise(r => setTimeout(r, 800));
    // Generate Mock Metadata
    const mockMetadata = {
      video: {
        codec: Math.random() > 0.2 ? 'h264' : 'prores',
        bitrate: Math.floor(Math.random() * 15000000) + 5000000,
        fps: 29.97,
        resolution: Math.random() > 0.3 ? '1920x1080' : '3840x2160',
        duration: 30.5,
        format: 'mov',
        color_space: 'bt709'
      },
      audio: {
        codec: 'aac',
        channels: 2,
        sample_rate: 48000,
        bitrate: 192000
      }
    };
    // Run Validation
    const profiles = await this.getProfiles();
    const targetProfile = profiles.find(p => p.id === asset.profile_id) || profiles[0];
    const validation = this.runValidationLogic(mockMetadata, targetProfile);
    await this.updateAsset(assetId, {
      status: validation.status,
      processing_progress: 100,
      metadata: mockMetadata,
      validation,
      profile_id: targetProfile.id
    });
  }
  private runValidationLogic(metadata: any, profile: Profile): ValidationResult {
    const violations: ValidationViolation[] = [];
    profile.rules.forEach(rule => {
      let actual: any;
      const parts = rule.field.split('.');
      actual = metadata;
      for (const part of parts) {
        actual = actual?.[part];
      }
      let failed = false;
      if (rule.operator === 'eq' && actual !== rule.value) failed = true;
      if (rule.operator === 'lte' && Number(actual) > Number(rule.value)) failed = true;
      if (rule.operator === 'gte' && Number(actual) < Number(rule.value)) failed = true;
      if (rule.operator === 'contains' && !String(actual).includes(String(rule.value))) failed = true;
      if (failed) {
        violations.push({
          rule_id: rule.id,
          field: rule.field,
          actual: actual ?? 'MISSING',
          expected: rule.value,
          message: rule.message,
          severity: rule.severity,
          fix: rule.fix
        });
      }
    });
    const hasCritical = violations.some(v => v.severity === 'critical');
    const status = violations.length === 0 ? 'pass' : (hasCritical ? 'fail' : 'warning');
    return {
      status,
      violations,
      validated_at: new Date().toISOString()
    };
  }
  async batchValidate(assetIds: string[], profileId?: string): Promise<void> {
    for (const id of assetIds) {
      const asset = await this.getAssetDetails(id);
      if (asset) {
        if (profileId) {
          await this.updateAsset(id, { profile_id: profileId, status: 'queued', processing_progress: 0 });
        } else {
          await this.updateAsset(id, { status: 'queued', processing_progress: 0 });
        }
        this.processAsset(id);
      }
    }
  }
}