"use client";

import { useEffect } from "react";

export default function Modal({
  open, title, onClose, children, wide,
}: {
  open: boolean; title: string; onClose: () => void;
  children: React.ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4"
         onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`card max-h-[85vh] w-full overflow-hidden ${wide ? "max-w-3xl" : "max-w-lg"}`}
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
          <h2 className="font-semibold text-ink-900">{title}</h2>
          <button onClick={onClose} aria-label="Close"
                  className="cursor-pointer rounded-lg px-2 text-xl leading-none text-ink-400 hover:bg-ink-50">
            ×
          </button>
        </div>
        <div className="max-h-[calc(85vh-3.5rem)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
