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
    <div className="card bg-base-100 border border-base-200 shadow-sm mb-5">
      <div className="card-body p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Input Pencarian */}
        <div className="relative min-w-0 flex-1">
          <label className="input w-full flex items-center gap-2">
            <Search className="h-4 w-4 text-base-content/40 shrink-0" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari mata kuliah, prodi, kode, ruang, atau catatan..."
              className="grow border-0 bg-transparent focus:outline-none"
            />
          </label>
        </div>

        {/* Baris Filter & Toggle untuk Layar Kecil */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          {/* Filter Hari */}
          <select
            value={dayFilter}
            onChange={(e) => onDayFilterChange(e.target.value)}
            className="select w-full sm:w-40"
          >
            <option>Semua Hari</option>
            {DAYS.map((day) => (
              <option key={day}>{day}</option>
            ))}
          </select>

          {/* Filter Ruang */}
          <select
            value={roomFilter}
            onChange={(e) => onRoomFilterChange(e.target.value)}
            className="select w-full sm:w-40 "
          >
            <option>Semua Ruang</option>
            {ruangOptions.map((room) => (
              <option key={room.id} value={room.id}>
                {room.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle View Mode (Jadwal / Ruang) */}
        <div className="join w-full sm:w-auto flex justify-center">
          <button
            type="button"
            onClick={() => onViewModeChange("jadwal")}
            className={`join-item btn btn-sm flex-1 sm:flex-initial ${
              viewMode === "jadwal"
                ? "btn-active bg-base-100 text-base-content shadow-sm"
                : "btn-ghost text-base-content/60"
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Jadwal
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange("ruang")}
            className={`join-item btn btn-sm flex-1 sm:flex-initial ${
              viewMode === "ruang"
                ? "btn-active bg-base-100 text-base-content shadow-sm"
                : "btn-ghost text-base-content/60"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            Ruang
          </button>
        </div>
      </div>
    </div>
  );
};
