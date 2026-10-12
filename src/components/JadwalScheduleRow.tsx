import React from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Edit,
  FileText,
  MapPin,
  Trash2,
} from "lucide-react";
import {
  getBentrokDetails,
  getMkName,
  getRuangName,
} from "../utils/scheduleHelpers";
import type { JadwalItem } from "../types/types";
import { getItemId, toTimeValue } from "../types/utils";

interface Props {
  item: JadwalItem;
  jadwalList: JadwalItem[];
  getSemesterName: (item: JadwalItem) => string;
  isConflict: (item: JadwalItem) => boolean;
  onOpenConflict: (item: JadwalItem) => void;
  onEdit: (item: JadwalItem) => void;
  onDelete: (id: number) => void;
}

export const JadwalScheduleRow: React.FC<Props> = ({
  item,
  jadwalList,
  getSemesterName,
  isConflict,
  onOpenConflict,
  onEdit,
  onDelete,
}) => {
  const conflict = isConflict(item);
  const conflictItems = getBentrokDetails(item, jadwalList) || [];
  const firstConflict = conflictItems[0] as JadwalItem | undefined;
  const id = getItemId(item) ?? 0;

  return (
    <div
      className={`group relative border-b border-base-200 px-4 sm:px-5 py-3.5 transition last:border-b-0 ${
        conflict ? "bg-error/10 hover:bg-error/20" : "hover:bg-base-200/50"
      }`}
    >
      {/* Menggunakan grid fleksibel: kolom penuh di HP, berubah jadi 4 kolom sejajar di layar md ke atas */}
      <div className="grid grid-cols-1 md:grid-cols-[110px_1fr_250px_auto] items-start md:items-center gap-3 md:gap-4">
        {/* WAKTU */}
        <div className="flex md:block items-center justify-between">
          <div>
            <div
              className={`text-xs font-bold ${
                conflict ? "text-error" : "text-base-content"
              }`}
            >
              {toTimeValue(item.jam_mulai) || "--:--"} -{" "}
              {toTimeValue(item.jam_selesai) || "--:--"}
            </div>
            <div className="mt-0.5 text-[11px] text-base-content/50 block md:hidden">
              {item.hari || "-"}
            </div>
          </div>

          {/* Tombol Aksi khusus HP (selalu tampil di layar kecil) */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="btn btn-ghost btn-square btn-sm text-primary"
              title="Edit jadwal"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (id > 0) onDelete(id);
              }}
              className="btn btn-ghost btn-square btn-sm text-error"
              title="Hapus jadwal"
              disabled={id <= 0}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* INFORMASI */}
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                conflict
                  ? "bg-error/20 text-error"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-base-content">
                {getMkName(item)}
              </p>
              <p className="truncate text-[10px] font-medium text-base-content/60">
                {item.nama_prodi || "Prodi belum tersedia"}
                {item.kode_mk && ` • ${item.kode_mk}`}
              </p>
            </div>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-0 sm:pl-9 text-[11px] text-base-content/70">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 text-base-content/50" />
              {getRuangName(item)}
            </span>
            <span>{getSemesterName(item)}</span>
            {item.catatan && (
              <span className="inline-flex max-w-[240px] items-center gap-1 truncate">
                <FileText className="h-3 w-3 text-base-content/40" />
                {item.catatan}
              </span>
            )}
          </div>
        </div>

        {/* STATUS BENTROK */}
        <div>
          {conflict ? (
            <button
              type="button"
              onClick={() => onOpenConflict(item)}
              className="group/conflict w-full rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-left transition hover:border-error/50 hover:bg-error/20 hover:shadow-sm"
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-error/20 text-error">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-error">
                      Bentrok dengan
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-error/60 transition group-hover/conflict:translate-x-0.5" />
                  </div>

                  {firstConflict ? (
                    <>
                      <p className="mt-0.5 truncate text-[11px] font-bold text-error">
                        {firstConflict.nama_prodi || "Prodi belum tersedia"}
                      </p>
                      <p className="truncate text-[10px] font-medium text-error/80">
                        {getMkName(firstConflict)}
                      </p>
                      {conflictItems.length > 1 && (
                        <p className="mt-0.5 text-[9px] font-semibold text-error/70">
                          +{conflictItems.length - 1} jadwal lainnya
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="mt-0.5 text-[10px] font-medium text-error/70">
                      Klik untuk melihat detail bentrok
                    </p>
                  )}
                </div>
              </div>
            </button>
          ) : (
            <div className="badge badge-success badge-sm gap-1.5 font-semibold text-success-content">
              <CheckCircle2 className="h-3 w-3" />
              Aman
            </div>
          )}
        </div>

        {/* AKSI (Hanya muncul saat hover di layar Desktop/md ke atas) */}
        <div className="hidden md:flex items-center justify-end gap-0.5 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="btn btn-ghost btn-square btn-sm text-primary hover:bg-primary/10"
            title="Edit jadwal"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (id > 0) onDelete(id);
            }}
            className="btn btn-ghost btn-square btn-sm text-error hover:bg-error/10"
            title="Hapus jadwal"
            disabled={id <= 0}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
