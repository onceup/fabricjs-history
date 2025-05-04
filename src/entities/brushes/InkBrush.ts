import { BaseBrush, type Canvas, type Point, Shadow, Path } from "fabric";
import getStroke from "perfect-freehand";

export function getSvgPathFromStroke(stroke: number[][]) {
	if (!stroke.length) return "";

	const d = stroke.reduce(
		(acc, [x0, y0], i, arr) => {
			const [x1, y1] = arr[(i + 1) % arr.length];
			acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
			return acc;
		},
		["M", ...stroke[0], "Q"],
	);

	d.push("Z");
	return d.join(" ");
}

const options = {
	size: 1,
	thinning: 0.5,
	smoothing: 0.5,
	streamline: 0.5,
	easing: (t: number) => t,
	start: {
		taper: 0,
		easing: (t: number) => t,
		cap: true,
	},
	end: {
		taper: 100,
		easing: (t: number) => t,
		cap: true,
	},
};

export class DirectInkBrush extends BaseBrush {
	width = 1;
	opacity = 1;
	noScaleCache = true; // Prevent cache regeneration during scaling

	declare points: Point[];
	private lastPoint: Point | null = null;

	constructor(canvas: Canvas) {
		super(canvas);
		this.points = [];

		// Ensure image smoothing is disabled in both contexts
		if (
			canvas.contextContainer &&
			canvas.contextContainer.imageSmoothingEnabled !== false
		) {
			canvas.contextContainer.imageSmoothingEnabled = false;
		}
		if (
			canvas.contextTop &&
			canvas.contextTop.imageSmoothingEnabled !== false
		) {
			canvas.contextTop.imageSmoothingEnabled = false;
		}
	}

	/**
	 * Force using the same rendering approach
	 */
	needsFullRender() {
		return true;
	}

	/**
	 * Required implementation of abstract _render method
	 */
	_render() {
		const ctx = this.canvas.contextTop;
		const points = this.points;

		// Don't render if there are no points
		if (!points || points.length === 0) {
			return;
		}

		// Ensure image smoothing is disabled
		if (ctx.imageSmoothingEnabled !== false) {
			ctx.imageSmoothingEnabled = false;
		}

		// Draw the path
		ctx.globalAlpha = this.opacity;
		this._saveAndTransform(ctx);

		ctx.beginPath();
		ctx.moveTo(points[0].x, points[0].y);

		for (let i = 1; i < points.length; i++) {
			ctx.lineTo(points[i].x, points[i].y);
		}

		ctx.stroke();
		ctx.restore();
	}

	/**
	 * Invoked on mouse down
	 */
	onMouseDown(pointer: Point) {
		this.points = [];
		this.lastPoint = pointer;

		// Set shadow
		this._setShadow();

		// Add point and render
		this.addPoint(pointer);
		this.canvas.clearContext(this.canvas.contextTop);
		this._render();
	}

	/**
	 * Invoked on mouse move
	 * @param {Point} pointer
	 */
	onMouseMove(pointer: Point) {
		if (this.limitedToCanvasSize === true && this._isOutSideCanvas(pointer)) {
			return;
		}

		// Track last point for line drawing
		this.lastPoint = pointer;

		// Add point and render
		this.addPoint(pointer);
		this.canvas.clearContext(this.canvas.contextTop);
		this._render();
	}

	/**
	 * Invoked on mouse up
	 */
	onMouseUp() {
		// Reset state
		this.lastPoint = null;
		this._resetShadow();

		// Get path data from points
		const pathData = this.createPathDataFromPoints();

		// Create a custom class to match our rendering
		class NonSmoothPath extends Path {
			_render(ctx: CanvasRenderingContext2D) {
				// Force disable smoothing before render
				if (ctx.imageSmoothingEnabled !== false) {
					ctx.imageSmoothingEnabled = false;
				}

				// Use consistent rendering approach
				ctx.globalAlpha = this.opacity || 1;

				// Call parent render
				super._render(ctx);
			}
		}

		// Create our custom path
		const path = new NonSmoothPath(pathData, {
			fill: null,
			stroke: this.color,
			strokeWidth: this.width,
			opacity: this.opacity,
			strokeLineCap: this.strokeLineCap,
			strokeMiterLimit: this.strokeMiterLimit,
			strokeLineJoin: this.strokeLineJoin,
			strokeDashArray: this.strokeDashArray,
			// Disable all caching to maintain visual consistency
			objectCaching: false,
			noScaleCache: true,
			perPixelTargetFind: true,
		});

		// Clear the drawing context
		this.canvas.clearContext(this.canvas.contextTop);

		// Ensure image smoothing is disabled on both contexts
		this.canvas.contextContainer.imageSmoothingEnabled = false;
		this.canvas.contextTop.imageSmoothingEnabled = false;
		this.canvas.imageSmoothingEnabled = false;

		// Add the path to canvas
		this.canvas.fire("before:path:created", { path });
		this.canvas.add(path);
		this.canvas.fire("path:created", { path });

		this.canvas.requestRenderAll();
	}

	/**
	 * Creates a simple SVG path from the recorded points
	 * @private
	 */
	private createPathDataFromPoints(): string {
		if (this.points.length < 2) return "";

		let result = `M ${this.points[0].x} ${this.points[0].y}`;

		for (let i = 1; i < this.points.length; i++) {
			result += ` L ${this.points[i].x} ${this.points[i].y}`;
		}

		return result;
	}

