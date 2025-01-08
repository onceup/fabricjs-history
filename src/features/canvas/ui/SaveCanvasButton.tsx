import { Button } from '@/shared/ui/button';
import { saveCanvasAsBlob } from '@/features/canvas/model/saveCanvas';

interface SaveCanvasButtonProps {
  canvas: HTMLCanvasElement | null;
}

export function SaveCanvasButton({ canvas }: SaveCanvasButtonProps) {
  return (
    <div className='flex gap-2 mt-2'>
      <Button
        variant='outline'
        size='sm'
        disabled={!canvas}
        onClick={() => canvas && saveCanvasAsBlob(canvas)}
      >
        Save
      </Button>
    </div>
  );
}
