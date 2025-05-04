import type { TCanvasOptions } from "node_modules/fabric/dist/src/canvas/CanvasOptions";
import { GestureCanvas } from "./GestureCanvas";
import { Rect, Object as FabricObject } from "fabric";

// Override the default render method to disable image smoothing for all objects
const originalRender = FabricObject.prototype._render;
FabricObject.prototype._render = function (ctx) {
	// Always disable image smoothing before rendering any object
	if (ctx && ctx.imageSmoothingEnabled !== false) {
		ctx.imageSmoothingEnabled = false;
	}
	// Call the original render method
	return originalRender.call(this, ctx);
};

export const initCanvas = (
	canvasElement: HTMLCanvasElement | undefined,
	options: TCanvasOptions,
) => {
	const canvas = new GestureCanvas(canvasElement, options);
	canvas.imageSmoothingEnabled = false;

	// Also disable image smoothing in both contexts directly
	if (canvas.contextContainer) {
		canvas.contextContainer.imageSmoothingEnabled = false;
	}
	if (canvas.contextTop) {
		canvas.contextTop.imageSmoothingEnabled = false;
	}

	return canvas;
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

		// Set pan boundaries to keep the background rect visible
		canvas.setPanBoundaries(
			drawingAreaX,
			drawingAreaY,
			drawingAreaWidth,
			drawingAreaHeight,
		);

		// Ensure imageSmoothingEnabled stays false
		canvas.imageSmoothingEnabled = false;
		canvas.renderAll();
	};

	setCurrentDimensions();
	return setCurrentDimensions;
};
