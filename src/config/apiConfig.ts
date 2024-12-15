import { API_KEYS, getApiKeyHeader } from './apiKeys';

export const API_CONFIG = {
  alphafold3: {
    baseUrl: 'https://api.alphafold.ebi.ac.uk/api',
    endpoints: {
      predict: '/prediction',
      structure: '/structure',
      complex: '/complex',
      interaction: '/interaction'
    },
    params: {
      format: 'json',
      version: '3'
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
  geneExpression: {
    geo: {
      baseUrl: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
      endpoints: {
        search: '/esearch.fcgi',
        fetch: '/efetch.fcgi',
        summary: '/esummary.fcgi'
      }
    },
    biostudies: {
      baseUrl: 'https://www.ebi.ac.uk/biostudies',
      endpoints: {
        search: '/api/v1/search',
        studies: '/api/v1/studies'
      },
      params: {
        type: 'ArrayExpress',
        pageSize: 10
      }
    }
  },
  arrayexpress: {
    baseUrl: 'https://www.ebi.ac.uk/biostudies/api/v1',
    legacyUrl: 'https://www.ebi.ac.uk/arrayexpress/json/v3',
    endpoints: {
      search: '/search',
      details: '/studies',
      files: '/files'
    },
    params: {
      type: 'ArrayExpress',
      pageSize: 10
    }
  },
  uniprot: {
    baseUrl: 'https://rest.uniprot.org',
    endpoints: {
      search: '/uniprotkb/search',
      entry: '/uniprotkb'
    }
  }
} as const;
