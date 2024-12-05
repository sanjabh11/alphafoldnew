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
      baseUrl: 'https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi',
      endpoints: {
        search: '/search',
        fetch: '/fetch',
        analyze: '/analyze'
      }
    },
    arrayExpress: {
      baseUrl: 'https://www.ebi.ac.uk/arrayexpress/json',
      endpoints: {
        query: '/query',
        download: '/download'
      }
    }
  }
} as const;
