import axios from 'axios';

const ANNOTATION_ENDPOINTS = {
  uniprot: 'https://rest.uniprot.org/uniprotkb/',
};

export const fetchFunctionalAnnotations = async (accession: string) => {
  const response = await axios.get(`${ANNOTATION_ENDPOINTS.uniprot}${accession}/annotations`);
  return response.data;
}; 