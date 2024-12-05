import SequenceViewer from '../components/SequenceViewer';
import BlastSearch from '../components/BlastSearch';

  return (
    <div className="protein-page">
      <SequenceViewer 
        uniprotId={uniprotId} 
        features={proteinFeatures} 
      />
      <BlastSearch sequence={proteinSequence} />
    </div>
  ); 