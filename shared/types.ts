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
export interface Rule {
  id: string;
  field: string;
  operator: 'eq' | 'lte' | 'gte' | 'contains';
  value: string | number;
  severity: 'critical' | 'warning';
  message: string;
  fix: string;
}
export interface ValidationViolation {
  rule_id: string;
  field: string;
  actual: string | number;
  expected: string | number;
  message: string;
  severity: 'critical' | 'warning';
  fix: string;
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
}
export interface Asset {
  id: string;
  filename: string;
  size: number;
  status: 'processing' | 'pass' | 'fail' | 'warning';
  created_at: string;
  metadata?: {
    video: VideoMetadata;
    audio: AudioMetadata;
  };
  validation?: ValidationResult;
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