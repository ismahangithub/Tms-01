import React from 'react';
import { FileText } from 'lucide-react';  // Import an icon from lucide-react or other icon libraries

const IconReport = ({ className }: { className?: string }) => {
  return <FileText className={className || 'h-6 w-6'} />;
};

export default IconReport;
