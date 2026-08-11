import type { ReactNode } from 'react';

interface TableContainerProps {
  children: ReactNode;
  className?: string;
}

/** Wraps tables so only the table area scrolls horizontally, not the whole page. */
export default function TableContainer({ children, className = '' }: TableContainerProps) {
  return (
    <div className={`overflow-x-auto custom-scrollbar -mx-1 px-1 ${className}`}>
      {children}
    </div>
  );
}
