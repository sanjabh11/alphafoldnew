export const API_CONFIG = {
  alphafold3: {
    baseUrl: 'https://api.alphafold.ebi.ac.uk/v3',
    endpoints: {
      predict: '/prediction',
      status: '/status',
      result: '/result',
      analyze: '/analysis'
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
      baseUrl: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
      endpoints: {
        search: '/esearch.fcgi',
        fetch: '/efetch.fcgi',
        summary: '/esummary.fcgi',
        link: '/elink.fcgi'
      },
      params: {
        db: 'gds',
        retmode: 'json',
        retmax: 100,
        api_key: import.meta.env.VITE_NCBI_API_KEY || '' // Using Vite environment variable
      }
    },
    arrayExpress: {
      baseUrl: '/api/arrayexpress',
      endpoints: {
        query: '/query',
        files: '/files',
        experiments: '/experiments',
        protocols: '/protocols'
      },
      fallbackUrl: 'https://www.ebi.ac.uk/arrayexpress/json',
      params: {
        pageSize: 100,
        format: 'json'
      }
    },
    proxy: {
      enabled: true,
      timeout: 30000,
      retries: 3,
      backoff: {
        initial: 1000,
        max: 10000,
        factor: 2
      }
    },
    cache: {
      ttl: 3600000, // 1 hour
      maxSize: 100, // Maximum number of cached queries
      cleanupInterval: 300000 // 5 minutes
    }
  }
} as const;
