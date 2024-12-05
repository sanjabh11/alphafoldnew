// src/types/ngl.d.ts
declare module 'ngl' {
    export class Stage {
      constructor(element: HTMLElement, params?: any);
      loadFile(url: string, params?: any): Promise<any>;
      handleResize(): void;
      dispose(): void;
    }
  }