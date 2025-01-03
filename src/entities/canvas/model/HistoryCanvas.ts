import { Canvas } from 'fabric';

declare module 'fabric' {
  interface CanvasEvents {
    'history:appended': void;
    'history:undoPopped': void;
    'history:modified': { canUndo: boolean; canRedo: boolean };
    'history:loaded': void;
  }
}

export class HistoryCanvas extends Canvas {
  private historyUndo: string[] = [];
  private historyRedo: string[] = [];
  private isHistoryProcessing: boolean = false;
  private maxHistoryStates = 20;

  constructor(el?: string | HTMLCanvasElement, options = {}) {
    super(el, options);
    this.setupHistoryHandling();
  }

  private setupHistoryHandling() {
    // Save initial state
    this.initState();

    // Setup event listeners for history tracking
    this.on('object:added', () => this.saveState());
    this.on('object:modified', () => this.saveState());
    this.on('object:removed', () => this.saveState());
    // this.on('history:appended', () => (this.historyRedo = []));
    // this.on('history:undoPopped', () => (this.historyRedo = []));
  }

  private initState() {
    const jsonString = JSON.stringify(this.toJSON());

    // Clear redo stack when a new action is performed
    this.historyRedo = [];

    // Add current state to undo stack
    this.historyUndo.push(jsonString);

    // Remove oldest state if exceeding max states
    if (this.historyUndo.length > this.maxHistoryStates) {
      this.historyUndo.shift();
    }

    this.fire('history:modified', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });
  }

  private saveState() {
    const jsonString = JSON.stringify(this.toJSON());
    this.historyUndo.push(jsonString);

    this.fire('history:modified', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });
    this.fire('history:appended');
  }

  public async undo() {
    if (this.canUndo()) {
      // Save current state to redo stack
      // const currentState = JSON.stringify(this.toJSON());
      const lastState = this.historyUndo.pop()!;
      this.historyRedo.push(lastState);

      // Remove and get the last state from undo stack
      const previousState = this.historyUndo.pop()!;

      await this.loadFromJSON(JSON.parse(previousState));
      this.renderAll();

      this.fire('history:modified', {
        canUndo: this.canUndo(),
        canRedo: this.canRedo(),
      });
    }
  }

  public async redo() {
    if (this.canRedo()) {
      // Save current state to undo stack
      const currentState = JSON.stringify(this.toJSON());
      this.historyUndo.push(currentState);

      // Remove and get the last state from redo stack
      const nextState = this.historyRedo.pop()!;

      await this.loadFromJSON(JSON.parse(nextState));
      this.renderAll();
      this.fire('history:modified', {
        canUndo: this.canUndo(),
        canRedo: this.canRedo(),
      });
    }
  }

  public canUndo(): boolean {
    return this.historyUndo.length > 1; // Keep at least initial state
  }

  public canRedo(): boolean {
    return this.historyRedo.length > 0;
  }

  // Override clear to also clear history
  public clear() {
    super.clear();
    this.historyUndo = [];
    // this.historyRedo = [];
    this.saveState();
  }
}
