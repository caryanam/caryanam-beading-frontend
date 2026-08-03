import { useMemo, useState, type ReactNode } from "react";
import { Download, Printer, Search, SlidersHorizontal } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  rows,
  columns,
  searchKeys,
  pageSize = 6,
  actions,
  placeholder = "Search…",
}: {
  rows: T[];
  columns: Column<T>[];
  searchKeys: (keyof T)[];
  pageSize?: number;
  actions?: ReactNode;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      searchKeys.some((k) =>
        String((row as Record<string, unknown>)[k as string] ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [rows, query, searchKeys]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);

  return (
    <div className="rounded-3xl border border-border bg-card shadow-soft">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border p-5">
        <label className="flex min-w-0 items-center gap-2 rounded-2xl border border-border bg-secondary px-4 py-2.5">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <div className="flex shrink-0 items-center gap-2">
          {actions !== undefined ? (
            actions
          ) : (
            [
              { icon: SlidersHorizontal, label: "Filters" },
              { icon: Download, label: "Export" },
              { icon: Printer, label: "Print" },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                className="flex items-center gap-2 rounded-2xl border border-border px-3 py-2.5 text-xs font-medium transition-colors hover:bg-secondary"
              >
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="sticky top-0 bg-secondary/80 backdrop-blur">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-6 py-4 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase ${c.className ?? ""}`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr
                key={i}
                className="border-t border-border transition-colors hover:bg-secondary/60"
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-6 py-4 ${c.className ?? ""}`}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-16 text-center text-sm text-muted-foreground"
                >
                  No records match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border p-5 text-sm">
        <p className="text-muted-foreground">
          {filtered.length} record{filtered.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={current === 1}
            className="rounded-xl border border-border px-3 py-1.5 text-xs disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground">
            {current} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={current === pages}
            className="rounded-xl border border-border px-3 py-1.5 text-xs disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}