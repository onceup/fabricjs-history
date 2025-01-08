import { useEffect, useRef } from 'react';
import { HistoryCanvas } from '../model/HistoryCanvas';
import { initCanvas, setupCanvasResizing } from '../model/init';

interface CanvasProps {
  canvasEl: React.RefObject<HTMLCanvasElement>;
  onCanvasReady: (canvas: HistoryCanvas) => void;
}

export const Canvas = ({ onCanvasReady, canvasEl }: CanvasProps) => {
  const canvasElParent = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = initCanvas(canvasEl.current ?? undefined, {
      isDrawingMode: true,
    });

    const resizeHandler = setupCanvasResizing(canvas, canvasElParent.current);
    window.addEventListener('resize', resizeHandler, false);

    onCanvasReady(canvas);

    return () => {
      canvas.dispose();
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  return (
    <div ref={canvasElParent} className='min-h-96 min-w-96 border-2'>
      <canvas ref={canvasEl} />
    </div>
  );
};
