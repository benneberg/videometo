import { DurableObject } from "cloudflare:workers";
import type { Asset, Profile, Rule, ValidationViolation, ValidationResult } from '@shared/types';
const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'p1',
    name: 'Retail 1080p H264',
    description: 'Standard high-definition profile for retail digital signage.',
    rules: [
      { id: 'r1', field: 'video.resolution', operator: 'eq', value: '1920x1080', severity: 'critical', message: 'Resolution must be exactly 1080p', fix: 'Transcode to 1920x1080' },
      { id: 'r2', field: 'video.bitrate', operator: 'lte', value: 10000000, severity: 'warning', message: 'Bitrate exceeds 10Mbps', fix: 'Reduce constant bitrate to 8-10Mbps' },
      { id: 'r3', field: 'video.codec', operator: 'eq', value: 'h264', severity: 'critical', message: 'Codec must be H.264', fix: 'Re-encode using libx264' }
    ]
  }
];
export class GlobalDurableObject extends DurableObject {
  async getAssets(): Promise<Asset[]> {
    return (await this.ctx.storage.get<Asset[]>("assets")) || [];
  }
  async getAssetDetails(id: string): Promise<Asset | undefined> {
    const assets = await this.getAssets();
    return assets.find(a => a.id === id);
  }
  async getProfiles(): Promise<Profile[]> {
    const stored = await this.ctx.storage.get<Profile[]>("profiles");
    if (stored) return stored;
    await this.ctx.storage.put("profiles", DEFAULT_PROFILES);
    return DEFAULT_PROFILES;
  }
  async createAsset(filename: string, size: number): Promise<Asset> {
    const assets = await this.getAssets();
    const profiles = await this.getProfiles();
    const targetProfile = profiles[0];
    // Mock metadata generation
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
    // Run validation logic
    const violations: ValidationViolation[] = [];
    targetProfile.rules.forEach(rule => {
      let actual: any;
      if (rule.field === 'video.resolution') actual = mockMetadata.video.resolution;
      if (rule.field === 'video.bitrate') actual = mockMetadata.video.bitrate;
      if (rule.field === 'video.codec') actual = mockMetadata.video.codec;
      let failed = false;
      if (rule.operator === 'eq' && actual !== rule.value) failed = true;
      if (rule.operator === 'lte' && actual > rule.value) failed = true;
      if (failed) {
        violations.push({
          rule_id: rule.id,
          field: rule.field,
          actual,
          expected: rule.value,
          message: rule.message,
          severity: rule.severity,
          fix: rule.fix
        });
      }
    });
    const hasCritical = violations.some(v => v.severity === 'critical');
    const status = violations.length === 0 ? 'pass' : (hasCritical ? 'fail' : 'warning');
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      filename,
      size,
      status,
      created_at: new Date().toISOString(),
      metadata: mockMetadata,
      validation: {
        status,
        violations,
        validated_at: new Date().toISOString()
      }
    };
    const updated = [newAsset, ...assets];
    await this.ctx.storage.put("assets", updated);
    return newAsset;
  }
  // Support legacy demo methods for compatibility
  async getCounterValue(): Promise<number> { return (await this.ctx.storage.get("counter_value")) || 0; }
  async increment(amount = 1): Promise<number> {
    let v: number = (await this.ctx.storage.get("counter_value")) || 0;
    v += amount; await this.ctx.storage.put("counter_value", v); return v;
  }
}