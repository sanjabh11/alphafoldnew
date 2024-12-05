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
    baseUrl: '/api/gene-expression',
    endpoints: {
      query: '/query',
      protein: '/protein/:id/query',
      search: '/search',
      details: '/details/:id',
      batch: '/batch'
    },
    params: {
      format: 'json',
      pageSize: 50
    },
    rateLimits: {
      requestsPerMinute: 60,
      maxBatchSize: 100,
      retryDelay: 2000
    },
    geo: {
      baseUrl: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
      endpoints: {
        search: '/esearch.fcgi',
        fetch: '/efetch.fcgi',
        summary: '/esummary.fcgi',
        link: '/elink.fcgi',
        batch: '/epost.fcgi',
        history: '/ehistory.fcgi'
      },
      params: {
        db: 'gds',
        retmode: 'json',
        retmax: 100,
        api_key: import.meta.env.VITE_NCBI_API_KEY || '',
        usehistory: 'y'
      },
      rateLimits: {
        requestsPerSecond: 3,
        maxBatchSize: 200,
        retryDelay: 1000
      },
      cache: {
        ttl: parseInt(import.meta.env.VITE_API_CACHE_TTL) || 3600000,
        maxEntries: 1000
      }
    },
    arrayExpress: {
      baseUrl: 'https://www.ebi.ac.uk/arrayexpress/json/v3',
      endpoints: {
        experiments: '/experiments',
        files: '/files',
        protocols: '/protocols',
        samples: '/samples'
      },
      params: {
        format: 'json',
        pageSize: 50
      },
      rateLimits: {
        requestsPerMinute: 30,
        maxBatchSize: 50,
        retryDelay: 3000
      },
      cache: {
        ttl: parseInt(import.meta.env.VITE_API_CACHE_TTL) || 3600000,
        maxEntries: 500
      }
    }
  }
} as const;
