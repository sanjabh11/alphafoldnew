declare module 'molstar/lib/mol-plugin-ui' {
  export function createPluginUI(target: HTMLElement, options?: any): Promise<any>;
}

declare module 'molstar/lib/mol-plugin-ui/spec' {
  export function DefaultPluginUISpec(spec?: any): any;
}

declare module 'molstar/lib/mol-plugin-ui/context' {
  export interface PluginUIContext {
    state: any;
    builders: any;
    canvas3d?: any;
    dispose: () => void;
  }
}

declare module 'molstar/lib/mol-plugin/config' {
  export const PluginConfig: {
    Viewport: {
      ShowControls: string;
      ShowSettings: string;
      ShowSelectionMode: string;
      ShowAnimation: string;
    };
  };
}

declare module 'molstar/lib/mol-plugin-ui/skin/light.scss'; 