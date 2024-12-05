import { uniprotService } from './uniprotService';

async function testUniProtService() {
  try {
    console.log('Testing UniProt Service...');
    
    // Test annotations
    console.log('Fetching annotations for P11411...');
    const annotations = await uniprotService.getAnnotations('P11411');
    console.log('Annotations:', annotations);
    
    // Test protein info
    console.log('Fetching protein info for P11411...');
    const info = await uniprotService.getProteinInfo('P11411');
    console.log('Protein Info:', info);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testUniProtService();