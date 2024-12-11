// API key configuration and validation
export const API_KEYS = {
  NCBI: import.meta.env.VITE_NCBI_API_KEY,
  UNIPROT: import.meta.env.VITE_UNIPROT_API_KEY,
  EBI: import.meta.env.VITE_EBI_API_KEY,
} as const;

export const validateApiKeys = (): { valid: boolean; missing: string[] } => {
  const missing: string[] = [];
  Object.entries(API_KEYS).forEach(([key, value]) => {
    if (!value) missing.push(key);
  });
  return {
    valid: missing.length === 0,
    missing,
  };
};

export const getApiKeyHeader = (service: keyof typeof API_KEYS) => {
  const key = API_KEYS[service];
  return key ? { 'api-key': key } : {};
};
