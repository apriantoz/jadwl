import React from "react";
import { CalendarDays, Clock, Loader2, MapPin, Plus } from "lucide-react";
import { DAYS } from "../types/constants";
import { getItemId } from "../types/utils";
import type { JadwalItem, ViewMode } from "../types/types";
import { JadwalScheduleRow } from "./JadwalScheduleRow";
import type { DropdownOption } from "../types/types";

interface Props {
  loading: boolean;
  viewMode: ViewMode;
  filtered: JadwalItem[];
  groupedByDay: { day: string; items: JadwalItem[] }[];
  roomGroups: { room: DropdownOption; items: JadwalItem[] }[];
  jadwalList: JadwalItem[];
  roomsInUse: number;
  search: string;
  dayFilter: string;
  roomFilter: string;
  getSemesterName: (item: JadwalItem) => string;
  isConflict: (item: JadwalItem) => boolean;
  onOpenConflict: (item: JadwalItem) => void;
  onEdit: (item: JadwalItem) => void;
  onDelete: (id: number) => void;
  onFocusRoom: (roomId: string) => void;
  onAdd: () => void;
}

export const JadwalListView: React.FC<Props> = ({
  loading,
  viewMode,
  filtered,
  groupedByDay,
  roomGroups,
  jadwalList,
  roomsInUse,
  search,
  dayFilter,
  roomFilter,
  getSemesterName,
  isConflict,
  onOpenConflict,
  onEdit,
  onDelete,
  onFocusRoom,
  onAdd,
}) => {
  const rowProps = {
    jadwalList,
    getSemesterName,
    isConflict,
    onOpenConflict,
    onEdit,
    onDelete,
  };

  return (
    <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
      {/* Header Card: responsif flex-col di HP, flex-row di layar md */}
      <div className="card-body px-4 sm:px-5 py-4 border-b border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="card-title text-sm font-bold text-base-content">
            {viewMode === "jadwal" ? "Jadwal Per Hari" : "Pemakaian Ruangan"}
          </h2>
          <p className="mt-0.5 text-xs text-base-content/60">
            {viewMode === "jadwal"
              ? "Urutan waktu otomatis dari pagi hingga sore."
              : "Lihat kapan setiap ruangan digunakan."}
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-medium text-base-content/60 badge badge-ghost self-start sm:self-auto">
          <Clock className="h-3.5 w-3.5" />
          {filtered.length} jadwal · {roomsInUse} ruangan
        </div>
      </div>

      {/* Konten Utama */}
      <div className="card-body p-0">
        {loading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center">
            <span className="loading loading-spinner loading-md text-primary"></span>
            <p className="mt-3 text-sm font-semibold text-base-content/70">
              Memuat jadwal...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-base-200 text-base-content/40">
              <CalendarDays className="h-7 w-7" />
            </div>
            <p className="mt-4 font-semibold text-base-content">
              Tidak ada jadwal ditemukan
            </p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-base-content/60">
              Coba ubah pencarian atau filter. Jika belum ada jadwal, tambahkan
              jadwal baru.
            </p>

            {!search &&
              dayFilter === "Semua Hari" &&
              roomFilter === "Semua Ruang" && (
                <button
                  type="button"
                  onClick={onAdd}
                  className="btn btn-primary btn-sm mt-4 gap-2 text-xs"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Jadwal
                </button>
              )}
          </div>
        ) : viewMode === "jadwal" ? (
          <div>
            {groupedByDay.map((group) => (
              <div
                key={group.day}
                className="border-b border-base-200 last:border-b-0"
              >
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-base-200 bg-base-200/80 px-4 sm:px-5 py-2.5 backdrop-blur">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-base-content/80">
                      {group.day}
                    </span>
                  </div>
                  <span className="badge badge-sm badge-neutral font-semibold text-[10px]">
                    {group.items.length} jadwal
                  </span>
                </div>

                {group.items.map((item, index) => (
                  <JadwalScheduleRow
                    key={getItemId(item) ?? `${group.day}-${index}`}
                    item={item}
                    {...rowProps}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div>
            {roomGroups.map(({ room, items }) => (
              <div
                key={room.id}
                className="border-b border-base-200 last:border-b-0"
              >
                <div className="flex items-center justify-between bg-base-200/50 px-4 sm:px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-base-content">
                        {room.nama}
                      </p>
                      <p className="text-[10px] text-base-content/60">
                        {items.length} jadwal penggunaan
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onFocusRoom(String(room.id))}
                    className="btn btn-ghost btn-xs border border-base-300 font-semibold text-base-content/70 hover:text-primary"
                  >
                    Fokus ruang
                  </button>
                </div>

                {DAYS.map((day) => {
                  const dayItems = items.filter((item) => item.hari === day);
                  if (!dayItems.length) return null;

                  return (
                    <div key={day}>
                      <div className="px-4 sm:px-5 pt-3 text-[10px] font-bold uppercase tracking-wider text-base-content/50">
                        {day}
                      </div>
                      {dayItems.map((item, index) => (
                        <JadwalScheduleRow
                          key={getItemId(item) ?? `${room.id}-${day}-${index}`}
                          item={item}
                          {...rowProps}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
