import { toPng } from 'html-to-image';

// Rasterize a DOM node to a PNG and trigger a download.
export async function downloadNodeAsPng(node, filename = 'password-report.png') {
  if (!node) return;
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
