interface TooltipProps {
  content?: React.ReactNode;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <div className="relative">
      {children}
      {content && (
        <div className="absolute z-50 bg-white shadow-lg rounded-lg p-2">
          {content}
        </div>
      )}
    </div>
  );
}; 