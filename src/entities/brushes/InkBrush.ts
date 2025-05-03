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

	declare points: Point[];
	private lastPoint: Point | null = null;

	constructor(canvas: Canvas) {
		super(canvas);
		this.points = [];
	}

	/**
	 * Required implementation of abstract _render method
	 */
	_render() {
		// Not needed for direct drawing on lower canvas
		// since we're drawing immediately in onMouseMove
	}

	/**
	 * Invoked on mouse down
	 */
	onMouseDown(pointer: Point) {
		this.points = [];
		this.lastPoint = pointer;

		// Start drawing directly on lower canvas
		const ctx = this.canvas.contextContainer;
		this._setShadow();

		ctx.save();
		ctx.globalAlpha = this.opacity;
		ctx.lineWidth = this.width;
		ctx.strokeStyle = this.color;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";

		ctx.beginPath();
		ctx.moveTo(pointer.x, pointer.y);

		this.addPoint(pointer);
		this.canvas.requestRenderAll();
	}

	/**
	 * Invoked on mouse move
	 * @param {Point} pointer
	 */
	onMouseMove(pointer: Point) {
		if (this.limitedToCanvasSize === true && this._isOutSideCanvas(pointer)) {
			return;
		}

		if (!this.lastPoint) return;

		// Draw directly on lower canvas
		const ctx = this.canvas.contextContainer;

		ctx.beginPath();
		ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
		ctx.lineTo(pointer.x, pointer.y);
		ctx.stroke();

		this.lastPoint = pointer;
		this.addPoint(pointer);

		// We need to render all since we're modifying the actual canvas
		this.canvas.requestRenderAll();
	}

	/**
	 * Invoked on mouse up
	 */
	onMouseUp() {
		// We're drawing directly on the lower canvas, so there's no need
		// to create a new path object - the drawing is already permanent

		// Reset state
		this.lastPoint = null;
		this._resetShadow();

		// Create a path for undo/redo history if needed
		const pathData = this.createPathDataFromPoints();
		const path = new Path(pathData, {
			fill: null,
			stroke: this.color,
			strokeWidth: this.width,
			opacity: this.opacity,
			strokeLineCap: this.strokeLineCap,
			strokeMiterLimit: this.strokeMiterLimit,
			strokeLineJoin: this.strokeLineJoin,
			strokeDashArray: this.strokeDashArray,
		});

		// Add the path as an object for selection and other interactions
		// (This is optional - remove if you want to keep the drawing as pure pixels)
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

	declare points: Point[];

	constructor(canvas: Canvas) {
		super(canvas);
		this.points = [];
	}

	_getOptions() {
		return { ...options, size: this.width, opacity: this.opacity };
	}

	/**
	 * Invoked inside on mouse down and mouse move
	 * @param {Point} pointer
	 */
	drawDot(pointer: Point) {
		this.addPoint(pointer);
		const ctx = this.canvas.contextTop;
		const points = this.points;

		const stroke = getStroke(points, this._getOptions());
		const pathData = getSvgPathFromStroke(stroke);
		const myPath = new Path2D(pathData);
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

		const stroke = getStroke(points, this._getOptions());
		const pathData = getSvgPathFromStroke(stroke);
		const myPath = new Path2D(pathData);
		ctx.globalAlpha = this.opacity;
		this._saveAndTransform(ctx);
		ctx?.fill(myPath);
		ctx.restore();
	}

	/**
	 * Invoked on mouse move
	 * @param {Point} pointer
	 */
	onMouseMove(pointer: Point) {
		if (this.limitedToCanvasSize === true && this._isOutSideCanvas(pointer)) {
			return;
		}
		if (this.needsFullRender()) {
			this.canvas.clearContext(this.canvas.contextTop);
			this.addPoint(pointer);
			this._render();
		} else {
			this.drawDot(pointer);
		}
	}

	/**
	 * Invoked on mouse up
	 */
	onMouseUp() {
		const originalRenderOnAddRemove = this.canvas.renderOnAddRemove;
		this.canvas.renderOnAddRemove = false;

		// Create the stroke path using perfect-freehand
		const stroke = getStroke(this.points, this._getOptions());
		const pathData = getSvgPathFromStroke(stroke);

		// Create a fabric.Path object from the SVG path data
		const path = new Path(pathData, {
			fill: this.color,
			stroke: null,
			strokeWidth: 0,
			strokeLineCap: this.strokeLineCap,
			strokeMiterLimit: this.strokeMiterLimit,
			strokeLineJoin: this.strokeLineJoin,
			strokeDashArray: this.strokeDashArray,
		});

		// Apply shadow if it exists
		if (this.shadow) {
			path.shadow = new Shadow(this.shadow);
		}

		// Clear the drawing context
		this.canvas.clearContext(this.canvas.contextTop);

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
