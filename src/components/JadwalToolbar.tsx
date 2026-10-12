import React from "react";
import { CalendarDays, MapPin, Search } from "lucide-react";
import { DAYS, INPUT_CLASS } from "../types/constants";
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
    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari mata kuliah, prodi, kode, ruang, atau catatan..."
          className={`${INPUT_CLASS} pl-9`}
        />
      </div>

      <select
        value={dayFilter}
        onChange={(e) => onDayFilterChange(e.target.value)}
        className={`${INPUT_CLASS} w-40`}
      >
        <option>Semua Hari</option>
        {DAYS.map((day) => (
          <option key={day}>{day}</option>
        ))}
      </select>

      <select
        value={roomFilter}
        onChange={(e) => onRoomFilterChange(e.target.value)}
        className={`${INPUT_CLASS} w-48`}
      >
        <option>Semua Ruang</option>
        {ruangOptions.map((room) => (
          <option key={room.id} value={room.id}>
            {room.nama}
          </option>
        ))}
      </select>

      <div className="flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => onViewModeChange("jadwal")}
          className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
            viewMode === "jadwal"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Jadwal
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange("ruang")}
          className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
            viewMode === "ruang"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500"
          }`}
        >
          <MapPin className="h-3.5 w-3.5" />
          Ruang
        </button>
      </div>
    </div>
  );
};
