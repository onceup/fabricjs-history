// import { useRef, useEffect, useState } from 'react';
// import { GestureCanvas } from '../entities/canvas/model/GestureCanvas';
// import { Circle, Rect, Text } from 'fabric';

// export const GestureDemo = () => {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const gestureCanvasRef = useRef<GestureCanvas | null>(null);
//   const [instructions, setInstructions] = useState('Loading...');

//   useEffect(() => {
//     if (!canvasRef.current) return;

//     // Initialize the GestureCanvas
//     const canvas = new GestureCanvas(canvasRef.current, {
//       isDrawingMode: false,
//       selection: true,
//       backgroundColor: '#f0f0f0'
//     });

//     // Save the canvas reference
//     gestureCanvasRef.current = canvas;

//     // Add some demo objects
//     const rect = new Rect({
//       left: 100,
//       top: 100,
//       width: 100,
//       height: 100,
//       fill: 'blue',
//       angle: 0,
//       cornerColor: 'white',
//       cornerStrokeColor: 'blue',
//       transparentCorners: false
//     });

//     const circle = new Circle({
//       left: 300,
//       top: 150,
//       radius: 50,
//       fill: 'green',
//       cornerColor: 'white',
//       cornerStrokeColor: 'green',
//       transparentCorners: false
//     });

//     const text = new Text('Pinch to zoom\nRotate with two fingers\nPan with two fingers\nMiddle-click to pan on desktop', {
//       left: 150,
//       top: 250,
//       fontSize: 16,
//       fill: 'black',
//       fontFamily: 'Arial',
//       textAlign: 'center'
//     });

//     // Add objects to canvas
//     canvas.add(rect, circle, text);
//     canvas.setZoom(1);
//     canvas.renderAll();

//     // Instructions based on device type
//     const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
//     setInstructions(isMobile
//       ? '• Use two fingers to zoom\n• Rotate shapes with two fingers\n• Pan with two fingers'
//       : '• Use mouse wheel to zoom\n• Middle-click and drag to pan\n• Select and manipulate objects');

//     // Cleanup on unmount
//     return () => {
//       canvas.dispose();
//     };
//   }, []);

//   // Reset zoom button handler
//   const handleResetZoom = () => {
//     if (gestureCanvasRef.current) {
//       gestureCanvasRef.current.resetZoom();
//     }
//   };

//   return (
//     <div className="flex flex-col items-center">
//       <h2 className="text-2xl font-bold mb-4">Fabric.js Gesture Control Demo</h2>
//       <div className="mb-4 whitespace-pre-wrap text-center">{instructions}</div>
//       <div className="border border-gray-300 rounded-lg overflow-hidden mb-4">
//         <canvas ref={canvasRef} width="600" height="400" />
//       </div>
//       <button
//         type="button"
//         className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//         onClick={handleResetZoom}
//       >
//         Reset Zoom & Pan
//       </button>
//     </div>
//   );
// };
