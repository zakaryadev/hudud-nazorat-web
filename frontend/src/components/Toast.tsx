import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';

type Show = (message: string, opts?: { action?: string; onAction?: () => void }) => void;
const Ctx = createContext<Show>(() => {});
export const useToast = () => useContext(Ctx);

// Material snackbar: pastki menyu tepasida, bir necha soniyadan keyin yo'qoladi
export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<{ message: string; action?: string; onAction?: () => void } | null>(null);
  const timer = useRef<number>();
  const show = useCallback<Show>((message, opts) => {
    setT({ message, ...opts });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setT(null), 4000);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      {t && (
        <div className="snack" role="status" aria-live="polite">
          <span>{t.message}</span>
          <button
            onClick={() => {
              t.onAction?.();
              setT(null);
            }}
          >
            {t.action ?? 'Yopish'}
          </button>
        </div>
      )}
    </Ctx.Provider>
  );
}
