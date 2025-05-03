import { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas } from '@/entities/canvas/ui/Canvas';
import { DrawingControls } from '@/features/drawing/ui/DrawingControls';
import { HistoryControls } from '@/features/history/ui/HistoryControls';
import { setupDrawingBrush, setupDrawEvents, setDrawingMode } from '@/features/drawing/model/handlers';
import type { HistoryCanvas } from '@/entities/canvas/model/HistoryCanvas';
import { SaveCanvasButton } from '@/features/canvas/ui/SaveCanvasButton';
import { memo } from 'react';
import { FreehandControls } from '@/features/drawing/ui/FreehandControls';
import { PerfectFreehandBrush } from '@/entities/brushes/PerfectFreehandBrush';
import { useDrawingStore } from '@/features/drawing/model/drawingStore';

const Fabricjs = memo(function Fabricjs() {
  const canvas = useRef<HistoryCanvas | null>(null);
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const [lineWidth, setLineWidth] = useState(4.25);
  const [opacity, setOpacity] = useState(1);
  const [thinning, setThinning] = useState(0.618);
  const [streamline, setStreamline] = useState(0.5);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [mode, setMode] = useState<string>('FreeDraw');

  // Set drawing mode in the store
  // useEffect(() => {
  //   if (mode) {
  //     setDrawingMode(mode);
  //   }
  // }, [mode]);

  const handleCanvasReady = useCallback((fabricCanvas: HistoryCanvas) => {
    canvas.current = fabricCanvas;
    setupDrawingBrush(fabricCanvas, lineWidth, opacity);

    // Set up drawing events
    // const cleanup = setupDrawEvents(fabricCanvas);

    // Apply perfect-freehand specific properties if brush is PerfectFreehandBrush
    // if (fabricCanvas.freeDrawingBrush instanceof PerfectFreehandBrush) {
    //   const brush = fabricCanvas.freeDrawingBrush as PerfectFreehandBrush;
    //   brush.thinning = thinning;
    //   brush.streamline = streamline;
    // }

    const updateHistoryState = () => {
      if (canvas.current) {
        setCanUndo(canvas.current.canUndo());
        setCanRedo(canvas.current.canRedo());
      }
    };

    fabricCanvas.on('history:modified', updateHistoryState);

    // Return cleanup function
    return () => {
      // cleanup();
      // fabricCanvas.off('history:modified', updateHistoryState);
    };
  }, [lineWidth, opacity, thinning, streamline]);

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

        // Apply other properties if using perfect-freehand brush
        // if (canvas.current.freeDrawingBrush instanceof PerfectFreehandBrush) {
        //   const brush = canvas.current.freeDrawingBrush as PerfectFreehandBrush;
        //   brush.thinning = thinning;
        //   brush.streamline = streamline;
        // }
      }
    },
    [opacity, thinning, streamline]
  );

  const handleOpacityChange = useCallback(
    (newOpacity: number) => {
      setOpacity(newOpacity);
      if (canvas.current) {
        setupDrawingBrush(canvas.current, lineWidth, newOpacity);

        // Apply other properties if using perfect-freehand brush
        // if (canvas.current.freeDrawingBrush instanceof PerfectFreehandBrush) {
        //   const brush = canvas.current.freeDrawingBrush as PerfectFreehandBrush;
        //   brush.thinning = thinning;
        //   brush.streamline = streamline;
        // }
      }
    },
    [lineWidth, thinning, streamline]
  );

  const handleThinningChange = useCallback(
    (newThinning: number) => {
      setThinning(newThinning);
      if (canvas.current && canvas.current.freeDrawingBrush instanceof PerfectFreehandBrush) {
        const brush = canvas.current.freeDrawingBrush as PerfectFreehandBrush;
        brush.thinning = newThinning;
      }
    },
    []
  );

  const handleStreamlineChange = useCallback(
    (newStreamline: number) => {
      setStreamline(newStreamline);
      if (canvas.current && canvas.current.freeDrawingBrush instanceof PerfectFreehandBrush) {
        const brush = canvas.current.freeDrawingBrush as PerfectFreehandBrush;
        brush.streamline = newStreamline;
      }
    },
    []
  );

  const handleModeChange = useCallback((newMode: string) => {
    setMode(newMode);
  }, []);

  return (
    <div className='flex flex-col h-full min-w-96'>
      <div className='flex flex-wrap gap-4 justify-between items-start'>
        <div>
          <DrawingControls
            lineWidth={lineWidth}
            opacity={opacity}
            onLineWidthChange={handleLineWidthChange}
            onOpacityChange={handleOpacityChange}
          />
          {/* <div className="mt-4">
            <FreehandControls
              lineWidth={lineWidth}
              opacity={opacity}
              thinning={thinning}
              smoothing={0} // No smoothing as requested
              streamline={streamline}
              onLineWidthChange={handleLineWidthChange}
              onOpacityChange={handleOpacityChange}
              onThinningChange={handleThinningChange}
              onSmoothingChange={() => { }}
              onStreamlineChange={handleStreamlineChange}
            />
          </div>
          <div className="mt-4">
            <select
              value={mode}
              onChange={(e) => handleModeChange(e.target.value)}
              className="block w-full p-2 border rounded-md"
            >
              <option value="FreeDraw">Free Draw</option>
              <option value="Rect">Rectangle</option>
              <option value="Line">Line</option>
              <option value="Ellipse">Ellipse</option>
              <option value="Arrow">Arrow</option>
              <option value="Text">Text</option>
            </select>
          </div> */}
        </div>
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
