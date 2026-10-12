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
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            {viewMode === "jadwal" ? "Jadwal Per Hari" : "Pemakaian Ruangan"}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {viewMode === "jadwal"
              ? "Urutan waktu otomatis dari pagi hingga sore."
              : "Lihat kapan setiap ruangan digunakan."}
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          {filtered.length} jadwal · {roomsInUse} ruangan
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            Memuat jadwal...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <CalendarDays className="h-7 w-7" />
          </div>
          <p className="mt-4 font-semibold text-slate-800">
            Tidak ada jadwal ditemukan
          </p>
          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
            Coba ubah pencarian atau filter. Jika belum ada jadwal, tambahkan
            jadwal baru.
          </p>

          {!search &&
            dayFilter === "Semua Hari" &&
            roomFilter === "Semua Ruang" && (
              <button
                type="button"
                onClick={onAdd}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
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
              className="border-b border-slate-200 last:border-b-0"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-slate-50/95 px-5 py-2.5 backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {group.day}
                  </span>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-400 ring-1 ring-slate-200">
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
              className="border-b border-slate-200 last:border-b-0"
            >
              <div className="flex items-center justify-between bg-slate-50/95 px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {room.nama}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {items.length} jadwal penggunaan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onFocusRoom(String(room.id))}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 hover:text-indigo-600"
                >
                  Fokus ruang
                </button>
              </div>

              {DAYS.map((day) => {
                const dayItems = items.filter((item) => item.hari === day);
                if (!dayItems.length) return null;

                return (
                  <div key={day}>
                    <div className="px-5 pt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
    </section>
  );
};
