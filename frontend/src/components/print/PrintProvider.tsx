import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

interface PrintContextValue {
  print: (content: ReactNode) => void;
}

const PrintContext = createContext<PrintContextValue | null>(null);

export function PrintProvider({ children }: { children: ReactNode }) {
  const [printContent, setPrintContent] = useState<ReactNode>(null);

  const print = useCallback((content: ReactNode) => {
    setPrintContent(content);

    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        const cleanup = () => setPrintContent(null);
        window.addEventListener('afterprint', cleanup, { once: true });
        setTimeout(cleanup, 1500);
      }, 100);
    });
  }, []);

  return (
    <PrintContext.Provider value={{ print }}>
      {children}
      {printContent ? (
        <div className="print-only print-container" aria-hidden="true">
          <div className="doc-page">{printContent}</div>
        </div>
      ) : null}
    </PrintContext.Provider>
  );
}

export function usePrint() {
  const context = useContext(PrintContext);
  if (!context) {
    throw new Error('usePrint must be used within PrintProvider');
  }
  return context;
}
