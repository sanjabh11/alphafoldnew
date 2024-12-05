import { ExpressionData } from '../services/geneExpressionService';

export interface ProcessedData {
  normalizedValues: number[];
  statistics: {
    mean: number;
    median: number;
    stdDev: number;
    foldChange?: number;
    pValue?: number;
  };
  metadata: {
    method: string;
    parameters: Record<string, any>;
  };
}

export class DataProcessingUtils {
  static normalizeQuantile(data: number[]): number[] {
    const sorted = [...data].sort((a, b) => a - b);
    const ranks = data.map(value => sorted.indexOf(value));
    const n = data.length;
    return ranks.map(rank => (rank + 0.5) / n);
  }

  static normalizeRMA(data: number[]): number[] {
    // Robust Multi-array Average normalization
    const log2Data = data.map(value => Math.log2(Math.max(value, 1)));
    const median = this.calculateMedian(log2Data);
    return log2Data.map(value => value - median);
  }

  static normalizeTPM(counts: number[], lengths: number[]): number[] {
    // Transcripts Per Million normalization
    const rpk = counts.map((count, i) => (count * 1000) / lengths[i]);
    const scalingFactor = rpk.reduce((a, b) => a + b, 0) / 1e6;
    return rpk.map(value => value / scalingFactor);
  }

  static performDifferentialExpression(
    control: number[],
    treatment: number[]
  ): { foldChange: number; pValue: number } {
    // Calculate log2 fold change
    const controlMean = control.reduce((a, b) => a + b, 0) / control.length;
    const treatmentMean = treatment.reduce((a, b) => a + b, 0) / treatment.length;
    const foldChange = Math.log2(treatmentMean / controlMean);

    // Perform t-test
    const pValue = this.tTest(control, treatment);

    return { foldChange, pValue };
  }

  private static tTest(array1: number[], array2: number[]): number {
    const n1 = array1.length;
    const n2 = array2.length;
    const mean1 = array1.reduce((a, b) => a + b, 0) / n1;
    const mean2 = array2.reduce((a, b) => a + b, 0) / n2;
    
    const variance1 = array1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0) / (n1 - 1);
    const variance2 = array2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0) / (n2 - 1);
    
    const pooledVariance = ((n1 - 1) * variance1 + (n2 - 1) * variance2) / (n1 + n2 - 2);
    const standardError = Math.sqrt(pooledVariance * (1/n1 + 1/n2));
    
    const t = Math.abs((mean1 - mean2) / standardError);
    // Simplified p-value calculation using normal approximation
    const pValue = 2 * (1 - this.normalCDF(t));
    
    return pValue;
  }

  private static normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - probability : probability;
  }

  private static calculateMedian(arr: number[]): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  static analyzeTemporalPattern(
    timePoints: number[],
    values: number[]
  ): { trend: 'increasing' | 'decreasing' | 'fluctuating'; changePoints: number[] } {
    const changes = [];
    let previousSlope = 0;

    for (let i = 1; i < values.length; i++) {
      const currentSlope = (values[i] - values[i - 1]) / (timePoints[i] - timePoints[i - 1]);
      if (i > 1 && Math.sign(currentSlope) !== Math.sign(previousSlope)) {
        changes.push(i - 1);
      }
      previousSlope = currentSlope;
    }

    const trend = changes.length > 1 
      ? 'fluctuating' 
      : values[values.length - 1] > values[0] 
        ? 'increasing' 
        : 'decreasing';

    return { trend, changePoints: changes };
  }
}

export class TissueSpecificityAnalyzer {
  static calculateTissueSpecificity(
    expressionData: ExpressionData[]
  ): Record<string, number> {
    const tissueGroups = new Map<string, number[]>();
    
    // Group expression values by tissue
    expressionData.forEach(data => {
      const tissue = data.metadata.tissue;
      if (!tissue) return;
      
      const values = tissueGroups.get(tissue) || [];
      values.push(...data.values);
      tissueGroups.set(tissue, values);
    });

    // Calculate tau score for each tissue
    const results: Record<string, number> = {};
    tissueGroups.forEach((values, tissue) => {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      results[tissue] = this.calculateTauScore(mean, Array.from(tissueGroups.values()));
    });

    return results;
  }

  private static calculateTauScore(
    tissueMean: number,
    allTissueValues: number[][]
  ): number {
    const allMeans = allTissueValues.map(
      values => values.reduce((a, b) => a + b, 0) / values.length
    );
    const maxMean = Math.max(...allMeans);
    
    const relativeMeans = allMeans.map(mean => 1 - (mean / maxMean));
    return relativeMeans.reduce((a, b) => a + b, 0) / (allMeans.length - 1);
  }
}
