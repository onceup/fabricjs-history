import { TCanvasOptions } from 'node_modules/fabric/dist/src/canvas/CanvasOptions';
import { HistoryCanvas } from './HistoryCanvas';

export const initCanvas = (
  canvasElement: HTMLCanvasElement | undefined,
  options: TCanvasOptions
) => {
  return new HistoryCanvas(canvasElement, options);
};

export const setupCanvasResizing = (
  canvas: HistoryCanvas,
  containerElement: HTMLElement | null
) => {
  const setCurrentDimensions = () => {
    if (!canvas) return;
    canvas.setDimensions({
      height: containerElement?.clientHeight || 0,
      width: containerElement?.clientWidth || 0,
    });
    canvas.renderAll();
  };

  setCurrentDimensions();
  return setCurrentDimensions;
};
