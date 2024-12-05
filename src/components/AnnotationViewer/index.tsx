// src/components/AnnotationViewer/index.tsx
import { AnnotationSection } from './AnnotationSection';

const AnnotationViewer: React.FC<{ uniprotId: string }> = ({ uniprotId }) => {
  const { data: annotations, isLoading } = useQuery({
    queryKey: ['annotations', uniprotId],
    queryFn: () => uniprotService.getAnnotations(uniprotId)
  });

  const groupedAnnotations = useMemo(() => {
    if (!annotations) return {};
    return annotations.reduce((acc, annotation) => {
      const type = annotation.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(annotation);
      return acc;
    }, {} as Record<string, typeof annotations>);
  }, [annotations]);

  return (
    <div className="annotation-viewer">
      {Object.entries(groupedAnnotations).map(([type, items]) => (
        <AnnotationSection key={type} title={type} count={items.length}>
          {items.map((item, index) => (
            <div key={index} className="mb-2 last:mb-0">
              <p className="text-sm">{item.description}</p>
              <p className="text-xs text-gray-500">
                Position: {item.location.start}-{item.location.end}
              </p>
            </div>
          ))}
        </AnnotationSection>
      ))}
    </div>
  );
};