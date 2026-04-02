export interface VideoMetadata {
  codec: string;
  bitrate: number;
  fps: number;
  resolution: string;
  duration: number;
  format: string;
  color_space: string;
}
export interface AudioMetadata {
  codec: string;
  channels: number;
  sample_rate: number;
  bitrate: number;
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
  reason?: string; // Engineering rationale
}
export interface ValidationViolation {
  rule_id: string;
  field: string;
  actual: string | number;
  expected: string | number;
  message: string;
  severity: 'critical' | 'warning';
  fix: string;
  reason?: string; // Reason passed from rule
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
export type AssetStatus = 'queued' | 'processing' | 'pass' | 'fail' | 'warning' | 'transcoding';
export interface Asset {
  id: string;
  filename: string;
  size: number;
  status: AssetStatus;
  processing_progress: number;
  profile_id?: string;
  created_at: string;
  metadata?: {
    video: VideoMetadata;
    audio: AudioMetadata;
  };
  validation?: ValidationResult;
  parent_id?: string;
  lineage_root_id?: string;
  job_id?: string;
}
export interface SystemActivity {
  id: string;
  type: 'ingest' | 'validation' | 'transform' | 'system';
  message: string;
  timestamp: string;
  status: 'success' | 'failure' | 'info';
  asset_id?: string;
}
export type TransformationType = 'transcode' | 'extract' | 'optimize' | 'remux';
export interface TransformationJob {
  id: string;
  asset_id: string;
  source_asset_id: string;
  target_profile_id: string;
  type: TransformationType;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  created_at: string;
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