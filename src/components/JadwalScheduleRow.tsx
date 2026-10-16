import React from "react";
import {
  BookmarkIcon,
  CheckCircle2,
  Edit,
  FileText,
  MapPin,
  Trash2,
  TriangleAlertIcon,
} from "lucide-react";

import {
  //getBentrokDetails,
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
  //jadwalList,
  getSemesterName,
  isConflict,
  onOpenConflict,
  onEdit,
  onDelete,
}) => {
  const conflict = isConflict(item);
  //const conflictItems = getBentrokDetails(item, jadwalList) || [];
  //const firstConflict = conflictItems[0] as JadwalItem | undefined;
  const id = getItemId(item) ?? 0;

  return (
    <div
      className={`group relative border-b border-base-200 px-4 py-4 transition-colors last:border-b-0 sm:px-5 ${
        conflict ? "bg-error/10 hover:bg-error/15" : "hover:bg-base-200/50"
      }`}
    >
      <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-[120px_minmax(0,1fr)_250px_auto] md:items-center md:gap-4">
        {/* WAKTU */}
        <div className="flex items-center justify-between md:block">
          <div>
            <p
              className={`text-sm font-bold tabular-nums ${
                conflict ? "text-error" : "text-base-content"
              }`}
            >
              {toTimeValue(item.jam_mulai) || "--:--"} -{" "}
              {toTimeValue(item.jam_selesai) || "--:--"}
            </p>

            <p className="mt-1 text-xs text-base-content/60 md:hidden">
              {item.hari || "-"}
            </p>
          </div>

          {/* Aksi HP */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="btn btn-ghost btn-square btn-sm text-primary"
              title="Edit jadwal"
              aria-label="Edit jadwal"
            >
              <Edit className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (id > 0) onDelete(id);
              }}
              className="btn btn-ghost btn-square btn-sm text-error"
              title="Hapus jadwal"
              aria-label="Hapus jadwal"
              disabled={id <= 0}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* INFORMASI MATA KULIAH */}
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold leading-snug text-base-content inline-flex items-center">
                {getMkName(item)}{" "}
                {conflict ? (
                  <button
                    className="btn btn-error btn-xs btn-ghost ml-1"
                    onClick={() => onOpenConflict(item)}
                  >
                    <TriangleAlertIcon size={16} />
                  </button>
                ) : (
                  <div className="ml-1">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                )}
              </p>

              <p className="mt-1 truncate text-sm text-base-content/60">
                {item.nama_prodi || "Prodi belum tersedia"}
                {item.kode_mk && ` · ${item.kode_mk}`}
              </p>
            </div>
          </div>

          {/* Detail Jadwal */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-base-content/70">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={16} className="text-base-content/50" />
              {getRuangName(item)}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <BookmarkIcon size={16} className="text-base-content/50" />
              {getSemesterName(item)}
            </span>

            {item.catatan && (
              <span className="inline-flex max-w-full items-center gap-1.5">
                <FileText className="h-4 w-4 shrink-0 text-base-content/50" />
                <span className="max-w-[240px] truncate">{item.catatan}</span>
              </span>
            )}
          </div>
        </div>

        {/* STATUS BENTROK */}
        <div className="min-w-0"></div>

        {/* AKSI DESKTOP */}
        <div className="hidden items-center justify-end gap-1 md:flex">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="btn btn-ghost btn-square btn-sm text-primary hover:bg-primary/10"
            title="Edit jadwal"
            aria-label="Edit jadwal"
          >
            <Edit className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (id > 0) onDelete(id);
            }}
            className="btn btn-ghost btn-square btn-sm text-error hover:bg-error/10"
            title="Hapus jadwal"
            aria-label="Hapus jadwal"
            disabled={id <= 0}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
