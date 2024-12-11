import { API_KEYS, getApiKeyHeader } from './apiKeys';

export const API_CONFIG = {
  alphafold3: {
    baseUrl: 'https://api.alphafold.ebi.ac.uk/v3',
    endpoints: {
      predict: '/prediction',
      status: '/status',
      result: '/result',
      analyze: '/analysis'
    }
  },
  ncbi: {
    baseUrl: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
    apiKey: import.meta.env.VITE_NCBI_API_KEY,
    endpoints: {
      search: '/esearch.fcgi',
      fetch: '/efetch.fcgi',
      summary: '/esummary.fcgi',
      link: '/elink.fcgi'
    },
    headers: {
      'api-key': import.meta.env.VITE_NCBI_API_KEY
    }
  },
  arrayexpress: {
    baseUrl: 'https://www.ebi.ac.uk/biostudies/api',
    endpoints: {
      search: '/v1/search',
      details: '/v1/studies'
    },
    collection: 'ArrayExpress'
  },
  uniprot: {
    baseUrl: 'https://rest.uniprot.org',
    endpoints: {
      search: '/uniprotkb/search',
      entry: '/uniprotkb'
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
      }
    },
    arrayExpress: {
      baseUrl: 'https://www.ebi.ac.uk/biostudies/api/v1',
      endpoints: {
        search: '/studies',
        files: '/studies'
      }
    }
  }
} as const;
