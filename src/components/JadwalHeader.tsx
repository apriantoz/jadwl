import React from "react";
import { CalendarDays, Plus, RefreshCw } from "lucide-react";

interface Props {
  loading: boolean;
  onRefresh: () => void;
  onAdd: () => void;
}

export const JadwalHeader: React.FC<Props> = ({
  loading,
  onRefresh,
  onAdd,
}) => {
  return (
    <header className="mb-5 flex items-end justify-between gap-4">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarDays className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Schedule Workspace
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-base-content">
          Kelola Jadwal
        </h1>

        <p className="mt-1 text-sm text-base-content/60">
          Atur jadwal dengan cepat tanpa harus berhadapan dengan tabel yang
          terlalu padat.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="btn btn-sm h-10 border border-base-300 bg-base-100 px-3.5 text-sm font-semibold text-base-content/70 shadow-sm hover:bg-base-200 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>

        <button
          type="button"
          onClick={onAdd}
          className="btn btn-sm btn-primary h-10 gap-2 px-4 text-sm font-semibold text-white shadow-sm shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          Tambah Jadwal
        </button>
      </div>
    </header>
  );
};
