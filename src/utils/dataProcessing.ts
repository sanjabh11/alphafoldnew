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

    // Determine overall trend
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const overallChange = lastValue - firstValue;
    
    let trend: 'increasing' | 'decreasing' | 'fluctuating';
    if (changes.length > values.length / 4) {
      trend = 'fluctuating';
    } else if (overallChange > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    return { trend, changePoints: changes };
  }

  static performClusterAnalysis(
    data: ExpressionData[]
  ): { clusters: number[]; silhouetteScore: number } {
    const points = data.map(d => d.values);
    const k = Math.min(Math.ceil(Math.sqrt(points.length / 2)), 10);
    
    // K-means clustering
    const { clusters, centroids } = this.kMeans(points, k);
    const silhouetteScore = this.calculateSilhouetteScore(points, clusters, centroids);
    
    return { clusters, silhouetteScore };
  }

  static performEnrichmentAnalysis(
    genes: string[],
    database: 'GO' | 'KEGG' | 'Reactome' = 'GO'
  ): Promise<EnrichmentResult[]> {
    // Implementation depends on the chosen database API
    return Promise.resolve([]);
  }

  static calculateCorrelation(
    data1: number[],
    data2: number[]
  ): { pearson: number; spearman: number } {
    const n = Math.min(data1.length, data2.length);
    
    // Pearson correlation
    const mean1 = data1.reduce((a, b) => a + b, 0) / n;
    const mean2 = data2.reduce((a, b) => a + b, 0) / n;
    
    let num = 0;
    let den1 = 0;
    let den2 = 0;
    
    for (let i = 0; i < n; i++) {
      const x = data1[i] - mean1;
      const y = data2[i] - mean2;
      num += x * y;
      den1 += x * x;
      den2 += y * y;
    }
    
    const pearson = num / Math.sqrt(den1 * den2);

    // Spearman correlation
    const ranked1 = this.rankData(data1);
    const ranked2 = this.rankData(data2);
    
    let sumD2 = 0;
    for (let i = 0; i < n; i++) {
      sumD2 += Math.pow(ranked1[i] - ranked2[i], 2);
    }
    
    const spearman = 1 - (6 * sumD2) / (n * (n * n - 1));

    return { pearson, spearman };
  }

  private static rankData(data: number[]): number[] {
    const sorted = data.map((value, index) => ({ value, index }))
      .sort((a, b) => a.value - b.value);
    
    const ranks = new Array(data.length);
    for (let i = 0; i < data.length; i++) {
      ranks[sorted[i].index] = i + 1;
    }
    
    return ranks;
  }

  private static kMeans(
    points: number[][],
    k: number
  ): { clusters: number[]; centroids: number[][] } {
    // Initialize centroids randomly
    const centroids = Array.from({ length: k }, () => 
      points[Math.floor(Math.random() * points.length)].slice()
    );
    
    const clusters = new Array(points.length).fill(0);
    let changed = true;
    
    while (changed) {
      changed = false;
      
      // Assign points to nearest centroid
      for (let i = 0; i < points.length; i++) {
        const newCluster = this.findNearestCentroid(points[i], centroids);
        if (newCluster !== clusters[i]) {
          clusters[i] = newCluster;
          changed = true;
        }
      }
      
      // Update centroids
      for (let i = 0; i < k; i++) {
        const clusterPoints = points.filter((_, index) => clusters[index] === i);
        if (clusterPoints.length > 0) {
          centroids[i] = this.calculateCentroid(clusterPoints);
        }
      }
    }
    
    return { clusters, centroids };
  }

  private static findNearestCentroid(
    point: number[],
    centroids: number[][]
  ): number {
    let minDist = Infinity;
    let nearest = 0;
    
    for (let i = 0; i < centroids.length; i++) {
      const dist = this.euclideanDistance(point, centroids[i]);
      if (dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    }
    
    return nearest;
  }

  private static euclideanDistance(
    point1: number[],
    point2: number[]
  ): number {
    return Math.sqrt(
      point1.reduce((sum, value, i) => 
        sum + Math.pow(value - point2[i], 2), 0
      )
    );
  }

  private static calculateCentroid(
    points: number[][]
  ): number[] {
    const n = points.length;
    const dim = points[0].length;
    return Array.from({ length: dim }, (_, i) =>
      points.reduce((sum, p) => sum + p[i], 0) / n
    );
  }

  private static calculateSilhouetteScore(
    points: number[][],
    clusters: number[],
    centroids: number[][]
  ): number {
    const n = points.length;
    let totalScore = 0;
    
    for (let i = 0; i < n; i++) {
      const a = this.calculateAverageIntraClusterDistance(
        points[i],
        points,
        clusters,
        clusters[i]
      );
      const b = this.calculateMinInterClusterDistance(
        points[i],
        points,
        clusters,
        clusters[i]
      );
      
      totalScore += (b - a) / Math.max(a, b);
    }
    
    return totalScore / n;
  }

  private static calculateAverageIntraClusterDistance(
    point: number[],
    points: number[][],
    clusters: number[],
    cluster: number
  ): number {
    const clusterPoints = points.filter((_, i) => 
      clusters[i] === cluster && points[i] !== point
    );
    
    if (clusterPoints.length === 0) return 0;
    
    return clusterPoints.reduce((sum, p) => 
      sum + this.euclideanDistance(point, p), 0
    ) / clusterPoints.length;
  }

  private static calculateMinInterClusterDistance(
    point: number[],
    points: number[][],
    clusters: number[],
    cluster: number
  ): number {
    const otherClusters = [...new Set(clusters)].filter(c => c !== cluster);
    
    return Math.min(...otherClusters.map(c => {
      const clusterPoints = points.filter((_, i) => clusters[i] === c);
      return clusterPoints.reduce((sum, p) => 
        sum + this.euclideanDistance(point, p), 0
      ) / clusterPoints.length;
    }));
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

interface EnrichmentResult {
  term: string;
  pValue: number;
  adjustedPValue: number;
  genes: string[];
  database: string;
}
