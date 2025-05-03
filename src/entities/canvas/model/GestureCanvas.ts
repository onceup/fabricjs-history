import { HistoryCanvas } from "./HistoryCanvas";
import { gestureDetector } from "../../../utils/gestureDetector";
import { Point, TPointerEvent } from "fabric";

const MIN_ZOOM = 0.5; // Minimum zoom level for mobile
const MAX_ZOOM = 2; // Maximum zoom level
const ZOOM_DAMPENING = 0.2; // Dampen the zoom effect for a smoother experience

export class GestureCanvas extends HistoryCanvas {
	private isUsingGesture = false;
	private panStartPoint: Point | null = null;
	private gestureDetectorInstance: { destroy: () => void } | null = null;
	public selection = false;
	private panBoundaries: {
		left: number;
		top: number;
		right: number;
		bottom: number;
	} | null = null;

	constructor(el?: string | HTMLCanvasElement, options = {}) {
		super(el, options);
		this.setupGestures();
		this.selection = false; // Disable Fabric.js native selection (doesn't work???)

		// Set existing objects to non-selectable because this.selection = false doesn't work
		for (const obj of this.getObjects()) {
			obj.selectable = false;
		}
		// Ensure newly added objects are also non-selectable
		this.on("object:added", (e) => {
			if (e.target) {
				e.target.selectable = false;
			}
		});
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
				// Disable drawing mode during gestures
				if (this.isDrawingMode) {
					this.isDrawingMode = false;
					this.cancelCurrentDrawing();
				}

				this.isUsingGesture = true;
			},
			onZoom: (scale: number, previousScale: number, center: Point) => {
				this.handleZoom(scale, center.x, center.y, previousScale);
				this.requestRenderAll();
				// }
			},
			// Dragging over the canvas
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
					// Restore drawing mode if it was previously enabled
					setTimeout(() => {
						this.isDrawingMode = true;
					}, 150);
				}
			},
		});
	}

	/**
	 * Helper to clean up drawing artifacts when canceling a drawing
	 */
	private cancelCurrentDrawing(): void {
		// Use setTimeout to prevent race conditions with fabric's event handling
		setTimeout(() => {
			// Clear the top canvas where drawing happens
			this.clearContext(this.contextTop);
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
	}

	/**
	 * Handles pan operations on the canvas
	 * @param delta Delta coordinates to pan
	 */
	private handlePan(delta: Point): void {
		this.relativePan(delta);

		// Apply boundaries if set
		if (this.panBoundaries) {
			this.enforcePanBoundaries();
		}
	}

	/**
	 * Sets boundaries for canvas panning to keep the specified area in view
	 * @param left Left boundary coordinate
	 * @param top Top boundary coordinate
	 * @param width Width of the bounded area
	 * @param height Height of the bounded area
	 */
	public setPanBoundaries(
		left: number,
		top: number,
		width: number,
		height: number,
	): void {
		this.panBoundaries = {
			left: left,
			top: top,
			right: left + width,
			bottom: top + height,
		};
	}

	/**
	 * Enforces the pan boundaries to keep the bounded area visible
	 */
	private enforcePanBoundaries(): void {
		if (!this.panBoundaries) return;

		const zoom = this.getZoom();
		const vpt = this.viewportTransform;
		if (!vpt) return;

		// Calculate current viewport edges
		const currentLeft = -vpt[4] / zoom;
		const currentTop = -vpt[5] / zoom;
		const currentRight = currentLeft + (this.width || 0) / zoom;
		const currentBottom = currentTop + (this.height || 0) / zoom;

		// Calculate adjustments needed
		let adjustX = 0;
		let adjustY = 0;

		// Adjust horizontally if needed
		if (currentLeft > this.panBoundaries.left) {
			adjustX = this.panBoundaries.left - currentLeft;
		} else if (currentRight < this.panBoundaries.right) {
			adjustX = this.panBoundaries.right - currentRight;
		}

		// Adjust vertically if needed
		if (currentTop > this.panBoundaries.top) {
			adjustY = this.panBoundaries.top - currentTop;
		} else if (currentBottom < this.panBoundaries.bottom) {
			adjustY = this.panBoundaries.bottom - currentBottom;
		}

		// Apply adjustments if needed
		if (adjustX !== 0 || adjustY !== 0) {
			vpt[4] -= adjustX * zoom;
			vpt[5] -= adjustY * zoom;
			this.requestRenderAll();
		}
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
