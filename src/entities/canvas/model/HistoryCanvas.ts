import { Canvas, FabricObject, CanvasEvents } from 'fabric';

declare module 'fabric' {
  interface CanvasEvents {
    'history:append': { json: string };
    'history:undo': void;
    'history:redo': void;
    'history:modified': { canUndo: boolean; canRedo: boolean };
    'history:loaded': void;
  }
}

export class HistoryCanvas extends Canvas {
  private historyUndo: string[] = [];
  private historyRedo: string[] = [];
  private isHistoryProcessing: boolean = false;
  private extraProps: string[] = ['selectable', 'editable'];

  constructor(el?: string | HTMLCanvasElement, options = {}) {
    super(el, options);
    this._setupHistoryHandling();

    requestAnimationFrame(() => {
      const initialState = this._historyNext();
      this.historyUndo = [initialState];
      this.historyRedo = [];
    });
  }

  private _historyNext(): string {
    return JSON.stringify(this.toDatalessJSON(this.extraProps));
  }

  private _setupHistoryHandling() {
    this.on('object:added', (e) => this._historySaveAction(e));
    this.on('object:modified', (e) => this._historySaveAction(e));
    this.on('object:removed', (e) => this._historySaveAction(e));
    this.on('object:skewing', (e) => this._historySaveAction(e));
  }

  private _historySaveAction(e?: { target: FabricObject }) {
    if (this.isHistoryProcessing) return;

    if (!e || (e.target && !e.target.excludeFromExport)) {
      const json = this._historyNext();
      this.historyUndo.push(json);
      this.historyRedo = [];

      this.fire('history:append', { json });
      this.fire('history:modified', {
        canUndo: this.canUndo(),
        canRedo: this.canRedo(),
      });
    }
  }

  public async undo() {
    this.isHistoryProcessing = true;
    const history = this.historyUndo.pop();
    if (history) {
      this.historyRedo.push(history);
      await this._loadHistory(
        this.historyUndo[this.historyUndo.length - 1],
        'history:undo'
      );
    } else {
      this.isHistoryProcessing = false;
    }

    this.fire('history:modified', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });
  }

  public async redo() {
    this.isHistoryProcessing = true;
    const history = this.historyRedo.pop();

    if (history) {
      this.historyUndo.push(history);
      await this._loadHistory(history, 'history:redo');
    } else {
      this.isHistoryProcessing = false;
    }

    this.fire('history:modified', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });
  }

  private async _loadHistory(history: string, event: keyof CanvasEvents) {
    await this.loadFromJSON(JSON.parse(history));
    this.renderAll();
    this.fire(event);
    this.isHistoryProcessing = false;
  }

  public canUndo(): boolean {
    return this.historyUndo.length > 1;
  }

  public canRedo(): boolean {
    return this.historyRedo.length > 0;
  }

  public onHistory() {
    this.isHistoryProcessing = false;
    this._historySaveAction();
  }

  public offHistory() {
    this.isHistoryProcessing = true;
  }
}
