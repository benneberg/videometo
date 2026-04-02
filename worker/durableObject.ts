import { DurableObject } from "cloudflare:workers";
import type {
  Asset,
  Profile,
  Job,
  JobStatus,
  JobType,
  ValidationResult,
  ValidationViolation,
  ProfileCreate,
  ProfileUpdate,
  QueueStats,
  SystemActivity
} from '@shared/types';
import { generateProbedMetadata } from '../src/lib/deterministic-engine';
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
  private isProcessing = false;
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
  async getJobs(): Promise<Job[]> {
    return (await this.ctx.storage.get<Job[]>("jobs")) || [];
  }
  async getJob(id: string): Promise<Job | undefined> {
    const jobs = await this.getJobs();
    return jobs.find(j => j.id === id);
  }
  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const jobs = await this.getJobs();
    const index = jobs.findIndex(j => j.id === id);
    if (index === -1) return undefined;
    jobs[index] = { ...jobs[index], ...updates };
    await this.ctx.storage.put("jobs", jobs);
    return jobs[index];
  }
  async queueJob(type: JobType, asset_id: string, target_profile_id?: string): Promise<Job> {
    const jobs = await this.getJobs();
    const newJob: Job = {
      id: crypto.randomUUID(),
      type,
      status: 'queued',
      asset_id,
      target_profile_id,
      progress: 0,
      logs: [{ timestamp: new Date().toISOString(), message: `Job ${type} initialized and queued.`, level: 'info' }],
      created_at: new Date().toISOString()
    };
    await this.ctx.storage.put("jobs", [newJob, ...jobs].slice(0, 100));
    this.processQueue();
    return newJob;
  }
  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    try {
      let jobs = await this.getJobs();
      let nextJob = jobs.find(j => j.status === 'queued');
      while (nextJob) {
        await this.runJob(nextJob);
        jobs = await this.getJobs();
        nextJob = jobs.find(j => j.status === 'queued');
      }
    } finally {
      this.isProcessing = false;
    }
  }
  private async runJob(job: Job) {
    await this.updateJob(job.id, { status: 'running', started_at: new Date().toISOString() });
    await this.addJobLog(job.id, "Starting worker thread...", "info");
    try {
      if (job.type === 'ingest' || job.type === 'validate') {
        await this.handleIngestTask(job);
      } else if (job.type === 'transform') {
        await this.handleTransformTask(job);
      }
      await this.updateJob(job.id, { status: 'completed', progress: 100, completed_at: new Date().toISOString() });
      await this.addJobLog(job.id, "Job finished successfully.", "info");
    } catch (e) {
      await this.updateJob(job.id, { status: 'failed', completed_at: new Date().toISOString() });
      await this.addJobLog(job.id, `Fatal error: ${e instanceof Error ? e.message : String(e)}`, "error");
    }
  }
  private async handleIngestTask(job: Job) {
    const asset = await this.getAssetDetails(job.asset_id);
    if (!asset) throw new Error("Asset not found");
    await this.updateAsset(asset.id, { status: 'processing', processing_progress: 10, current_job_id: job.id });
    await this.addJobLog(job.id, "Extracting binary stream metadata...", "info");
    await new Promise(r => setTimeout(r, 1000));
    const meta = generateProbedMetadata(asset.filename, asset.size);
    await this.addJobLog(job.id, `Metadata extracted: ${meta.video.codec} ${meta.video.resolution}`, "info");
    const profiles = await this.getProfiles();
    const profile = profiles.find(p => p.id === (asset.profile_id || job.target_profile_id)) || profiles[0];
    await this.addJobLog(job.id, `Applying validation profile: ${profile.name}`, "info");
    const validation = this.runValidationLogic(meta, profile);
    await this.updateAsset(asset.id, { 
      status: validation.status, 
      metadata: meta, 
      validation, 
      processing_progress: 100,
      storage_path: `s3://videometa-prod/source/${asset.id}/${asset.filename}`
    });
  }
  private async handleTransformTask(job: Job) {
    if (!job.target_profile_id) throw new Error("Target profile required for transformation");
    const asset = await this.getAssetDetails(job.asset_id);
    if (!asset) throw new Error("Asset not found");
    await this.updateAsset(asset.id, { status: 'transcoding', processing_progress: 20 });
    await this.addJobLog(job.id, "Initializing FFmpeg encoder...", "info");
    for (let p = 40; p <= 100; p += 20) {
      await new Promise(r => setTimeout(r, 800));
      await this.updateJob(job.id, { progress: p });
      await this.updateAsset(asset.id, { processing_progress: p });
      await this.addJobLog(job.id, `Encoding progress: ${p}%`, "info");
    }
    const profiles = await this.getProfiles();
    const profile = profiles.find(p => p.id === job.target_profile_id);
    if (!profile) throw new Error("Profile not found");
    // Deterministic transcode result: force it to match profile
    const transformedMeta = {
      video: { 
        codec: 'h264', 
        bitrate: 8500000, 
        fps: 29.97, 
        resolution: '1920x1080', 
        duration: asset.metadata?.video.duration || 30, 
        format: 'mp4', 
        color_space: 'bt709' 
      },
      audio: { codec: 'aac', channels: 2, sample_rate: 48000, bitrate: 192000 }
    };
    const val = this.runValidationLogic(transformedMeta, profile);
    await this.updateAsset(asset.id, { 
      status: val.status, 
      metadata: transformedMeta, 
      validation: val, 
      processing_progress: 100,
      storage_path: `s3://videometa-prod/variants/${asset.id}_v1.mp4`
    });
  }
  private async addJobLog(jobId: string, message: string, level: Job['logs'][0]['level']) {
    const job = await this.getJob(jobId);
    if (!job) return;
    const logs = [...job.logs, { timestamp: new Date().toISOString(), message, level }];
    await this.updateJob(jobId, { logs });
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
  async getQueueStats(): Promise<QueueStats> {
    const jobs = await this.getJobs();
    const active = jobs.filter(j => j.status === 'running').length;
    const queued = jobs.filter(j => j.status === 'queued').length;
    const completed24h = jobs.filter(j => j.status === 'completed' && new Date(j.completed_at!).getTime() > Date.now() - 86400000).length;
    return {
      active_jobs: active,
      queued_jobs: queued,
      completed_24h: completed24h,
      avg_wait_time: 1.2, // Mocked
      system_load: (active / 4) * 100
    };
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
    await this.queueJob('ingest', newAsset.id, profileId);
    return newAsset;
  }
  async transformAsset(sourceId: string, targetProfileId: string): Promise<Asset | undefined> {
    const source = await this.getAssetDetails(sourceId);
    if (!source) return undefined;
    const variantAsset: Asset = {
      id: crypto.randomUUID(),
      filename: `${source.filename.split('.')[0]}_compliant.mp4`,
      size: source.size * 0.8,
      status: 'queued',
      processing_progress: 0,
      profile_id: targetProfileId,
      created_at: new Date().toISOString(),
      parent_id: sourceId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    const assets = await this.getAssets();
    await this.ctx.storage.put("assets", [variantAsset, ...assets]);
    await this.queueJob('transform', variantAsset.id, targetProfileId);
    return variantAsset;
  }
  async deleteAssets(ids: string[]): Promise<void> {
    const assets = (await this.getAssets()).filter(a => !ids.includes(a.id));
    await this.ctx.storage.put("assets", assets);
  }
  async batchValidate(ids: string[]): Promise<void> {
    for (const id of ids) await this.queueJob('validate', id);
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
  async getRecentActivity(): Promise<SystemActivity[]> {
    const jobs = await this.getJobs();
    return jobs.slice(0, 10).map(j => ({
      id: j.id,
      type: j.type as any,
      message: `${j.type.toUpperCase()} Job for ${j.asset_id.slice(0,8)}: ${j.status}`,
      timestamp: j.created_at,
      status: j.status === 'completed' ? 'success' : (j.status === 'failed' ? 'failure' : 'info'),
      asset_id: j.asset_id
    }));
  }
}