// declare module 'fabric' {
//   interface CanvasEvents {
//     'custom:event': Partial<TEvent> & {
//       target: FabricObject;
//       anydata: string;
//     };
//   }
// }

// declare module 'fabric' {
//   namespace fabric {
//     export interface CustomEvent {
//       'custom:event': Partial<TEvent> & {
//         target: FabricObject;
//         anydata: string;
//       };
//     }
//   }
// }

// declare module 'fabric' {
//   interface CanvasEvents extends CanvasEvents {
//     'custom:event': Partial<TEvent> & {
//       target: FabricObject;
//       anydata: string;
//     };
//   }
// }
