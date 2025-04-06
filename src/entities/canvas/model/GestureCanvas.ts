import { HistoryCanvas } from "./HistoryCanvas";
import { gestureDetector } from "../../../utils/gestureDetector";
import { Point } from "fabric";

const PAN_MARGIN = 20; // Margins when checking canvas bounds
const MIN_ZOOM = 0.8; // Minimum zoom level for mobile
const MAX_ZOOM = 10; // Maximum zoom level
const ZOOM_DAMPENING = 0.2; // Dampen the zoom effect for a smoother experience

export class GestureCanvas extends HistoryCanvas {
	private isRotating = false;
	private isUsingGesture = false;
	private panStartPoint: Point | null = null;
	private gestureDetectorInstance: { destroy: () => void } | null = null;
	private wasDrawingMode = false;

	constructor(el?: string | HTMLCanvasElement, options = {}) {
		super(el, options);
		this.setupGestures();
	}

	/**
	 * Sets up gesture handling based on device type
	 */
	private setupGestures(): void {
		if (this.isMobile()) {
			this.enableMobileGestures();
		} else {
			this.enablePCGestures();
		}
	}

	/**
	 * Checks if the current environment is a mobile device
	 */
	private isMobile(): boolean {
		return "ontouchstart" in window || navigator.maxTouchPoints > 0;
	}

	/**
	 * Sets up mobile gesture handling
	 */
	private enableMobileGestures(): void {
		const upperCanvasEl = this.upperCanvasEl;
		if (!upperCanvasEl) return;

		this.gestureDetectorInstance = gestureDetector(upperCanvasEl, {
			onGestureStart: () => {
				// Save current drawing mode state
				this.wasDrawingMode = this.isDrawingMode;

				// Disable drawing mode during gestures
				if (this.isDrawingMode) {
					this.isDrawingMode = false;
					this.cancelCurrentDrawing();
				}

				// Disable object caching during gestures for better performance
				for (const obj of this.getObjects()) {
					this.setCacheForObjects([obj], false);
				}

				this.isUsingGesture = true;
			},
			onZoom: (scale: number, previousScale: number, center: Point) => {
				// Skip tiny scale changes for better performance
				if (Math.abs(scale - previousScale) < 0.005) return;

				// Check if we're working with a selected object or the canvas
				const activeObject = this.getActiveObject();
				if (activeObject && !this.isRotating) {
					// Scale the selected object
					const scaleDiff = scale - previousScale;

					// Use Fabric.js methods to scale properly
					const prevScaleX = activeObject.scaleX || 1;
					const prevScaleY = activeObject.scaleY || 1;

					// Use the appropriate function to avoid linter error
					activeObject.scale(prevScaleX * (1 + scaleDiff));
					activeObject.scaleY = prevScaleY * (1 + scaleDiff);

					this.requestRenderAll();
				} else {
					// Zoom the canvas
					this.handleZoom(scale, center.x, center.y, previousScale);
					this.requestRenderAll();
				}
			},
			onRotate: (angleDifference: number) => {
				const activeObject = this.getActiveObject();
				if (!activeObject || !this.isUsingGesture) return;

				const rotationThreshold = 0.8;
				this.isRotating = Math.abs(angleDifference) > rotationThreshold;

				if (this.isRotating) {
					const currentAngle = activeObject.angle || 0;
					activeObject.rotate((currentAngle + angleDifference) % 360);
					activeObject.setCoords();
					this.requestRenderAll();
				}
			},
			onDrag: (
				dx: number,
				dy: number,
				previousDx: number,
				previousDy: number,
			) => {
				// Don't pan if we're manipulating a selected object
				if (this.getActiveObject() && this.isUsingGesture) return;

				const delta = new Point(2 * (dx - previousDx), 2 * (dy - previousDy));
				this.handlePan(delta);
				this.requestRenderAll();
			},
			onGestureEnd: (fingers: number) => {
				if (fingers === 0) {
					// Re-enable object caching when gesture ends
					for (const obj of this.getObjects()) {
						this.setCacheForObjects([obj], true);
					}

					// If we were transforming an object, reset flags
					if (this.isUsingGesture) {
						const activeObject = this.getActiveObject();
						if (activeObject) {
							setTimeout(() => {
								this.isUsingGesture = false;
								this.isRotating = false;
								this.requestRenderAll();
							}, 100);
						}
					}

					// Restore drawing mode if it was previously enabled
					setTimeout(() => {
						if (this.wasDrawingMode) {
							this.isDrawingMode = true;
						}
					}, 150);
				}
			},
		});
	}

