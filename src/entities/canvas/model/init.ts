import type { TCanvasOptions } from "node_modules/fabric/dist/src/canvas/CanvasOptions";
import { GestureCanvas } from "./GestureCanvas";
import { Rect } from "fabric";

export const initCanvas = (
	canvasElement: HTMLCanvasElement | undefined,
	options: TCanvasOptions,
) => {
	return new GestureCanvas(canvasElement, options);
};

const drawingAreaWidth = 400;
const drawingAreaHeight = 600;

export const setupCanvasResizing = (
	canvas: GestureCanvas,
	containerElement: HTMLElement | null,
) => {
	const clientWidth = containerElement?.clientWidth || 0;
	const clientHeight = containerElement?.clientHeight || 0;

	const drawingAreaX = (clientWidth - drawingAreaWidth) / 2;
	const drawingAreaY = (clientHeight - drawingAreaHeight) / 2;

	const setCurrentDimensions = () => {
		if (!canvas) return;
		canvas.setDimensions({
			height: clientHeight,
			width: clientWidth,
		});

		const drawingAreaClipRect = new Rect({
			left: drawingAreaX,
			top: drawingAreaY,
			width: drawingAreaWidth,
			height: drawingAreaHeight,
			absolutePositioned: true,
		});

		const backgroundRect = new Rect({
			left: drawingAreaX,
			top: drawingAreaY,
			width: drawingAreaWidth,
			height: drawingAreaHeight,
			fill: "white",
			selectable: false,
			evented: false,
			excludeFromExport: true,
		});

		canvas.add(backgroundRect);

		canvas.clipPath = drawingAreaClipRect;

		canvas.renderAll();

		// Set boundaries for panning
		canvas.setPanBoundaries({
			clientWidth,
			clientHeight,
			drawingAreaX,
			drawingAreaY,
			drawingAreaWidth,
			drawingAreaHeight,
		});
	};

	setCurrentDimensions();
	return setCurrentDimensions;
};
