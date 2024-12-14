// Custom types for the protein viewer
export interface Point3D {
  x: number;
  y: number;
  z: number;
  [key: number]: number;
}

export interface MeasurementState {
  active: boolean;
  type: 'distance' | 'angle' | 'dihedral';
  points: Point3D[];
}

export interface ViewerControls {
  rotate: boolean;
  autoRotateSpeed: number;
  zoomLevel: number;
  highlightedResidues: Set<number>;
} 