export interface VideoMetadata {
  codec: string;
  codec_name?: string;
  bitrate: number;
  fps: number;
  r_frame_rate?: string;
  resolution: string;
  width?: number;
  height?: number;
  duration: number;
  format: string;
  color_space: string;
  profile?: string;
}
export interface AudioMetadata {
  codec: string;
  codec_name?: string;
  channels: number;
  sample_rate: number;
  bitrate: number;
  bits_per_sample?: number;
}
export type RuleOperator = 'eq' | 'lte' | 'gte' | 'contains' | 'regex';
export interface Rule {
  id: string;
  field: string;
  operator: RuleOperator;
  value: string | number;
  severity: 'critical' | 'warning';
  message: string;
  fix: string;
  reason?: string;
}
export interface ValidationViolation {
  rule_id: string;
  field: string;
  actual: string | number;
  expected: string | number;
  message: string;
  severity: 'critical' | 'warning';
  fix: string;
  reason?: string;
}
export interface ValidationResult {
  status: 'pass' | 'fail' | 'warning';
  violations: ValidationViolation[];
  validated_at: string;
}
export interface Profile {
  id: string;
  name: string;
  description: string;
  rules: Rule[];
  created_at: string;
  updated_at: string;
}
export type ProfileCreate = Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
export type ProfileUpdate = Partial<ProfileCreate>;
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';
export type JobType = 'ingest' | 'transform' | 'validate';
export interface JobLog {
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error';
}
export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  asset_id: string;
  target_profile_id?: string;
  progress: number;
  logs: JobLog[];
  started_at?: string;
  completed_at?: string;
  created_at: string;
}
export type AssetStatus = 'queued' | 'processing' | 'pass' | 'fail' | 'warning' | 'transcoding';
export interface Asset {
  id: string;
  filename: string;
  size: number;
  status: AssetStatus;
  processing_progress: number;
  profile_id?: string;
  current_job_id?: string;
  storage_path?: string;
  created_at: string;
  metadata?: {
    video: VideoMetadata;
    audio: AudioMetadata;
  };
  validation?: ValidationResult;
  parent_id?: string;
  expires_at?: string;
}
export interface QueueStats {
  active_jobs: number;
  queued_jobs: number;
  completed_24h: number;
  avg_wait_time: number;
  system_load: number;
}
export interface SystemActivity {
  id: string;
  type: 'ingest' | 'validation' | 'transform' | 'system';
  message: string;
  timestamp: string;
  status: 'success' | 'failure' | 'info';
  asset_id?: string;
}
export interface ManualSection {
  title: string;
  slug: string;
  content: string;
  icon: string;
}
export interface BatchActionRequest {
  assetIds: string[];
  action: 'validate' | 'delete' | 'export' | 'transform';
  targetProfileId?: string;
}
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface DemoItem {
  id: string;
  name: string;
  value: number;
}