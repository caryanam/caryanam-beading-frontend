import { type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const isDanger = variant === "danger";

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-secondary/80 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all cursor-pointer"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          <div
            className={cn(
              "grid size-14 place-items-center rounded-2xl border shadow-inner",
              isDanger
                ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                : "bg-amber-500/10 border-amber-500/30 text-amber-500"
            )}
          >
            <AlertTriangle className="size-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black tracking-tight text-foreground">
              {title}
            </h3>
            <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 w-full pt-4 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-border bg-secondary px-4 py-2.5 text-xs font-extrabold text-foreground hover:bg-secondary/80 transition-all cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition-all cursor-pointer disabled:opacity-50",
                isDanger
                  ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/25"
                  : "bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] shadow-[#FFC700]/25"
              )}
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block size-3.5 border-2 border-current border-t-transparent rounded-full" />
                  <span>Processing...</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
