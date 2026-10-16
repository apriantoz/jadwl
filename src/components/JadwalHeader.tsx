import React from "react";
import { LandmarkIcon, Plus, RefreshCw } from "lucide-react";

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
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <LandmarkIcon size={17} />
          Gedung Desain Hub ISI Bali
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
          Kelola Jadwal
        </h1>

        <p className="mt-1 text-sm leading-relaxed text-base-content/70">
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
