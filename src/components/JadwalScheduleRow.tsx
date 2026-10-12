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
      className={`group relative border-b border-slate-100 px-5 py-3.5 transition last:border-b-0 ${
        conflict ? "bg-red-50/45 hover:bg-red-50" : "hover:bg-slate-50/80"
      }`}
    >
      <div className="grid grid-cols-[110px_1fr_250px_auto] items-center gap-4">
        {/* WAKTU */}
        <div className="self-start pt-0.5">
          <div
            className={`text-xs font-bold ${
              conflict ? "text-red-600" : "text-slate-700"
            }`}
          >
            {toTimeValue(item.jam_mulai) || "--:--"}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            {toTimeValue(item.jam_selesai) || "--:--"}
          </div>
        </div>

        {/* INFORMASI */}
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                conflict
                  ? "bg-red-100 text-red-600"
                  : "bg-indigo-50 text-indigo-600"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {getMkName(item)}
              </p>
              <p className="truncate text-[10px] font-medium text-slate-400">
                {item.nama_prodi || "Prodi belum tersedia"}
                {item.kode_mk && ` • ${item.kode_mk}`}
              </p>
            </div>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-9 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-400" />
              {getRuangName(item)}
            </span>
            <span>{getSemesterName(item)}</span>
            {item.catatan && (
              <span className="inline-flex max-w-[240px] items-center gap-1 truncate">
                <FileText className="h-3 w-3 text-slate-300" />
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
              className="group/conflict w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-left transition hover:border-red-300 hover:bg-red-100 hover:shadow-sm"
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-red-700">
                      Bentrok dengan
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-red-400 transition group-hover/conflict:translate-x-0.5" />
                  </div>

                  {firstConflict ? (
                    <>
                      <p className="mt-0.5 truncate text-[11px] font-bold text-red-700">
                        {firstConflict.nama_prodi || "Prodi belum tersedia"}
                      </p>
                      <p className="truncate text-[10px] font-medium text-red-600">
                        {getMkName(firstConflict)}
                      </p>
                      {conflictItems.length > 1 && (
                        <p className="mt-0.5 text-[9px] font-semibold text-red-500">
                          +{conflictItems.length - 1} jadwal lainnya
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="mt-0.5 text-[10px] font-medium text-red-500">
                      Klik untuk melihat detail bentrok
                    </p>
                  )}
                </div>
              </div>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              Aman
            </span>
          )}
        </div>

        {/* AKSI */}
        <div className="flex items-center justify-end gap-0.5 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50"
            title="Edit jadwal"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (id > 0) onDelete(id);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
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
