import { useCallback } from 'react';
import { useToast } from '../context';

export function useDocumentExport() {
  const { showToast } = useToast();

  const runExport = useCallback(
    async (action: () => void | Promise<void>, successMessage?: string) => {
      try {
        await action();
        if (successMessage) showToast(successMessage, 'success');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to complete the export. Please try again.';
        showToast(message, 'error');
      }
    },
    [showToast]
  );

  return { runExport };
}
