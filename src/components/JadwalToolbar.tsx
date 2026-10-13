import React from "react";
import { CalendarDays, MapPin, Search } from "lucide-react";
import { DAYS } from "../types/constants";
import type { DropdownOption, ViewMode } from "../types/types";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  dayFilter: string;
  onDayFilterChange: (value: string) => void;
  roomFilter: string;
  onRoomFilterChange: (value: string) => void;
  ruangOptions: DropdownOption[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const JadwalToolbar: React.FC<Props> = ({
  search,
  onSearchChange,
  dayFilter,
  onDayFilterChange,
  roomFilter,
  onRoomFilterChange,
  ruangOptions,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="card mb-6 border border-base-200 bg-base-100 shadow-sm">
      <div className="card-body flex flex-col gap-4 p-4 sm:p-5">
        {/* Pencarian */}
        <div className="relative w-full min-w-0">
          <label className="input flex h-12 w-full items-center gap-3">
            <Search className="h-5 w-5 shrink-0 text-base-content/50" />

            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari mata kuliah, prodi, kode, ruang, atau catatan..."
              aria-label="Cari jadwal"
              className="grow border-0 bg-transparent text-base text-base-content outline-none placeholder:text-base-content/45 focus:outline-none"
            />
          </label>
        </div>

        {/* Filter dan Mode Tampilan */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center">
          {/* Filter Hari */}
          <label className="form-control min-w-0">
            <label className="text-sm font-semibold text-base-content/70">
              Filter Hari
            </label>

            <select
              value={dayFilter}
              onChange={(e) => onDayFilterChange(e.target.value)}
              aria-label="Filter berdasarkan hari"
              className="select w-full"
            >
              <option value="Semua Hari">Semua Hari</option>

              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>

          {/* Filter Ruangan */}
          <label className="form-control min-w-0">
            <label className="font-semibold text-base-content/70">
              Filter Ruangan
            </label>

            <select
              value={roomFilter}
              onChange={(e) => onRoomFilterChange(e.target.value)}
              aria-label="Filter berdasarkan ruangan"
              className="select w-full"
            >
              <option value="Semua Ruang">Semua Ruang</option>

              {ruangOptions.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.nama}
                </option>
              ))}
            </select>
          </label>

          {/* Mode Tampilan */}
          <div className="form-control min-w-0">
            <span className="mb-1.5 text-sm font-semibold text-base-content/70">
              Tampilan
            </span>

            <div
              className="join grid h-12 w-full grid-cols-2 rounded-xl border border-base-300 p-1 lg:w-auto lg:min-w-[190px]"
              role="group"
              aria-label="Pilih mode tampilan"
            >
              <button
                type="button"
                onClick={() => onViewModeChange("jadwal")}
                aria-pressed={viewMode === "jadwal"}
                className={`join-item btn font-semibold ${
                  viewMode === "jadwal"
                    ? "bg-primary text-primary-content shadow-sm hover:bg-primary"
                    : "btn-ghost text-base-content/70"
                }`}
              >
                <CalendarDays className="h-4 w-4 shrink-0" />
                Jadwal
              </button>

              <button
                type="button"
                onClick={() => onViewModeChange("ruang")}
                aria-pressed={viewMode === "ruang"}
                className={`join-item btn font-semibold ${
                  viewMode === "ruang"
                    ? "bg-primary text-primary-content shadow-sm hover:bg-primary"
                    : "btn-ghost text-base-content/70"
                }`}
              >
                <MapPin className="h-4 w-4 shrink-0" />
                Ruang
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
