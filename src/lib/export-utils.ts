import type { Asset } from '@shared/types';
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
export function exportAssetsToJSON(assets: Asset[]) {
  const jsonString = JSON.stringify(assets, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  downloadBlob(blob, `videometa-export-${new Date().toISOString()}.json`);
}
export function exportAssetsToCSV(assets: Asset[]) {
  const headers = [
    'ID', 'Filename', 'Size (MB)', 'Status', 'Created At',
    'Video Codec', 'Resolution', 'Bitrate', 'FPS',
    'Violations Count', 'Validation Date'
  ];
  const rows = assets.map(asset => {
    const video = asset.metadata?.video;
    const sizeMB = (asset.size / (1024 * 1024)).toFixed(2);
    const violations = asset.validation?.violations.length ?? 0;
    return [
      asset.id,
      asset.filename,
      sizeMB,
      asset.status,
      asset.created_at,
      video?.codec ?? 'N/A',
      video?.resolution ?? 'N/A',
      video?.bitrate ?? 'N/A',
      video?.fps ?? 'N/A',
      violations,
      asset.validation?.validated_at ?? 'N/A'
    ].map(val => `"${val}"`).join(',');
  });
  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `videometa-export-${new Date().toISOString()}.csv`);
}