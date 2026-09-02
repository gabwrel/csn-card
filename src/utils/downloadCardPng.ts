import { toPng } from 'html-to-image';

/**
 * Captures an entire DOM card element and triggers a crisp PNG download.
 */
export async function downloadCardAsPng(
  element: HTMLElement,
  filename: string = 'cant-say-no-card.png'
): Promise<void> {
  if (!element) {
    throw new Error('No element provided for PNG export');
  }

  const dataUrl = await toPng(element, {
    quality: 0.98,
    pixelRatio: 2, // 2x crisp retina resolution
    backgroundColor: '#ffffff',
    cacheBust: true,
    filter: (node) => {
      if (node instanceof HTMLElement && (node.classList.contains('no-export') || node.classList.contains('print:hidden'))) {
        return false;
      }
      return true;
    },
  });

  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
