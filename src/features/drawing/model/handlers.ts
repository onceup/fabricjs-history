import type { HistoryCanvas } from "@/entities/canvas/model/HistoryCanvas";
// import { PerfectFreehandBrush } from "@/entities/brushes/PerfectFreehandBrush";
import { useDrawingStore } from "./drawingStore";
import { renderDrawPreview } from "./useDraw";
import { InkBrush } from "@/entities/brushes/InkBrush";

export const setupDrawingBrush = (
	canvas: HistoryCanvas,
	lineWidth: number,
	opacity: number,
) => {
	// Create and set our custom perfect-freehand brush
	canvas.freeDrawingBrush = new InkBrush(canvas);
	canvas.freeDrawingBrush.width = lineWidth;
	canvas.freeDrawingBrush.color = `rgba(0,0,0,${opacity})`;

	// Set perfect-freehand specific properties
	const brush = canvas.freeDrawingBrush as InkBrush;
	brush.opacity = opacity;
	// brush.thinning = 0.618;
	// brush.streamline = 0.5;

	// Enable free drawing mode
	canvas.isDrawingMode = true;
};

export const setupDrawEvents = (canvas: HistoryCanvas) => {
	const drawingStore = useDrawingStore.getState();

	// Mouse down handler
	const handleMouseDown = (evt: any) => {
		if (drawingStore.mode === "FreeDraw" && evt.button === 1) {
			drawingStore.setIsDrawing(true);

			if (evt.absolutePointer) {
				const { x, y } = evt.absolutePointer;
				drawingStore.setMouseFrom({ x, y });
				drawingStore.clearFreeDrawPoints();
				drawingStore.setFreeDrawPoints({ x, y });
			}
		}
	};

	// Mouse move handler
	const handleMouseMove = (evt: any) => {
		// if (
		// 	drawingStore.isDrawing &&
		// 	drawingStore.mode === "FreeDraw" &&
		// 	evt.button === 1
		// ) {
		if (evt.absolutePointer) {
			const { x, y } = evt.absolutePointer;
			drawingStore.setMouseTo({ x, y });
			drawingStore.setFreeDrawPoints({ x, y });
			renderDrawPreview(canvas);
		}
		// }
	};

	// Mouse up handler
	const handleMouseUp = () => {
		if (drawingStore.isDrawing) {
			drawingStore.setIsDrawing(false);
			if (drawingStore.temp) {
				drawingStore.setTemp(null);
			}
			drawingStore.clearFreeDrawPoints();
		}
	};

	// Set up event listeners
	canvas.on("mouse:down", handleMouseDown);
	canvas.on("mouse:move", handleMouseMove);
	canvas.on("mouse:up", handleMouseUp);

	// Return a cleanup function
	return () => {
		canvas.off("mouse:down", handleMouseDown);
		canvas.off("mouse:move", handleMouseMove);
		canvas.off("mouse:up", handleMouseUp);
	};
};

export const setDrawingMode = (mode: string) => {
	const drawingStore = useDrawingStore.getState();
	if (
		mode === "FreeDraw" ||
		mode === "Line" ||
		mode === "Rect" ||
		mode === "Ellipse" ||
		mode === "Arrow" ||
		mode === "Text"
	) {
		drawingStore.setMode(mode as any);
	}
};
