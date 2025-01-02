import { useEffect, useRef, useState } from 'react';
import { Canvas, PencilBrush } from 'fabric';

import { Slider } from '@/components/ui/slider';

function Fabricjs() {
  const canvas = useRef<Canvas | null>(null);
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const canvasElParent = useRef<HTMLDivElement>(null);
  const [lineWidth, setLineWidth] = useState(1);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    canvas.current = new Canvas(canvasEl.current ?? undefined, {
      isDrawingMode: true,
    });

    canvas.current.on('object:added', function (e) {
      console.log('object:added', e);
    });

    const setCurrentDimensions = () => {
      if (!canvas.current) return;

      canvas.current.setHeight(canvasElParent.current?.clientHeight || 0);
      canvas.current.setWidth(canvasElParent.current?.clientWidth || 0);
      canvas.current.renderAll();
    };

    const resizeCanvas = () => {
      setCurrentDimensions();
    };

    // Initial size setup
    setCurrentDimensions();
    window.addEventListener('resize', resizeCanvas, false);

    return () => {
      canvas.current?.dispose();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    if (!canvas.current) return;

    canvas.current.freeDrawingBrush = new PencilBrush(canvas.current);
    canvas.current.freeDrawingBrush.width = lineWidth;
    canvas.current.freeDrawingBrush.color = `rgba(0,0,0,${opacity})`;
  }, [lineWidth, opacity]);

  return (
    <div className='flex flex-col h-full'>
      <div className='flex gap-2 mb-2'>
        <div className='flex items-center gap-2'>
          Line Width:
          <Slider
            min={1}
            max={100}
            value={[lineWidth]}
            onValueChange={([value]) => {
              setLineWidth(value);
              if (canvas.current?.freeDrawingBrush) {
                canvas.current.freeDrawingBrush.width = value;
              }
            }}
            className='w-[200px]'
          />
          <span>{lineWidth}px</span>
        </div>

        <div className='flex items-center gap-2'>
          Opacity:
          <Slider
            min={0}
            max={100}
            value={[opacity * 100]}
            onValueChange={([value]) => {
              const newOpacity = value / 100;
              setOpacity(newOpacity);
            }}
            className='w-[200px]'
          />
          <span>{Math.round(opacity * 100)}%</span>
        </div>
      </div>

      <div ref={canvasElParent} className='min-h-96 min-w-96 border-2'>
        <canvas ref={canvasEl} className='' />
      </div>
    </div>
  );
}

export default Fabricjs;
