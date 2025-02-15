import { CircleBrush, PencilBrush } from 'fabric';
import { HistoryCanvas } from '@/entities/canvas/model/HistoryCanvas';
import { InkBrush } from '@/entities/brushes/InkBrush';

export const setupDrawingBrush = (
  canvas: HistoryCanvas,
  lineWidth: number,
  opacity: number
) => {
  // canvas.freeDrawingBrush = new CircleBrush(canvas);
  canvas.freeDrawingBrush = new InkBrush(canvas);
  canvas.freeDrawingBrush.width = lineWidth;
  canvas.freeDrawingBrush.color = `rgba(0,0,0,${opacity})`;
};
