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
    canvas.setHeight(containerElement?.clientHeight || 0);
    canvas.setWidth(containerElement?.clientWidth || 0);
    canvas.renderAll();
  };

  setCurrentDimensions();
  return setCurrentDimensions;
};