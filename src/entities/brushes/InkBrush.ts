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
		// this.dot(ctx, point);
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
	 * Render the full state of the brush
	 * @private
	 */
	_render() {
		// Render the current path using perfect-freehand based on existing points
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
