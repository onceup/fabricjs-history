import { PencilBrush } from 'fabric';
import { HistoryCanvas } from '@/entities/canvas/model/HistoryCanvas';
import type { ObjectEvents } from 'fabric';

export const setupDrawingBrush = (
  canvas: HistoryCanvas,
  lineWidth: number,
  opacity: number
) => {
  canvas.freeDrawingBrush = new PencilBrush(canvas);
  canvas.freeDrawingBrush.width = lineWidth;
  canvas.freeDrawingBrush.color = `rgba(0,0,0,${opacity})`;
};

export const handleObjectAdded = (e: ObjectEvents) => {
  console.log('object:added', e);
};
