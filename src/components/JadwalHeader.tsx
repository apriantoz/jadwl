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
    <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      {/* Judul dan Deskripsi */}
      <div className="min-w-0">
        <div className="mb-2.5 flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </span>

          <span className="text-sm font-bold uppercase tracking-wide text-primary">
            Schedule Workspace
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
          Kelola Jadwal
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-base-content/60 sm:text-base">
          Atur jadwal perkuliahan, pantau bentrok, dan kelola penggunaan ruangan
          dengan lebih mudah.
        </p>
      </div>

      {/* Tombol Aksi */}
      <div className="flex w-full items-center gap-2 md:w-auto md:shrink-0">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="btn btn-outline h-11 min-h-11 flex-1 gap-2 border-base-300 bg-base-100 px-4 text-sm font-semibold text-base-content/80 shadow-sm hover:bg-base-200 disabled:cursor-not-allowed disabled:opacity-60 md:flex-initial"
        >
          <RefreshCw
            className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>

        <button
          type="button"
          onClick={onAdd}
          className="btn btn-primary h-11 min-h-11 flex-1 gap-2 px-4 text-sm font-semibold shadow-sm shadow-primary/20 md:flex-initial"
        >
          <Plus className="h-4 w-4 shrink-0" />
          Tambah Jadwal
        </button>
      </div>
    </header>
  );
};
