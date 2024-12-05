export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Measurement {
  id: string;
  type: 'distance' | 'angle' | 'surface';
  points: Point3D[];
  value: number;
  label: string;
}

export interface MeasurementState {
  active: boolean;
  type: 'distance' | 'angle' | 'surface';
  points: Point3D[];
  measurements: Measurement[];
} 