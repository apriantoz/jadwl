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
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-red-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-red-100 bg-red-50/70 px-6 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-red-800">
                Detail Jadwal Bentrok
              </h2>
              <p className="mt-0.5 text-xs text-red-500">
                Jadwal berikut menggunakan ruangan dan waktu yang saling
                bertabrakan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-red-400 hover:bg-red-100 hover:text-red-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto">
          {/* JADWAL TERPILIH */}
          <div className="border-b border-slate-100 px-6 py-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Jadwal yang dipilih
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {getMkName(item)}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500">
                    {item.nama_prodi || "Prodi belum tersedia"}
                    {item.kode_mk && ` • ${item.kode_mk}`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
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
                <p className="text-sm font-bold text-slate-800">
                  Bentrok dengan
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Seluruh jadwal yang terdeteksi bentrok dengan jadwal ini.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold text-red-700">
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
                      className="rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-red-200 hover:bg-red-50/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {getMkName(conflictItem)}
                              </p>
                              <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500">
                                {conflictItem.nama_prodi ||
                                  "Prodi belum tersedia"}
                                {conflictItem.kode_mk &&
                                  ` • ${conflictItem.kode_mk}`}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onEdit(conflictItem)}
                              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-indigo-50 px-3 text-[10px] font-bold text-indigo-600 hover:bg-indigo-100"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </button>
                          </div>

                          <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                                Hari & Waktu
                              </p>
                              <p className="mt-0.5 text-[10px] font-semibold text-slate-700">
                                {conflictItem.hari || "-"} ·{" "}
                                {toTimeValue(conflictItem.jam_mulai) || "--:--"}{" "}
                                -{" "}
                                {toTimeValue(conflictItem.jam_selesai) ||
                                  "--:--"}
                              </p>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                                Ruangan
                              </p>
                              <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-700">
                                {getRuangName(conflictItem)}
                              </p>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                                Semester
                              </p>
                              <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-700">
                                {getSemesterName(conflictItem)}
                              </p>
                            </div>
                            {conflictItem.catatan && (
                              <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                                <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                                  Catatan
                                </p>
                                <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-700">
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
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <AlertTriangle className="mx-auto h-6 w-6 text-slate-300" />
                <p className="mt-2 text-xs font-semibold text-slate-600">
                  Detail bentrok tidak ditemukan
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Status bentrok tersedia dari database, tetapi helper tidak
                  mengembalikan detail jadwal terkait.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
