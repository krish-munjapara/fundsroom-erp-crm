import { useState } from 'react';

type DocumentAction = 'print' | 'csv';

interface DocumentActionsProps {
  onPrint?: () => void | Promise<void>;
  onExportCsv?: () => void | Promise<void>;
  printLabel?: string;
  csvLabel?: string;
  disabled?: boolean;
  className?: string;
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"
      aria-hidden="true"
    />
  );
}

export default function DocumentActions({
  onPrint,
  onExportCsv,
  printLabel = 'Print',
  csvLabel = 'Export CSV',
  disabled = false,
  className = '',
}: DocumentActionsProps) {
  const [busyAction, setBusyAction] = useState<DocumentAction | null>(null);

  const runAction = async (action: DocumentAction, handler?: () => void | Promise<void>) => {
    if (!handler || disabled || busyAction) return;
    setBusyAction(action);
    try {
      await handler();
    } finally {
      setBusyAction(null);
    }
  };

  const buttonClass =
    'inline-flex items-center gap-2 px-3 py-2 text-sm border border-navy-300 text-navy-700 rounded-lg hover:bg-navy-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {onPrint && (
        <button
          type="button"
          disabled={disabled || !!busyAction}
          onClick={() => runAction('print', onPrint)}
          className={buttonClass}
        >
          {busyAction === 'print' ? <Spinner /> : <PrintIcon />}
          {busyAction === 'print' ? 'Printing…' : printLabel}
        </button>
      )}
      {onExportCsv && (
        <button
          type="button"
          disabled={disabled || !!busyAction}
          onClick={() => runAction('csv', onExportCsv)}
          className={buttonClass}
        >
          {busyAction === 'csv' ? <Spinner /> : <CsvIcon />}
          {busyAction === 'csv' ? 'Exporting…' : csvLabel}
        </button>
      )}
    </div>
  );
}

function PrintIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
      />
    </svg>
  );
}

function CsvIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}
