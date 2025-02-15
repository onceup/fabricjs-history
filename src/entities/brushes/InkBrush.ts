import { log } from 'console';
import {
  BaseBrush,
  Canvas,
  Circle,
  CircleBrushPoint,
  Color,
  Group,
  Point,
  Shadow,
} from 'fabric';
import getStroke from 'perfect-freehand';

export function getSvgPathFromStroke(stroke: number[][]) {
  if (!stroke.length) return '';

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  );

  d.push('Z');
  return d.join(' ');
}

const options = {
  size: 12,
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

/**
 * Returns random number between 2 specified ones.
 * @param {Number} min lower limit
 * @param {Number} max upper limit
 * @return {Number} random value (between min and max)
 */
export const getRandomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export class InkBrush extends BaseBrush {
  /**
   * Width of a brush
   * @type Number
   * @default
   */
  width = 10;

  declare points: CircleBrushPoint[];

  constructor(canvas: Canvas) {
    super(canvas);
    this.points = [];
  }

  /**
   * Invoked inside on mouse down and mouse move
   * @param {Point} pointer
   */
  drawDot(pointer: Point) {
    const point = this.addPoint(pointer),
      ctx = this.canvas.contextTop,
      points = this.points;

    const stroke = getStroke(points, options);
    const pathData = getSvgPathFromStroke(stroke);
    const myPath = new Path2D(pathData);
    // this._saveAndTransform(ctx);
    // this.dot(ctx, point);
    // ctx.restore();

    ctx?.fill(myPath);
  }

  dot(ctx: CanvasRenderingContext2D, point: CircleBrushPoint) {
    ctx.fillStyle = point.fill;
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();
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
    const ctx = this.canvas.contextTop,
      points = this.points;
    this._saveAndTransform(ctx);
    for (let i = 0; i < points.length; i++) {
      this.dot(ctx, points[i]);
    }
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

    const circles: Circle[] = [];

    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i],
        circle = new Circle({
          radius: point.radius,
          left: point.x,
          top: point.y,
          originX: 'center',
          originY: 'center',
          fill: point.fill,
        });

      this.shadow && (circle.shadow = new Shadow(this.shadow));

      circles.push(circle);
    }
    const group = new Group(circles, { canvas: this.canvas });

    this.canvas.fire('before:path:created', { path: group });
    this.canvas.add(group);
    this.canvas.fire('path:created', { path: group });

    this.canvas.clearContext(this.canvas.contextTop);
    this._resetShadow();
    this.canvas.renderOnAddRemove = originalRenderOnAddRemove;
    this.canvas.requestRenderAll();
  }

  /**
   * @param {Object} pointer
   * @return {Point} Just added pointer point
   */
  addPoint({ x, y }: Point) {
    const pointerPoint: CircleBrushPoint = {
      x,
      y,
      radius: getRandomInt(Math.max(0, this.width - 20), this.width + 20) / 2,
      fill: new Color(this.color).setAlpha(getRandomInt(0, 100) / 100).toRgba(),
    };

    this.points.push(pointerPoint);

    return pointerPoint;
  }
}
