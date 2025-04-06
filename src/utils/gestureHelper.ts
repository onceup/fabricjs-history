import { Canvas, Point } from "fabric";
import { gestureDetector } from "./gestureDetector";

// Constants
const PAN_MARGIN = 20; // Margins when checking canvas bounds
const MIN_ZOOM = 0.8; // Minimum zoom level for mobile
const MAX_ZOOM = 10; // Maximum zoom level
const ZOOM_DAMPENING = 0.2; // Dampen the zoom effect for a smoother experience

/**
 * Checks if the current environment is a mobile device
 */
export function isMobile(): boolean {
	return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/**
 * Sets up zoom and pan functionality for a Fabric.js canvas
 * @param canvas Fabric.js canvas instance
 * @param upperCanvasEl The upper canvas element for touch gestures
 */
export function enableZoomAndPan(
	canvas: Canvas,
	upperCanvasEl: HTMLCanvasElement,
): void {
	if (isMobile()) {
		enableMobileGestures(canvas, upperCanvasEl);
	} else {
		enablePCGestures(canvas);
	}
}

/**
 * Enables zooming and panning for mobile devices using gesture detection
 * @param canvas Fabric.js canvas instance
 * @param upperCanvasEl The upper canvas element for touch gestures
 */
export function enableMobileGestures(
	canvas: Canvas,
	upperCanvasEl: HTMLCanvasElement,
): void {
	let isRotating = false;
	let isUsingGesture = false;

	gestureDetector(upperCanvasEl, {
		onGestureStart: () => {
			// Disable object caching during gestures for better performance
			canvas.getObjects().forEach((obj) => {
				setCacheForObjects([obj], false);
			});
			isUsingGesture = true;
		},
		onZoom: (scale: number, previousScale: number, center: Point) => {
			// Skip tiny scale changes for better performance
			if (Math.abs(scale - previousScale) < 0.005) return;

			// Check if we're working with a selected object or the canvas
			const activeObject = canvas.getActiveObject();
			if (activeObject && !isRotating) {
				// Scale the selected object
				const scaleDiff = scale - previousScale;
				activeObject._setOriginToCenter();
				activeObject.scaleX = activeObject.scaleX
					? activeObject.scaleX * (1 + scaleDiff)
					: 1;
				activeObject.scaleY = activeObject.scaleY
					? activeObject.scaleY * (1 + scaleDiff)
					: 1;
				activeObject._resetOrigin();
				activeObject.setCoords();
				canvas.requestRenderAll();
			} else {
				// Zoom the canvas
				handleZoom(scale, center.x, center.y, canvas, previousScale);
				canvas.requestRenderAll();
			}
		},
		onRotate: (angleDifference: number, center: Point) => {
			const activeObject = canvas.getActiveObject();
			if (!activeObject || !isUsingGesture) return;

			const rotationThreshold = 0.8;
			isRotating = Math.abs(angleDifference) > rotationThreshold;

			if (isRotating) {
				const currentAngle = activeObject.angle || 0;
				activeObject.rotate((currentAngle + angleDifference) % 360);
				activeObject.setCoords();
				canvas.requestRenderAll();
			}
		},
		onDrag: (
			dx: number,
			dy: number,
			previousDx: number,
			previousDy: number,
		) => {
			// Don't pan if we're manipulating a selected object
			if (canvas.getActiveObject() && isUsingGesture) return;

			const delta = {
				x: 2 * (dx - previousDx),
				y: 2 * (dy - previousDy),
			};
			handlePan(delta, canvas);
			canvas.requestRenderAll();
		},
		onGestureEnd: (fingers: number) => {
			if (fingers === 0) {
				// Re-enable object caching when gesture ends
				canvas.getObjects().forEach((obj) => {
					setCacheForObjects([obj], true);
				});

				// If we were transforming an object, reset flags
				if (isUsingGesture) {
					const activeObject = canvas.getActiveObject();
					if (activeObject) {
						setTimeout(() => {
							isUsingGesture = false;
							isRotating = false;
							canvas.requestRenderAll();
						}, 100);
					}
				}
			}
		},
	});
}

/**
 * Set caching for objects to improve performance
 * @param objects Array of Fabric.js objects
 * @param enabled Whether to enable caching
 */
function setCacheForObjects(objects: fabric.Object[], enabled: boolean): void {
	for (const obj of objects) {
		if (obj.type === "group" && (obj as fabric.Group).getObjects) {
			setCacheForObjects((obj as fabric.Group).getObjects(), enabled);
		}
		obj.objectCaching = enabled;
	}
}

/**
 * Enables zooming and panning for desktop devices
 * @param canvas Fabric.js canvas instance
 */
export function enablePCGestures(canvas: Canvas): void {
	let panStartPoint: Point | null = null;

	// Mouse wheel for zooming
	canvas.on("mouse:wheel", (e) => {
		const deltaY = e.e.deltaY;
		const zoomFactor = Math.exp(-deltaY / 50);
		handleZoom(zoomFactor, e.e.offsetX, e.e.offsetY, canvas);
		e.e.preventDefault();
		e.e.stopPropagation();
	});

	// Middle mouse button for panning
	canvas.on("mouse:down", (o) => {
		const event = o.e;
		if (event.button === 1) {
			// Middle button
			panStartPoint = new Point(event.pageX, event.pageY);
			event.preventDefault();
			event.stopPropagation();
		}
	});

	canvas.on("mouse:move", (o) => {
		if (panStartPoint) {
			const event = o.e;
			const deltaX = event.pageX - panStartPoint.x;
			const deltaY = event.pageY - panStartPoint.y;
			panStartPoint = new Point(event.pageX, event.pageY);
			handlePan(new Point(deltaX, deltaY), canvas);
			canvas.requestRenderAll();
		}
	});

	canvas.on("mouse:up", (o) => {
		if (panStartPoint) {
			panStartPoint = null;
			o.e.preventDefault();
			o.e.stopPropagation();
		}
	});
}

/**
 * Ensures the canvas stays within reasonable bounds during pan operations
 * @param canvas Fabric.js canvas instance
 */
export function checkCanvasBounds(canvas: Canvas): void {
	const vpt = canvas.viewportTransform;
	if (!vpt) return;

	const canvasWidth = canvas.getWidth();
	const canvasHeight = canvas.getHeight();
	const zoomFactor = canvas.getZoom();

	// Check left boundary
	if (vpt[4] >= PAN_MARGIN) {
		vpt[4] = PAN_MARGIN;
	} else if (vpt[4] < canvasWidth - canvasWidth * zoomFactor - PAN_MARGIN) {
		vpt[4] = canvasWidth - canvasWidth * zoomFactor - PAN_MARGIN;
	}

	// Check top boundary
	if (vpt[5] >= PAN_MARGIN) {
		vpt[5] = PAN_MARGIN;
	} else if (vpt[5] < canvasHeight - canvasHeight * zoomFactor - PAN_MARGIN) {
		vpt[5] = canvasHeight - canvasHeight * zoomFactor - PAN_MARGIN;
	}

	canvas.setViewportTransform(vpt);
}

/**
 * Handles zoom operations on the canvas
 * @param scale Scale factor
 * @param centerX X coordinate to zoom towards
 * @param centerY Y coordinate to zoom towards
 * @param canvas Fabric.js canvas instance
 * @param previousScale Previous scale factor (for mobile gestures)
 */
export function handleZoom(
	scale: number,
	centerX: number,
	centerY: number,
	canvas: Canvas,
	previousScale?: number,
): void {
	const minZoom = isMobile() ? MIN_ZOOM : 1;
	let newZoom = previousScale
		? canvas.getZoom() * (scale / previousScale)
		: (Math.log(scale) / Math.log(2)) * ZOOM_DAMPENING + canvas.getZoom();

	// Limit zoom level
	newZoom = Math.min(newZoom, MAX_ZOOM);
	newZoom = Math.max(newZoom, minZoom);

	// Zoom to the point where the gesture is happening
	const gestureCenter = new Point(centerX, centerY);
	canvas.zoomToPoint(gestureCenter, newZoom);

	// Ensure the canvas stays within bounds
	checkCanvasBounds(canvas);
}

/**
 * Handles pan operations on the canvas
 * @param delta Delta coordinates to pan
 * @param canvas Fabric.js canvas instance
 */
export function handlePan(delta: Point, canvas: Canvas): void {
	canvas.relativePan(delta);
	checkCanvasBounds(canvas);
}

/**
 * Resets the zoom and pan of the canvas
 * @param canvas Fabric.js canvas instance
 */
export function resetZoom(canvas: Canvas): void {
	canvas.setZoom(1);
	canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
	canvas.renderAll();
}
