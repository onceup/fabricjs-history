import { create } from "zustand";
import type { Base, PointType } from "@/entities/modules/Base";

interface DrawingState {
	isDrawing: boolean;
	isCanvasDragging: boolean;
	isTexting: boolean;
	mode: "FreeDraw" | "Arrow" | "Rect" | "Ellipse" | "Line" | "Text";
	mouseFrom: PointType;
	mouseTo: PointType;
	freeDrawPoints: PointType[];
	temp: Base | null;
	setIsDrawing: (isDrawing: boolean) => void;
	setMode: (mode: DrawingState["mode"]) => void;
	setMouseFrom: (point: PointType) => void;
	setMouseTo: (point: PointType) => void;
	setFreeDrawPoints: (point: PointType) => void;
	clearFreeDrawPoints: () => void;
	setTemp: (temp: Base | null) => void;
	setIsCanvasDragging: (isDragging: boolean) => void;
	setIsTexting: (isTexting: boolean) => void;
}

export const useDrawingStore = create<DrawingState>((set) => ({
	isDrawing: false,
	isCanvasDragging: false,
	isTexting: false,
	mode: "FreeDraw",
	mouseFrom: { x: 0, y: 0 },
	mouseTo: { x: 0, y: 0 },
	freeDrawPoints: [],
	temp: null,

	setIsDrawing: (isDrawing) => set({ isDrawing }),
	setMode: (mode) => set({ mode }),
	setMouseFrom: (point) => set({ mouseFrom: point }),
	setMouseTo: (point) => set({ mouseTo: point }),
	setFreeDrawPoints: (point) =>
		set((state: DrawingState) => ({
			freeDrawPoints: [...state.freeDrawPoints, point],
		})),
	clearFreeDrawPoints: () => set({ freeDrawPoints: [] }),
	setTemp: (temp) => set({ temp }),
	setIsCanvasDragging: (isCanvasDragging) => set({ isCanvasDragging }),
	setIsTexting: (isTexting) => set({ isTexting }),
}));
