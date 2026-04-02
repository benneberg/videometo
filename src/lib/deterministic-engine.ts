import type { VideoMetadata, AudioMetadata } from '@shared/types';
export function getDeterministicHash(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
export function generateProbedMetadata(filename: string, size: number): { video: VideoMetadata; audio: AudioMetadata } {
  const hash = getDeterministicHash(`${filename}-${size}`);
  const codecs = [
    { id: 'h264', name: 'H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10', profile: 'High' },
    { id: 'prores', name: 'Apple ProRes 422 HQ', profile: '422 HQ' },
    { id: 'hevc', name: 'H.265 / HEVC (High Efficiency Video Coding)', profile: 'Main' }
  ];
  const resOptions = [
    { label: '1920x1080', w: 1920, h: 1080 },
    { label: '3840x2160', w: 3840, h: 2160 },
    { label: '1280x720', w: 1280, h: 720 }
  ];
  const formats = ['mp4', 'mov', 'mxf'];
  const selectedCodec = codecs[hash % codecs.length];
  const selectedRes = resOptions[(hash >> 2) % resOptions.length];
  const selectedFormat = formats[(hash >> 4) % formats.length];
  const baseBitrate = 8000000;
  const variance = (hash % 100) * 100000;
  const bitrate = baseBitrate + variance;
  return {
    video: {
      codec: selectedCodec.id,
      codec_name: selectedCodec.name,
      bitrate: bitrate,
      fps: (hash % 2) === 0 ? 29.97 : 24,
      r_frame_rate: (hash % 2) === 0 ? '30000/1001' : '24/1',
      resolution: selectedRes.label,
      width: selectedRes.w,
      height: selectedRes.h,
      duration: 15 + (hash % 45),
      format: selectedFormat,
      color_space: 'bt709',
      profile: selectedCodec.profile
    },
    audio: {
      codec: (hash % 3) === 0 ? 'aac' : 'pcm',
      codec_name: (hash % 3) === 0 ? 'AAC (Advanced Audio Coding)' : 'PCM signed 16-bit little-endian',
      channels: 2,
      sample_rate: 48000,
      bitrate: 192000,
      bits_per_sample: 16
    }
  };
}