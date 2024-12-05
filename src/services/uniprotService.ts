// src/services/uniprotService.ts
import axios from 'axios';

interface UniProtAnnotation {
  type: string;
  location: {
    start: { value: number };
    end: { value: number };
  } | null;
  description: string;
  evidence?: string;
}

export class UniProtService {
  private BASE_URL = 'https://rest.uniprot.org/uniprotkb/';

  async getAnnotations(uniprotId: string): Promise<UniProtAnnotation[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}${uniprotId}`, {
        params: {
          format: 'json'
        }
      });

      const features = response.data.features || [];
      const comments = response.data.comments || [];
      const annotations: UniProtAnnotation[] = [];

      // Process features
      features.forEach((feature: any) => {
        const locationStart = feature.location?.start?.value;
        const locationEnd = feature.location?.end?.value;
        
        let description = '';
        if (typeof feature.description === 'string') {
          description = feature.description;
        } else if (feature.description?.value) {
          description = feature.description.value;
        } else {
          description = feature.type || 'No description available';
        }

        annotations.push({
          type: feature.type || 'Unknown',
          location: locationStart && locationEnd ? {
            start: { value: locationStart },
            end: { value: locationEnd }
          } : null,
          description: description,
          evidence: feature.evidences?.[0]?.code || 'Not specified'
        });
      });

      // Process comments
      comments.forEach((comment: any) => {
        let description = '';
        if (comment.text?.[0]?.value) {
          description = comment.text[0].value;
        } else if (typeof comment.text === 'string') {
          description = comment.text;
        } else {
          description = comment.type || 'No description available';
        }

        annotations.push({
          type: comment.type || 'Unknown',
          location: null,
          description: description,
          evidence: 'Not specified'
        });
      });

      return annotations;
    } catch (error) {
      console.error('Error fetching UniProt annotations:', error);
      return [];
    }
  }
}

export const uniprotService = new UniProtService();