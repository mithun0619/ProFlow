import React from 'react';
import { FiInbox } from 'react-icons/fi';

const EmptyState = ({
  title = 'No items found',
  description = 'Get started by creating a new workspace or task.',
  icon = <FiInbox className="w-10 h-10 text-primary-500/60" />,
  actionButton,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-2xl glass-panel border border-dashed border-slate-800 text-center animate-slide-in">
      <div className="p-4 bg-slate-900/60 rounded-full border border-slate-800/80 mb-4 shadow-inner">
        {icon}
      </div>
      <h3 className="text-white text-base font-semibold mb-1">{title}</h3>
      <p className="text-slate-400 text-xs font-light max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {actionButton && <div className="flex justify-center">{actionButton}</div>}
    </div>
  );
};

export default EmptyState;
