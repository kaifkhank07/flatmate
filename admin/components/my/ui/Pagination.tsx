import { ChevronLeft, ChevronRight } from "lucide-react";

export type PaginationProps = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (total <= 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-[var(--hair-2)] text-xs text-[var(--ink-3)]">
      <div>
        <span>
          Showing{" "}
          <strong className="font-semibold text-[var(--ink)]">
            {(page - 1) * limit + 1}
          </strong>{" "}
          to{" "}
          <strong className="font-semibold text-[var(--ink)]">
            {Math.min(page * limit, total)}
          </strong>{" "}
          of <strong className="font-semibold text-[var(--ink)]">{total}</strong>{" "}
          entries
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--hair-2)] bg-[var(--card)] text-[var(--ink-2)] hover:bg-[var(--canvas-2)] hover:text-[var(--ink)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          <ChevronLeft size={13} />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => {
            const pNum = i + 1;
            const isCurrent = page === pNum;
            return (
              <button
                key={pNum}
                type="button"
                className={`min-w-[32px] h-[32px] px-2 text-xs font-semibold rounded-lg transition-all ${isCurrent
                  ? "bg-[var(--ember)] text-white shadow-sm"
                  : "border border-[var(--hair-2)] bg-[var(--card)] text-[var(--ink-2)] hover:bg-[var(--canvas-2)] hover:text-[var(--ink)]"
                  }`}
                onClick={() => onPageChange(pNum)}
              >
                {pNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--hair-2)] bg-[var(--card)] text-[var(--ink-2)] hover:bg-[var(--canvas-2)] hover:text-[var(--ink)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          <span>Next</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