	addPoint(point: Point) {
		if (
			this.points.length > 1 &&
			point.eq(this.points[this.points.length - 1])
		) {
			return false;
		}
		this.points.push(point);
		return true;
	}
}

// Original InkBrush implementation
export class InkBrush extends BaseBrush {
	width = 1;
	opacity = 1;
	noScaleCache = true; // Prevent cache regeneration during scaling

	declare points: Point[];

	constructor(canvas: Canvas) {
		super(canvas);
		this.points = [];

		// Ensure image smoothing is disabled in the canvas contexts
		if (
			canvas.contextContainer &&
			canvas.contextContainer.imageSmoothingEnabled !== false
		) {
			canvas.contextContainer.imageSmoothingEnabled = false;
		}
		if (
			canvas.contextTop &&
			canvas.contextTop.imageSmoothingEnabled !== false
		) {
			canvas.contextTop.imageSmoothingEnabled = false;
		}
	}

	_getOptions() {
		return { ...options, size: this.width, opacity: this.opacity };
	}

	/**
	 * Force the brush to always use the _render method instead of drawDot for consistency
	 */
	needsFullRender() {
		// Always return true to ensure the same rendering path is used
		return true;
	}

	/**
	 * Invoked inside on mouse down and mouse move
	 * @param {Point} pointer
	 */
	drawDot(pointer: Point) {
		// Add the point to the path
		this.addPoint(pointer);

		// Instead of drawing a dot, use the full render method for consistency
		this.canvas.clearContext(this.canvas.contextTop);
		this._render();
	}

	/**
	 * Render the current path using perfect-freehand based on existing points, used with opacity
	 * @private
	 */
	_render() {
		const ctx = this.canvas.contextTop;
		const points = this.points;

		// Don't render if there are no points
		if (!points || points.length === 0) {
			return;
		}

		// Make sure imageSmoothingEnabled is disabled
		if (ctx.imageSmoothingEnabled !== false) {
			ctx.imageSmoothingEnabled = false;
		}

		const stroke = getStroke(points, this._getOptions());
		const pathData = getSvgPathFromStroke(stroke);
		const myPath = new Path2D(pathData);

		// Use the same fill approach for both drawing methods
		ctx.globalAlpha = this.opacity;
		this._saveAndTransform(ctx);
		ctx?.fill(myPath);
		ctx.restore();
	}

	/**
	 * Invoked on mouse down
	 */
	onMouseDown(pointer: Point) {
		this.points = [];
		this.canvas.clearContext(this.canvas.contextTop);
		this._setShadow();
		this.drawDot(pointer);
	}

	/**
	 * Invoked on mouse move
	 * @param {Point} pointer
	 */
	onMouseMove(pointer: Point) {
		if (this.limitedToCanvasSize === true && this._isOutSideCanvas(pointer)) {
			return;
		}

		// Always add the point and render the full path
		this.addPoint(pointer);
		this.canvas.clearContext(this.canvas.contextTop);
		this._render();
	}

	/**
	 * Invoked on mouse up
	 */
	onMouseUp() {
		const originalRenderOnAddRemove = this.canvas.renderOnAddRemove;
		this.canvas.renderOnAddRemove = false;

		// Create the stroke path using perfect-freehand with the same options used during drawing
		const stroke = getStroke(this.points, this._getOptions());
		const pathData = getSvgPathFromStroke(stroke);

		// Create a custom path class that will use the exact same rendering as our _render method
		class NonSmoothPath extends Path {
			_render(ctx: CanvasRenderingContext2D) {
				// Force disable smoothing before render
				if (ctx.imageSmoothingEnabled !== false) {
					ctx.imageSmoothingEnabled = false;
				}

				// Use the same rendering approach as the brush's _render method
				ctx.globalAlpha = this.opacity || 1;

				// Call the parent's render method to maintain consistency
				super._render(ctx);
			}
		}

		// Create our custom path using the same options
		const path = new NonSmoothPath(pathData, {
			// Use fill instead of stroke to match the brush rendering during drawing
			fill: this.color,
			stroke: null,
			strokeWidth: 0,
			// opacity: this.opacity,
			strokeLineCap: this.strokeLineCap,
			strokeMiterLimit: this.strokeMiterLimit,
			strokeLineJoin: this.strokeLineJoin,
			strokeDashArray: this.strokeDashArray,
			// Disable all caching to maintain visual consistency
			objectCaching: false,
			noScaleCache: true,
			perPixelTargetFind: true,
		});

		// Apply shadow if it exists
		if (this.shadow) {
			path.shadow = new Shadow(this.shadow);
		}

		// Mark the path as dirty to force a re-render
		path.dirty = true;

		// Clear the drawing context
		this.canvas.clearContext(this.canvas.contextTop);

		// Ensure image smoothing is disabled on both contexts
		// this.canvas.contextContainer.imageSmoothingEnabled = false;
		// this.canvas.contextTop.imageSmoothingEnabled = false;
		// this.canvas.imageSmoothingEnabled = false;

		// Fire events and add the path to canvas
		this.canvas.fire("before:path:created", { path });
		this.canvas.add(path);
		this.canvas.fire("path:created", { path });

		// Reset and cleanup
		this._resetShadow();
		this.canvas.renderOnAddRemove = originalRenderOnAddRemove;
		this.canvas.requestRenderAll();
	}

	addPoint(point: Point) {
		if (
			this.points.length > 1 &&
			point.eq(this.points[this.points.length - 1])
		) {
			return false;
		}
		this.points.push(point);
		return true;
	}
}
