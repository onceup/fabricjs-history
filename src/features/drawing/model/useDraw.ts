import { useDrawingStore } from "./drawingStore";
import { Draw } from "@/entities/modules/Draw";
import type { HistoryCanvas } from "@/entities/canvas/model/HistoryCanvas";

// Function to render the free drawing preview
export const renderDrawPreview = (canvas: HistoryCanvas) => {
	// const drawingStore = useDrawingStore.getState();
	// const temp = drawingStore.temp;
	// if (temp) {
	// 	temp.update(drawingStore.freeDrawPoints);
	// } else {
	// 	const draw = new Draw(drawingStore.freeDrawPoints, canvas);
	// 	draw.render();
	// 	drawingStore.setTemp(draw);
	// }
};

// Hook to use drawing functionality
export const useDraw = (canvas: HistoryCanvas) => {
	// const drawingStore = useDrawingStore();

	// Handle mouse down event
	const handleMouseDown = (evt: any) => {
		// Initialize drawing state on mouse down
		// if (drawingStore.mode === "FreeDraw" && evt.button === 1) {
		// 	// Start drawing
		// 	drawingStore.setIsDrawing(true);
		// 	// Set the starting point
		// 	if (evt.absolutePointer) {
		// 		const { x, y } = evt.absolutePointer;
		// 		drawingStore.setMouseFrom({ x, y });
		// 		drawingStore.clearFreeDrawPoints();
		// 		drawingStore.setFreeDrawPoints({ x, y });
		// 	}
		// }
	};

	// Handle mouse move event
	const handleMouseMove = (evt: any) => {
		// Handle free drawing
		// if (
		// 	drawingStore.isDrawing &&
		// 	drawingStore.mode === "FreeDraw" &&
		// 	evt.button === 1
		// ) {
		// 	if (evt.absolutePointer) {
		// 		const { x, y } = evt.absolutePointer;
		// 		drawingStore.setMouseTo({ x, y });
		// 		drawingStore.setFreeDrawPoints({ x, y });
		// 		renderDrawPreview(canvas);
		// 	}
		// }
	};

	// Handle mouse up event
	const handleMouseUp = () => {
		// if (drawingStore.isDrawing) {
		// 	drawingStore.setIsDrawing(false);
		// 	// If we had a temporary object, finalize it
		// 	if (drawingStore.temp) {
		// 		drawingStore.setTemp(null);
		// 	}
		// 	// Clear the points for the next drawing
		// 	drawingStore.clearFreeDrawPoints();
		// }
	};

	return {
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
	};
};
