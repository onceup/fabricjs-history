import { useEffect } from "react";
import { Point } from "fabric";
import type { Canvas, TEvent } from "fabric";
import type { HistoryCanvas } from "@/entities/canvas/model/HistoryCanvas";

interface UseCanvasZoomOptions {
	minZoom?: number;
	maxZoom?: number;
	zoomFactor?: number;
}

export function setupCanvasZoom(
	canvas: Canvas,
	options: UseCanvasZoomOptions = {},
): () => void {
	// Return a cleanup function
	const { minZoom = 0.1, maxZoom = 20, zoomFactor = 0.999 } = options;

	const handleMouseWheel = (opt: TEvent<WheelEvent>) => {
		const delta = opt.e.deltaY;
		let zoom = canvas.getZoom();
		zoom *= zoomFactor ** delta;

		if (zoom > maxZoom) zoom = maxZoom;
		if (zoom < minZoom) zoom = minZoom;

		// Use offsetX/offsetY for coordinates relative to the canvas element
		canvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom);

		opt.e.preventDefault();
		opt.e.stopPropagation();
	};

	canvas.on("mouse:wheel", handleMouseWheel);

	// Return a cleanup function to remove the listener
	return () => {
		canvas.off("mouse:wheel", handleMouseWheel);
	};
}

export function useCanvasZoom(
	canvasRef: React.RefObject<HistoryCanvas | null>,
	options: UseCanvasZoomOptions = {},
) {
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const cleanup = setupCanvasZoom(canvas, options);
		return cleanup;
	}, [canvasRef, options]);
}
