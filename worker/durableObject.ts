import { DurableObject } from "cloudflare:workers";
import type {
  Asset,
  Profile,
  Rule,
  ValidationViolation,
  ValidationResult,
  ProfileCreate,
  ProfileUpdate,
  AssetStatus,
  SystemActivity
} from '@shared/types';
const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'p1',
    name: 'Retail 1080p H264',
    description: 'Standard high-definition profile for retail digital signage.',
    rules: [
      { id: 'r1', field: 'video.resolution', operator: 'eq', value: '1920x1080', severity: 'critical', message: 'Resolution must be exactly 1080p', fix: 'Transcode to 1920x1080', reason: 'Ensures pixel-perfect mapping on 1080p hardware displays.' },
      { id: 'r2', field: 'video.bitrate', operator: 'lte', value: 10000000, severity: 'warning', message: 'Bitrate exceeds 10Mbps', fix: 'Reduce constant bitrate to 8-10Mbps', reason: 'Prevents network congestion on remote signage players.' },
      { id: 'r3', field: 'video.codec', operator: 'eq', value: 'h264', severity: 'critical', message: 'Codec must be H.264', fix: 'Re-encode using libx264', reason: 'Ensures hardware decoding support across all deployed legacy devices.' }
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
  async logActivity(type: SystemActivity['type'], message: string, status: SystemActivity['status'], asset_id?: string) {
    const logs = (await this.ctx.storage.get<SystemActivity[]>("activity_log")) || [];
    const newLog: SystemActivity = {
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: new Date().toISOString(),
      status,
      asset_id
    };
    const updated = [newLog, ...logs].slice(0, 50);
    await this.ctx.storage.put("activity_log", updated);
  }
  async getRecentActivity(): Promise<SystemActivity[]> {
    return (await this.ctx.storage.get<SystemActivity[]>("activity_log")) || [];
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
    await this.logActivity('system', `New profile created: ${newProfile.name}`, 'info');
    return newProfile;
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
    await this.ctx.storage.put("assets", [newAsset, ...assets]);
    await this.logActivity('ingest', `Ingested asset: ${filename}`, 'success', newAsset.id);
    this.processAsset(newAsset.id);
    return newAsset;
  }
  async transformAsset(sourceId: string, targetProfileId: string): Promise<Asset | undefined> {
    const source = await this.getAssetDetails(sourceId);
    if (!source) return undefined;
    const profiles = await this.getProfiles();
    const targetProfile = profiles.find(p => p.id === targetProfileId);
    if (!targetProfile) return undefined;
    const variantAsset: Asset = {
      id: crypto.randomUUID(),
      filename: `${source.filename.split('.')[0]}_${targetProfile.name.replace(/\s+/g, '_')}.mp4`,
      size: source.size * 0.8,
      status: 'transcoding',
      processing_progress: 0,
      profile_id: targetProfileId,
      created_at: new Date().toISOString(),
      parent_id: sourceId,
    };
    const assets = await this.getAssets();
    await this.ctx.storage.put("assets", [variantAsset, ...assets]);
    await this.logActivity('transform', `Transformation started for ${source.filename}`, 'info', variantAsset.id);
    this.processTransformation(variantAsset.id, sourceId, targetProfileId);
    return variantAsset;
  }
  private async processAsset(id: string) {
    await this.updateAsset(id, { status: 'processing', processing_progress: 25 });
    await new Promise(r => setTimeout(r, 1000));
    const asset = await this.getAssetDetails(id);
    if (!asset) return;
    const profiles = await this.getProfiles();
    const profile = profiles.find(p => p.id === asset.profile_id) || profiles[0];
    const mockMeta = {
      video: { codec: 'prores', bitrate: 15000000, fps: 29.97, resolution: '3840x2160', duration: 15, format: 'mov', color_space: 'bt709' },
      audio: { codec: 'pcm', channels: 2, sample_rate: 48000, bitrate: 1536000 }
    };
    const validation = this.runValidationLogic(mockMeta, profile);
    await this.updateAsset(id, { status: validation.status, metadata: mockMeta, validation, processing_progress: 100 });
    await this.logActivity('validation', `Validation completed for ${asset.filename} (${validation.status})`, validation.status === 'pass' ? 'success' : 'failure', id);
  }
  private async processTransformation(vId: string, sId: string, pId: string) {
    const steps = [30, 60, 100];
    for (const p of steps) {
      await new Promise(r => setTimeout(r, 800));
      await this.updateAsset(vId, { processing_progress: p });
    }
    const profiles = await this.getProfiles();
    const profile = profiles.find(p => p.id === pId);
    if (!profile) return;
    const transformedMeta = {
      video: { codec: 'h264', bitrate: 8000000, fps: 29.97, resolution: '1920x1080', duration: 15, format: 'mp4', color_space: 'bt709' },
      audio: { codec: 'aac', channels: 2, sample_rate: 48000, bitrate: 192000 }
    };
    const val = this.runValidationLogic(transformedMeta, profile);
    await this.updateAsset(vId, { status: val.status, metadata: transformedMeta, validation: val, processing_progress: 100 });
    await this.logActivity('transform', `Transformation completed for variant of ${vId}`, 'success', vId);
  }
  private runValidationLogic(metadata: any, profile: Profile): ValidationResult {
    const violations: ValidationViolation[] = [];
    profile.rules.forEach(rule => {
      let actual: any = metadata;
      rule.field.split('.').forEach(p => actual = actual?.[p]);
      let failed = false;
      if (rule.operator === 'eq' && actual !== rule.value) failed = true;
      if (rule.operator === 'lte' && Number(actual) > Number(rule.value)) failed = true;
      if (failed) {
        violations.push({
          rule_id: rule.id,
          field: rule.field,
          actual: actual ?? 'MISSING',
          expected: rule.value,
          message: rule.message,
          severity: rule.severity,
          fix: rule.fix,
          reason: rule.reason
        });
      }
    });
    return {
      status: violations.length === 0 ? 'pass' : (violations.some(v => v.severity === 'critical') ? 'fail' : 'warning'),
      violations,
      validated_at: new Date().toISOString()
    };
  }
  async deleteAssets(ids: string[]): Promise<void> {
    const assets = (await this.getAssets()).filter(a => !ids.includes(a.id));
    await this.ctx.storage.put("assets", assets);
    await this.logActivity('system', `Deleted ${ids.length} assets from library`, 'info');
  }
  async batchValidate(ids: string[]): Promise<void> {
    for (const id of ids) this.processAsset(id);
  }
  async deleteProfile(id: string) {
    const profiles = (await this.getProfiles()).filter(p => p.id !== id);
    await this.ctx.storage.put("profiles", profiles);
  }
  async updateProfile(id: string, data: ProfileUpdate) {
    const profiles = await this.getProfiles();
    const idx = profiles.findIndex(p => p.id === id);
    if (idx !== -1) {
      profiles[idx] = { ...profiles[idx], ...data, updated_at: new Date().toISOString() };
      await this.ctx.storage.put("profiles", profiles);
      return profiles[idx];
    }
  }
}