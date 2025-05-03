import { Path, type Canvas } from "fabric";
import type { StrokeOptions } from "perfect-freehand";
import getStroke from "perfect-freehand";
import { getSvgPathFromStroke } from "../utils/svg-path-utils";
import { Base, type PointType } from "./Base";

export class Draw extends Base {
	private _config_Draw: StrokeOptions = {
		size: 4.25,
		thinning: 0.618,
		// Remove smoothing as requested
		// smoothing: 0.5,
		streamline: 0.5,
	};

	constructor(svgPath: PointType[], canvas: Canvas) {
		super(svgPath, canvas);
		// Apply custom styles for drawing
		this.config = {
			...this.config,
			fill: "black",
			stroke: "",
			strokeWidth: 0,
		};
	}

	// Generate SVG path from perfect-freehand points
	svgPath2String(points: PointType[]) {
		const stroke = getStroke(points, this._config_Draw);
		const path = getSvgPathFromStroke(stroke);
		return path;
	}

	getFabricObject() {
		return new Path(this.svgPathString, this.config);
	}

	update(location: PointType[]) {
		console.log("update");
		const path = this.svgPath2String(location);

		if (this.fabricObject) {
			if (this.fabricObject instanceof Path) {
				this.fabricObject.set({ path });
			}
		}

		this.canvas.renderAll();
	}
}
