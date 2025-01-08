/**
 * Converts the canvas to a blob and triggers a download.
 * @param canvas The canvas to be saved.
 */

export function saveCanvasAsBlob(canvas: HTMLCanvasElement) {
  canvas.toBlob((blob) => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'canvas.png';
      a.click();
      URL.revokeObjectURL(url);
    }
  });
}
