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
  const codecs = ['h264', 'prores', 'hevc', 'av1'];
  const resOptions = ['1920x1080', '3840x2160', '1280x720'];
  const formats = ['mp4', 'mov', 'mxf'];
  // Use hash to pick semi-random but stable values
  const videoCodec = codecs[hash % codecs.length];
  const resolution = resOptions[(hash >> 2) % resOptions.length];
  const format = formats[(hash >> 4) % formats.length];
  // Bitrate is roughly correlated to size, but spiked by hash for validation testing
  // Base bitrate ~8Mbps, variation up to 15Mbps
  const baseBitrate = 8000000;
  const variance = (hash % 100) * 100000;
  const bitrate = baseBitrate + variance;
  return {
    video: {
      codec: videoCodec,
      bitrate: bitrate,
      fps: (hash % 2) === 0 ? 29.97 : 24,
      resolution: resolution,
      duration: 15 + (hash % 45),
      format: format,
      color_space: 'bt709'
    },
    audio: {
      codec: (hash % 3) === 0 ? 'aac' : 'pcm',
      channels: 2,
      sample_rate: 48000,
      bitrate: 192000
    }
  };
}