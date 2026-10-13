import React from "react";
import { CalendarDays, Clock, MapPin, Plus } from "lucide-react";
import { DAYS } from "../types/constants";
import { getItemId } from "../types/utils";
import type { JadwalItem, ViewMode, DropdownOption } from "../types/types";
import { JadwalScheduleRow } from "./JadwalScheduleRow";

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
    <div className="card overflow-hidden border border-base-200 bg-base-100 shadow-sm">
      {/* Header */}
      <div className="card-body flex flex-col justify-between gap-3 border-b border-base-200 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
        <div>
          <h2 className="card-title text-lg font-bold text-base-content">
            {viewMode === "jadwal" ? "Jadwal Per Hari" : "Pemakaian Ruangan"}
          </h2>

          <p className="mt-1 text-sm leading-relaxed text-base-content/60">
            {viewMode === "jadwal"
              ? "Urutan waktu otomatis dari pagi hingga sore."
              : "Lihat kapan setiap ruangan digunakan."}
          </p>
        </div>

        <div className="badge badge-ghost flex items-center gap-2 self-start py-3 text-sm font-medium text-base-content/70 sm:self-auto">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            {filtered.length} jadwal · {roomsInUse} ruangan
          </span>
        </div>
      </div>

      {/* Konten Utama */}
      <div className="card-body p-0">
        {loading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-4">
            <span className="loading loading-spinner loading-lg text-primary" />

            <p className="mt-3 text-sm font-medium text-base-content/70">
              Memuat jadwal...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-base-200 text-base-content/40">
              <CalendarDays className="h-7 w-7" />
            </div>

            <p className="mt-4 text-base font-semibold text-base-content">
              Tidak ada jadwal ditemukan
            </p>

            <p className="mt-2 max-w-sm text-sm leading-relaxed text-base-content/60">
              Coba ubah pencarian atau filter. Jika belum ada jadwal, tambahkan
              jadwal baru.
            </p>

            {!search &&
              dayFilter === "Semua Hari" &&
              roomFilter === "Semua Ruang" && (
                <button
                  type="button"
                  onClick={onAdd}
                  className="btn btn-primary btn-sm mt-4 gap-2"
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
                {/* Header Hari */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-base-200 bg-base-200/90 px-4 py-3 backdrop-blur sm:px-5">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />

                    <span className="text-sm font-bold uppercase tracking-wide text-base-content/80">
                      {group.day}
                    </span>
                  </div>

                  <span className="badge badge-neutral badge-sm font-semibold">
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
                {/* Header Ruangan */}
                <div className="flex items-center justify-between gap-3 bg-base-200/50 px-4 py-3.5 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <MapPin className="h-5 w-5" />
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-base-content">
                        {room.nama}
                      </p>

                      <p className="mt-0.5 text-sm text-base-content/60">
                        {items.length} jadwal penggunaan
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onFocusRoom(String(room.id))}
                    className="btn btn-ghost btn-sm shrink-0 border border-base-300 font-semibold text-base-content/70 hover:text-primary"
                  >
                    Fokus ruang
                  </button>
                </div>

                {DAYS.map((day) => {
                  const dayItems = items.filter((item) => item.hari === day);

                  if (!dayItems.length) return null;

                  return (
                    <div key={day}>
                      <div className="px-4 pb-1 pt-4 text-xs font-bold uppercase tracking-wide text-base-content/60 sm:px-5">
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
