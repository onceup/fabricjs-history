import { Slider } from '@/shared/ui/slider';

interface DrawingControlsProps {
  lineWidth: number;
  opacity: number;
  onLineWidthChange: (width: number) => void;
  onOpacityChange: (opacity: number) => void;
}

export const DrawingControls = ({
  lineWidth,
  opacity,
  onLineWidthChange,
  onOpacityChange,
}: DrawingControlsProps) => {
  return (
    <div className='flex flex-wrap gap-4 mb-2'>
      <div className='flex items-center gap-2 min-w-[300px]'>
        Line Width:
        <Slider
          min={1}
          max={100}
          value={[lineWidth]}
          onValueChange={([value]) => onLineWidthChange(value)}
          className='w-[200px]'
        />
        <span>{lineWidth}px</span>
      </div>

      <div className='flex items-center gap-2 min-w-[300px]'>
        Opacity:
        <Slider
          min={0}
          max={100}
          value={[opacity * 100]}
          onValueChange={([value]) => onOpacityChange(value / 100)}
          className='w-[200px]'
        />
        <span>{Math.round(opacity * 100)}%</span>
      </div>
    </div>
  );
};
