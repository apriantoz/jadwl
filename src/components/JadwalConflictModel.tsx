import React from "react";
import { AlertTriangle, BookOpen, Clock, Edit, MapPin, X } from "lucide-react";
import {
  getBentrokDetails,
  getMkName,
  getRuangName,
} from "../utils/scheduleHelpers";
import type { JadwalItem } from "../types/types";
import { getItemId, toTimeValue } from "../types/utils";

interface Props {
  open: boolean;
  item: JadwalItem | null;
  jadwalList: JadwalItem[];
  getSemesterName: (item: JadwalItem) => string;
  onClose: () => void;
  onEdit: (item: JadwalItem) => void;
}

export const JadwalConflictModal: React.FC<Props> = ({
  open,
  item,
  jadwalList,
  getSemesterName,
  onClose,
  onEdit,
}) => {
  if (!open || !item) return null;

  const conflictDetails = getBentrokDetails(item, jadwalList) || [];

  return (
    <div
      className="modal modal-open bg-base-950/55 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box max-w-2xl bg-base-100 p-0 shadow-2xl border border-error/30">
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-error/20 bg-error/10 px-6 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error/20 text-error">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-error">
                Detail Jadwal Bentrok
              </h2>
              <p className="mt-0.5 text-xs text-error/80">
                Jadwal berikut menggunakan ruangan dan waktu yang saling
                bertabrakan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-square text-error/70 hover:bg-error/20 hover:text-error"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto">
          {/* JADWAL TERPILIH */}
          <div className="border-b border-base-200 px-6 py-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-base-content/50">
              Jadwal yang dipilih
            </p>
            <div className="rounded-xl border border-base-200 bg-base-200/50 p-3.5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-base-content">
                    {getMkName(item)}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-medium text-base-content/60">
                    {item.nama_prodi || "Prodi belum tersedia"}
                    {item.kode_mk && ` • ${item.kode_mk}`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-base-content/70">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {toTimeValue(item.jam_mulai) || "--:--"} -{" "}
                      {toTimeValue(item.jam_selesai) || "--:--"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {getRuangName(item)}
                    </span>
                    <span>{item.hari || "-"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DAFTAR BENTROK */}
          <div className="px-6 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-base-content">
                  Bentrok dengan
                </p>
                <p className="mt-0.5 text-[10px] text-base-content/60">
                  Seluruh jadwal yang terdeteksi bentrok dengan jadwal ini.
                </p>
              </div>
              <span className="badge badge-error badge-sm font-bold">
                {conflictDetails.length} jadwal
              </span>
            </div>

            {conflictDetails.length > 0 ? (
              <div className="space-y-2.5">
                {conflictDetails.map((rawItem, index) => {
                  const conflictItem = rawItem as unknown as JadwalItem;
                  const conflictId =
                    getItemId(conflictItem) ?? `conflict-${index}`;

                  return (
                    <div
                      key={conflictId}
                      className="rounded-xl border border-base-200 bg-base-100 p-3.5 transition hover:border-error/40 hover:bg-error/5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-error/10 text-error">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-base-content">
                                {getMkName(conflictItem)}
                              </p>
                              <p className="mt-0.5 truncate text-[10px] font-medium text-base-content/60">
                                {conflictItem.nama_prodi ||
                                  "Prodi belum tersedia"}
                                {conflictItem.kode_mk &&
                                  ` • ${conflictItem.kode_mk}`}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onEdit(conflictItem)}
                              className="btn btn-ghost btn-xs bg-primary/10 text-primary hover:bg-primary/20 gap-1.5 shrink-0"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </button>
                          </div>

                          <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-lg bg-base-200/50 px-2.5 py-2">
                              <p className="text-[9px] font-semibold uppercase tracking-wide text-base-content/50">
                                Hari & Waktu
                              </p>
                              <p className="mt-0.5 text-[10px] font-semibold text-base-content/80">
                                {conflictItem.hari || "-"} ·{" "}
                                {toTimeValue(conflictItem.jam_mulai) || "--:--"}{" "}
                                -{" "}
                                {toTimeValue(conflictItem.jam_selesai) ||
                                  "--:--"}
                              </p>
                            </div>
                            <div className="rounded-lg bg-base-200/50 px-2.5 py-2">
                              <p className="text-[9px] font-semibold uppercase tracking-wide text-base-content/50">
                                Ruangan
                              </p>
                              <p className="mt-0.5 truncate text-[10px] font-semibold text-base-content/80">
                                {getRuangName(conflictItem)}
                              </p>
                            </div>
                            <div className="rounded-lg bg-base-200/50 px-2.5 py-2">
                              <p className="text-[9px] font-semibold uppercase tracking-wide text-base-content/50">
                                Semester
                              </p>
                              <p className="mt-0.5 truncate text-[10px] font-semibold text-base-content/80">
                                {getSemesterName(conflictItem)}
                              </p>
                            </div>
                            {conflictItem.catatan && (
                              <div className="rounded-lg bg-base-200/50 px-2.5 py-2">
                                <p className="text-[9px] font-semibold uppercase tracking-wide text-base-content/50">
                                  Catatan
                                </p>
                                <p className="mt-0.5 truncate text-[10px] font-semibold text-base-content/80">
                                  {conflictItem.catatan}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-base-200 bg-base-200/50 px-4 py-8 text-center">
                <AlertTriangle className="mx-auto h-6 w-6 text-base-content/40" />
                <p className="mt-2 text-xs font-semibold text-base-content/80">
                  Detail bentrok tidak ditemukan
                </p>
                <p className="mt-1 text-[10px] text-base-content/60">
                  Status bentrok tersedia dari database, tetapi helper tidak
                  mengembalikan detail jadwal terkait.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Modal */}
        <div className="flex justify-end border-t border-base-200 bg-base-200/50 px-6 py-3.5 modal-action mt-0">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost border border-base-300 font-semibold text-base-content/70"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
