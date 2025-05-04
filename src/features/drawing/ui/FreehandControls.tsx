import { Slider } from '@/shared/ui/slider';

interface FreehandControlsProps {
  lineWidth: number;
  opacity: number;
  thinning: number;
  smoothing: number;
  streamline: number;
  onLineWidthChange: (width: number) => void;
  onOpacityChange: (opacity: number) => void;
  onThinningChange: (thinning: number) => void;
  onSmoothingChange: (smoothing: number) => void;
  onStreamlineChange: (streamline: number) => void;
}

export function FreehandControls({
  lineWidth,
  opacity,
  thinning = 0.618,
  smoothing = 0.5,
  streamline = 0.5,
  onLineWidthChange,
  onOpacityChange,
  onThinningChange,
  onSmoothingChange,
  onStreamlineChange,
}: FreehandControlsProps) {
  return (
    <div className="space-y-4 bg-white p-4 rounded-lg shadow-sm">
      <div className="space-y-2">
        <div className="flex justify-between">
          <div id="line-width">Line Width</div>
          <span className="text-sm text-muted-foreground">{lineWidth.toFixed(1)}</span>
        </div>
        <Slider
          id="line-width"
          min={1}
          max={20}
          step={0.5}
          value={[lineWidth]}
          onValueChange={(value: number[]) => onLineWidthChange(value[0])}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <div id="opacity">Opacity</div>
          <span className="text-sm text-muted-foreground">{opacity.toFixed(2)}</span>
        </div>
        <Slider
          id="opacity"
          min={0.1}
          max={1}
          step={0.05}
          value={[opacity]}
          onValueChange={(value: number[]) => onOpacityChange(value[0])}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <div id="thinning">Thinning</div>
          <span className="text-sm text-muted-foreground">{thinning.toFixed(2)}</span>
        </div>
        <Slider
          id="thinning"
          min={0}
          max={1}
          step={0.05}
          value={[thinning]}
          onValueChange={(value: number[]) => onThinningChange(value[0])}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <div id="smoothing">Smoothing</div>
          <span className="text-sm text-muted-foreground">{smoothing.toFixed(2)}</span>
        </div>
        <Slider
          id="smoothing"
          min={0}
          max={1}
          step={0.05}
          value={[smoothing]}
          onValueChange={(value: number[]) => onSmoothingChange(value[0])}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <div id="streamline">Streamline</div>
          <span className="text-sm text-muted-foreground">{streamline.toFixed(2)}</span>
        </div>
        <Slider
          id="streamline"
          min={0}
          max={1}
          step={0.05}
          value={[streamline]}
          onValueChange={(value: number[]) => onStreamlineChange(value[0])}
          className="w-full"
        />
      </div>
    </div>
  );
}
