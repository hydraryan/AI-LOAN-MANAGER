import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  actionIcon 
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
       <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
       </div>
       {actionLabel && (
         <button 
            onClick={onAction}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
         >
            {actionIcon}
            <span>{actionLabel}</span>
         </button>
       )}
    </div>
  );
};

export default PageHeader;