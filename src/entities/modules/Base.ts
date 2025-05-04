import { Object as FObject, Path, type Canvas } from "fabric";

export interface PointType {
	x: number;
	y: number;
}

/**
 * Base class for all drawing objects
 */
export class Base {
	svgPath: PointType[];
	canvas: Canvas;
	fabricObject: FObject | null = null;
	id: number = Date.now();

	private _config = {
		name: String(this.id),
		strokeWidth: 1,
		strokeUniform: true,
		fill: "rgba(0,0,0,0)",
		hoverCursor: "default",
		hasBorders: true,
		stroke: "red",
		borderColor: "rgb(66, 133, 244)",
		selectable: false,
		hasControls: true,
		flipX: false,
		flipY: false,
		evented: true,
	};

	constructor(svgPath: PointType[], canvas: Canvas) {
		this.svgPath = svgPath;
		this.canvas = canvas;
	}

	set config(newConfig: typeof this._config) {
		Object.assign(this._config, newConfig);
	}

	get config(): typeof this._config {
		return this._config;
	}

	// Generate SVG path
	svgPath2String(svgPath: PointType[]) {
		const [mouseFrom, mouseTo] = svgPath;

		const path = `
     M ${mouseFrom.x} ${mouseFrom.y}
     L ${mouseTo.x} ${mouseTo.y}
     z`;
		return path;
	}

	get svgPathString() {
		return this.svgPath2String(this.svgPath);
	}

	getFabricObject(): FObject {
		// Create a simple path object by default
		return new Path(this.svgPathString, this.config);
	}

	render() {
		this.fabricObject = this.getFabricObject();
		this.canvas.add(this.fabricObject);
	}

	update(location: PointType[]) {
		const [mouseFrom, mouseTo] = location;
		const path = this.svgPath2String([mouseFrom, mouseTo]);

		if (this.fabricObject) {
			// Update the path
			if (this.fabricObject instanceof Path) {
				this.fabricObject.set({ path: path });
			}
		}

		this.canvas.renderAll();
	}

	remove() {
		if (this.fabricObject) {
			this.canvas.remove(this.fabricObject);
		}
	}
}