	/**
	 * Helper to clean up drawing artifacts when canceling a drawing
	 */
	private cancelCurrentDrawing(): void {
		if (!this.isDrawingMode) return;

		// Use setTimeout to prevent race conditions with fabric's event handling
		setTimeout(() => {
			// Clear the top canvas where drawing happens
			this.clearContext(this.contextTop);

			// Remove the last object if it appears to be an incomplete drawing
			const objects = this.getObjects();
			if (objects.length > 0) {
				const lastObject = objects[objects.length - 1];
				// Type assertion for path property access
				const pathObj = lastObject as { type: string; path?: Array<unknown> };
				if (
					pathObj.type === "path" &&
					// Check if it's likely an incomplete path (few points)
					(pathObj.path?.length || 0) < 3
				) {
					this.remove(lastObject);
				}
			}

			this.requestRenderAll();
		}, 10);
	}

	/**
	 * Sets up PC gesture handling (mouse wheel zoom and middle-click pan)
	 */
	private enablePCGestures(): void {
		// Mouse wheel for zooming
		this.on("mouse:wheel", (e) => {
			const deltaY = e.e.deltaY;
			const zoomFactor = Math.exp(-deltaY / 50);
			this.handleZoom(zoomFactor, e.e.offsetX, e.e.offsetY);
			e.e.preventDefault();
			e.e.stopPropagation();
		});

		// Middle mouse button for panning
		this.on("mouse:down", (o) => {
			if (o.e instanceof MouseEvent && o.e.button === 1) {
				// Middle button
				this.panStartPoint = new Point(o.e.pageX, o.e.pageY);
				o.e.preventDefault();
				o.e.stopPropagation();
			}
		});

		this.on("mouse:move", (o) => {
			if (this.panStartPoint && o.e instanceof MouseEvent) {
				const deltaX = o.e.pageX - this.panStartPoint.x;
				const deltaY = o.e.pageY - this.panStartPoint.y;
				this.panStartPoint = new Point(o.e.pageX, o.e.pageY);
				this.handlePan(new Point(deltaX, deltaY));
				this.requestRenderAll();
			}
		});

		this.on("mouse:up", (o) => {
			if (this.panStartPoint) {
				this.panStartPoint = null;
				o.e.preventDefault();
				o.e.stopPropagation();
			}
		});
	}

	/**
	 * Set caching for objects to improve performance
	 * @param objects Array of Fabric.js objects
	 * @param enabled Whether to enable caching
	 */
	private setCacheForObjects(
		objects: Record<string, any>[],
		enabled: boolean,
	): void {
		for (const obj of objects) {
			if (obj.type === "group" && obj.getObjects) {
				this.setCacheForObjects(obj.getObjects(), enabled);
			}
			obj.objectCaching = enabled;
		}
	}

	/**
	 * Ensures the canvas stays within reasonable bounds during pan operations
	 */
	private checkCanvasBounds(): void {
		const vpt = this.viewportTransform;
		if (!vpt) return;

		const canvasWidth = this.getWidth();
		const canvasHeight = this.getHeight();
		const zoomFactor = this.getZoom();

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

		this.setViewportTransform(vpt);
	}

	/**
	 * Handles zoom operations on the canvas
	 * @param scale Scale factor
	 * @param centerX X coordinate to zoom towards
	 * @param centerY Y coordinate to zoom towards
	 * @param previousScale Previous scale factor (for mobile gestures)
	 */
	private handleZoom(
		scale: number,
		centerX: number,
		centerY: number,
		previousScale?: number,
	): void {
		const minZoom = this.isMobile() ? MIN_ZOOM : 1;
		let newZoom = previousScale
			? this.getZoom() * (scale / previousScale)
			: (Math.log(scale) / Math.log(2)) * ZOOM_DAMPENING + this.getZoom();

		// Limit zoom level
		newZoom = Math.min(newZoom, MAX_ZOOM);
		newZoom = Math.max(newZoom, minZoom);

		// Zoom to the point where the gesture is happening
		const gestureCenter = new Point(centerX, centerY);
		this.zoomToPoint(gestureCenter, newZoom);

		// Ensure the canvas stays within bounds
		this.checkCanvasBounds();
	}

	/**
	 * Handles pan operations on the canvas
	 * @param delta Delta coordinates to pan
	 */
	private handlePan(delta: Point): void {
		this.relativePan(delta);
		this.checkCanvasBounds();
	}

	/**
	 * Resets the zoom and pan of the canvas
	 */
	public resetZoom(): void {
		this.setZoom(1);
		this.setViewportTransform([1, 0, 0, 1, 0, 0]);
		this.renderAll();
	}

	/**
	 * Clean up event listeners when the canvas is disposed
	 */
	async dispose(): Promise<boolean> {
		if (this.gestureDetectorInstance) {
			this.gestureDetectorInstance.destroy();
		}
		return super.dispose();
	}
}
