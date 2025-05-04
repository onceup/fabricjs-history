import { BaseBrush, type Canvas, type Point, Path } from "fabric";
import getStroke from "perfect-freehand";
import { getSvgPathFromStroke } from "../utils/svg-path-utils";

// Default perfect-freehand options
const defaultOptions = {
	size: 4.25,
	thinning: 0.618,
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

export interface PointData {
	x: number;
	y: number;
	pressure?: number;
}

export class PerfectFreehandBrush extends BaseBrush {
	width = 4.25;
	opacity = 1;
	thinning = 0.618;
	streamline = 0.5;

	declare points: Point[];
	pointsData: PointData[] = [];

	constructor(canvas: Canvas) {
		super(canvas);
		this.points = [];
	}

	_getOptions() {
		return {
			...defaultOptions,
			size: this.width,
			thinning: this.thinning,
			streamline: this.streamline,
		};
	}

	/**
	 * Render the current path using perfect-freehand
	 */
	_render() {
		const ctx = this.canvas.contextTop;

		// Don't render if there are no points
		if (!this.pointsData.length) {
			return;
		}

		const stroke = getStroke(this.pointsData, this._getOptions());
		const pathData = getSvgPathFromStroke(stroke);

		// Clear and redraw
		this.canvas.clearContext(this.canvas.contextTop);

		// Set styles
		ctx.globalAlpha = this.opacity;
		ctx.fillStyle = this.color || "black";

		// Draw the path
		this._saveAndTransform(ctx);
		const myPath = new Path2D(pathData);
		ctx.fill(myPath);
		ctx.restore();
	}

	/**
	 * Invoked on mouse down
	 */
	onMouseDown(pointer: Point) {
		this.points = [];
		this.pointsData = [];
		this.canvas.clearContext(this.canvas.contextTop);
		this._setShadow();
		this.addPoint(pointer);
		this._render();
	}

	/**
	 * Invoked on mouse move
	 */
	onMouseMove(pointer: Point) {
		if (this.limitedToCanvasSize === true && this._isOutSideCanvas(pointer)) {
			return;
		}

		this.addPoint(pointer);
		this._render();
	}

	/**
	 * Invoked on mouse up
	 */
	onMouseUp() {
		// Create a permanent path object from the drawing
		const stroke = getStroke(this.pointsData, this._getOptions());
		const pathData = getSvgPathFromStroke(stroke);

		const path = new Path(pathData, {
			fill: this.color,
			stroke: undefined,
			strokeWidth: 0,
			opacity: this.opacity,
		});

		// Clean up
		this.canvas.clearContext(this.canvas.contextTop);
		this._resetShadow();

		// Add the path to the canvas
		this.canvas.fire("before:path:created", { path });
		this.canvas.add(path);
		this.canvas.fire("path:created", { path });

		// Reset points
		this.points = [];
		this.pointsData = [];

		this.canvas.requestRenderAll();
	}

	/**
	 * Add a point to the current drawing
	 */
	addPoint(point: Point) {
		// Add to fabric points array
		this.points.push(point);

		// Add to perfect-freehand compatible format with a default pressure
		// Fabric's Point type doesn't include pressure, so we use a default value
		this.pointsData.push({
			x: point.x,
			y: point.y,
			pressure: 0.5, // Use a default pressure value
		});

		return true;
	}
}
