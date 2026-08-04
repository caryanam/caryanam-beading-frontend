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
  pageSize = 8,
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
    <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
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

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse text-sm">
          <thead className="sticky top-0 bg-secondary/80 backdrop-blur z-10 border-b border-border">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-5 py-4 text-left text-xs font-black tracking-wider text-muted-foreground uppercase whitespace-nowrap ${c.className ?? ""}`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((row, i) => (
              <tr
                key={i}
                className="transition-colors hover:bg-secondary/40"
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-5 py-4 whitespace-nowrap ${c.className ?? ""}`}>
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
                  No records match your search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border p-5 text-sm">
        <p className="text-xs font-bold text-muted-foreground">
          Showing <span className="text-foreground">{filtered.length}</span> record{filtered.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={current === 1}
            className="rounded-xl border border-border px-3.5 py-1.5 text-xs font-extrabold disabled:opacity-40 hover:bg-secondary transition-all cursor-pointer"
          >
            Previous
          </button>
          <span className="text-xs font-bold text-muted-foreground px-1">
            {current} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={current === pages}
            className="rounded-xl border border-border px-3.5 py-1.5 text-xs font-extrabold disabled:opacity-40 hover:bg-secondary transition-all cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}