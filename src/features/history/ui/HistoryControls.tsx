import { Button } from '@/shared/ui/button';

interface HistoryControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function HistoryControls({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: HistoryControlsProps) {
  return (
    <div className='flex gap-2 mb-2'>
      <Button variant='outline' size='sm' onClick={onUndo} disabled={!canUndo}>
        Undo
      </Button>
      <Button variant='outline' size='sm' onClick={onRedo} disabled={!canRedo}>
        Redo
      </Button>
    </div>
  );
}
