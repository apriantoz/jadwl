import React from "react";
import { CalendarDays, Plus, RefreshCw } from "lucide-react";

interface Props {
  loading: boolean;
  onRefresh: () => void;
  onAdd: () => void;
}

export const JadwalHeader: React.FC<Props> = ({ loading, onRefresh, onAdd }) => {
  return (
    <header className="mb-5 flex items-end justify-between gap-4">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <CalendarDays className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Schedule Workspace
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Kelola Jadwal
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Atur jadwal dengan cepat tanpa harus berhadapan dengan tabel yang
          terlalu padat.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Jadwal
        </button>
      </div>
    </header>
  );
};