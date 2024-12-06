export const API_CONFIG = {
  alphafold3: {
    baseUrl: 'https://alphafold.api.example.com/v3',
    endpoints: {
      predict: '/predict',
      analyze: '/analyze',
      batch: '/batch'
    },
    rateLimits: {
      requestsPerMinute: 60,
      concurrentRequests: 10
    }
  },
  uniprot: {
    baseUrl: 'https://rest.uniprot.org/uniprotkb',
    endpoints: {
      search: '/search',
      fetch: '/fetch'
    }
  },
  pdb: {
    baseUrl: 'https://data.rcsb.org/rest/v1',
    endpoints: {
      structure: '/structure',
      annotations: '/annotations'
    }
  },
  geneExpression: {
    geo: {
      baseUrl: import.meta.env.VITE_GEO_API_URL || 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
      endpoints: {
        search: '/esearch.fcgi',
        summary: '/esummary.fcgi',
        fetch: '/efetch.fcgi'
      },
      params: {
        retmode: 'json',
        usehistory: 'y'
      }
    },
    arrayExpress: {
      baseUrl: import.meta.env.VITE_ARRAYEXPRESS_API_URL || 'https://www.ebi.ac.uk/arrayexpress',
      endpoints: {
        search: '/json/v3/experiments',
        fetch: '/json/v3/experiments'
      },
      params: {
        pageSize: 50,
        raw: true
      }
    }
  }
} as const;
