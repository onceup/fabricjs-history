import { useRef, useState, useCallback } from 'react';
import { Canvas } from '@/entities/canvas/ui/Canvas';
import { DrawingControls } from '@/features/drawing/ui/DrawingControls';
import { HistoryControls } from '@/features/history/ui/HistoryControls';
import { setupDrawingBrush } from '@/features/drawing/model/handlers';
import { HistoryCanvas } from '@/entities/canvas/model/HistoryCanvas';
import { SaveCanvasButton } from '@/features/canvas/ui/SaveCanvasButton';
import { memo } from 'react';

const Fabricjs = memo(function Fabricjs() {
  const canvas = useRef<HistoryCanvas | null>(null);
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const [lineWidth, setLineWidth] = useState(1);
  const [opacity, setOpacity] = useState(1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const handleCanvasReady = useCallback((fabricCanvas: HistoryCanvas) => {
    canvas.current = fabricCanvas;
    setupDrawingBrush(fabricCanvas, lineWidth, opacity);

    const updateHistoryState = () => {
      if (canvas.current) {
        setCanUndo(canvas.current.canUndo());
        setCanRedo(canvas.current.canRedo());
      }
    };

    fabricCanvas.on('history:modified', updateHistoryState);
  }, []);

  const handleUndo = useCallback(() => {
    canvas.current?.undo();
  }, []);

  const handleRedo = useCallback(() => {
    canvas.current?.redo();
  }, []);

  const handleLineWidthChange = useCallback(
    (width: number) => {
      setLineWidth(width);
      if (canvas.current) {
        setupDrawingBrush(canvas.current, width, opacity);
      }
    },
    [opacity]
  );

  const handleOpacityChange = useCallback(
    (newOpacity: number) => {
      setOpacity(newOpacity);
      if (canvas.current) {
        setupDrawingBrush(canvas.current, lineWidth, newOpacity);
      }
    },
    [lineWidth]
  );

  return (
    <div className='flex flex-col h-full min-w-96'>
      <div className='flex flex-wrap gap-4 justify-between items-center'>
        <DrawingControls
          lineWidth={lineWidth}
          opacity={opacity}
          onLineWidthChange={handleLineWidthChange}
          onOpacityChange={handleOpacityChange}
        />
        <HistoryControls
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </div>
      <Canvas canvasEl={canvasEl} onCanvasReady={handleCanvasReady} />
      <SaveCanvasButton canvas={canvasEl.current} />
    </div>
  );
});

export default Fabricjs;
