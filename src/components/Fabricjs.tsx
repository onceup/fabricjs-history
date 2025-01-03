import { useRef, useState, useCallback } from 'react';
import { Canvas } from '@/entities/canvas/ui/Canvas';
import { DrawingControls } from '@/features/drawing/ui/DrawingControls';
import { HistoryControls } from '@/features/history/ui/HistoryControls';
import { setupDrawingBrush } from '@/features/drawing/model/handlers';
import { HistoryCanvas } from '@/entities/canvas/model/HistoryCanvas';

function Fabricjs() {
  const canvas = useRef<HistoryCanvas | null>(null);
  const [lineWidth, setLineWidth] = useState(1);
  const [opacity, setOpacity] = useState(1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const handleCanvasReady = useCallback((fabricCanvas: HistoryCanvas) => {
    window.fabricCanvas = fabricCanvas;
    canvas.current = fabricCanvas;
    // canvas.current.on('object:added', handleObjectAdded);
    setupDrawingBrush(fabricCanvas, lineWidth, opacity);

    // Update undo/redo states whenever canvas changes
    const updateHistoryState = (...sss: any[]) => {
      console.log('sss', sss);
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
    <div className='flex flex-col h-full'>
      <div className='flex justify-between items-center'>
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
      <Canvas onCanvasReady={handleCanvasReady} />
    </div>
  );
}

export default Fabricjs;
