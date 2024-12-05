// src/components/StructureAnalysis/MeasurementTools.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Point3D, Measurement } from '../../types/measurements';
import './MeasurementTools.css';

interface MeasurementToolsProps {
  stage: any;
  onMeasurement?: (measurement: Measurement) => void;
}

export const MeasurementTools: React.FC<MeasurementToolsProps> = ({
  stage,
  onMeasurement
}) => {
  const [measurementState, setMeasurementState] = useState({
    active: false,
    type: 'distance' as const,
    points: [] as Point3D[],
    measurements: [] as Measurement[]
  });

  const calculateDistance = useCallback((p1: Point3D, p2: Point3D): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }, []);

  const calculateAngle = useCallback((p1: Point3D, p2: Point3D, p3: Point3D): number => {
    const v1 = {
      x: p1.x - p2.x,
      y: p1.y - p2.y,
      z: p1.z - p2.z
    };
    const v2 = {
      x: p3.x - p2.x,
      y: p3.y - p2.y,
      z: p3.z - p2.z
    };

    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
    
    return Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
  }, []);

  const calculateSurfaceArea = useCallback((points: Point3D[]): number => {
    if (points.length !== 3) return 0;
    
    const a = calculateDistance(points[0], points[1]);
    const b = calculateDistance(points[1], points[2]);
    const c = calculateDistance(points[2], points[0]);
    
    const s = (a + b + c) / 2;
    return Math.sqrt(s * (s - a) * (s - b) * (s - c));
  }, [calculateDistance]);

  const handleAtomPick = useCallback((pickingProxy: any) => {
    if (!measurementState.active || !pickingProxy?.position) return;

    const point: Point3D = {
      x: pickingProxy.position.x,
      y: pickingProxy.position.y,
      z: pickingProxy.position.z
    };

    setMeasurementState(prev => {
      const newPoints = [...prev.points, point];
      
      if ((prev.type === 'distance' && newPoints.length === 2) ||
          (prev.type === 'angle' && newPoints.length === 3) ||
          (prev.type === 'surface' && newPoints.length === 3)) {

        let value = 0;
        switch (prev.type) {
          case 'distance':
            value = calculateDistance(newPoints[0], newPoints[1]);
            break;
          case 'angle':
            value = calculateAngle(newPoints[0], newPoints[1], newPoints[2]);
            break;
          case 'surface':
            value = calculateSurfaceArea(newPoints);
            break;
        }

        const measurement: Measurement = {
          id: `${prev.type}-${Date.now()}`,
          type: prev.type,
          points: newPoints,
          value,
          label: `${value.toFixed(2)}${prev.type === 'angle' ? '°' : prev.type === 'surface' ? ' Å²' : ' Å'}`
        };

        onMeasurement?.(measurement);

        return {
          ...prev,
          points: [],
          measurements: [...prev.measurements, measurement]
        };
      }

      return { ...prev, points: newPoints };
    });
  }, [measurementState.active, calculateDistance, calculateAngle, calculateSurfaceArea, onMeasurement]);

  useEffect(() => {
    if (!stage) return;

    const handlePick = (pickingProxy: any) => {
      if (measurementState.active) {
        handleAtomPick(pickingProxy);
      }
    };

    stage.signals.clicked.add(handlePick);
    return () => {
      stage.signals.clicked.remove(handlePick);
    };
  }, [stage, measurementState.active, handleAtomPick]);

  return (
    <div className="measurement-tools">
      <div className="measurement-controls">
        <select
          value={measurementState.type}
          onChange={(e) => setMeasurementState(prev => ({
            ...prev,
            type: e.target.value as 'distance' | 'angle' | 'surface',
            points: []
          }))}
          className="measurement-select"
        >
          <option value="distance">Distance</option>
          <option value="angle">Angle</option>
          <option value="surface">Surface Area</option>
        </select>

        <button
          onClick={() => setMeasurementState(prev => ({
            ...prev,
            active: !prev.active,
            points: []
          }))}
          className={`measurement-toggle ${measurementState.active ? 'active' : ''}`}
        >
          {measurementState.active ? 'Stop Measuring' : 'Start Measuring'}
        </button>

        {measurementState.active && (
          <div className="measurement-status">
            {measurementState.type === 'distance' && (
              `Select two points (${measurementState.points.length}/2)`
            )}
            {measurementState.type === 'angle' && (
              `Select three points (${measurementState.points.length}/3)`
            )}
            {measurementState.type === 'surface' && (
              `Select three points (${measurementState.points.length}/3)`
            )}
          </div>
        )}
      </div>

      <div className="measurements-list">
        {measurementState.measurements.map((m, index) => (
          <div key={index} className="measurement-item">
            <span>{m.type}: {m.label}</span>
            <button
              onClick={() => setMeasurementState(prev => ({
                ...prev,
                measurements: prev.measurements.filter((_, i) => i !== index)
              }))}
              className="delete-measurement"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};