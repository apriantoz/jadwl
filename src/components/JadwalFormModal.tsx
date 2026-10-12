import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Edit,
  Loader2,
  Plus,
  Save,
  Search,
  X,
} from "lucide-react";
import { DAYS, INPUT_CLASS } from "../types/constants";
import type { DropdownOption } from "../types/types";

export interface JadwalFormValues {
  mk_id: string;
  ruang_id: string;
  master_semester_id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  catatan: string;
}

interface Props {
  open: boolean;
  isEditing: boolean;
  submitting: boolean;
  formError: string;
  formData: JadwalFormValues;
  mkOptions: DropdownOption[];
  ruangOptions: DropdownOption[];
  semesterOptions: DropdownOption[];
  onChange: (next: JadwalFormValues) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export const JadwalFormModal: React.FC<Props> = ({
  open,
  isEditing,
  submitting,
  formError,
  formData,
  mkOptions,
  ruangOptions,
  semesterOptions,
  onChange,
  onSubmit,
  onClose,
}) => {
  const [mkSearch, setMkSearch] = useState("");
  const [mkOpen, setMkOpen] = useState(false);

  const selectedMk = useMemo(
    () => mkOptions.find((o) => String(o.id) === formData.mk_id),
    [mkOptions, formData.mk_id],
  );

  const filteredMkOptions = useMemo(
    () =>
      mkOptions.filter((o) =>
        o.nama.toLowerCase().includes(mkSearch.toLowerCase()),
      ),
    [mkOptions, mkSearch],
  );

  if (!open) return null;

  const set = <K extends keyof JadwalFormValues>(
    key: K,
    value: JadwalFormValues[K],
  ) => onChange({ ...formData, [key]: value });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              {isEditing ? (
                <Edit className="h-5 w-5" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? "Edit Jadwal" : "Tambah Jadwal Baru"}
              </h2>
              <p className="text-xs text-slate-400">
                Atur mata kuliah, ruang, waktu, dan semester.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
            {formError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="mb-5">
              <h3 className="text-sm font-bold text-slate-800">
                Informasi Akademik
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Pilih mata kuliah, ruangan, dan semester.
              </p>
            </div>

            {/* MK SEARCH */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Mata Kuliah
              </label>
              <div className="relative">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    autoComplete="off"
                    value={mkOpen ? mkSearch : selectedMk?.nama || ""}
                    onFocus={() => {
                      setMkOpen(true);
                      setMkSearch(selectedMk?.nama || "");
                    }}
                    onChange={(e) => {
                      const value = e.target.value;
                      setMkSearch(value);
                      setMkOpen(true);
                      if (selectedMk && value !== selectedMk.nama) {
                        set("mk_id", "");
                      }
                    }}
                    placeholder="Cari mata kuliah..."
                    className={`${INPUT_CLASS} pl-9 pr-9`}
                  />
                  <ChevronDown
                    className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition ${
                      mkOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {mkOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-10 cursor-default"
                      onClick={() => setMkOpen(false)}
                    />
                    <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                      {filteredMkOptions.length > 0 ? (
                        filteredMkOptions.map((option) => (
                          <button
                            type="button"
                            key={option.id}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              set("mk_id", String(option.id));
                              setMkSearch(option.nama);
                              setMkOpen(false);
                            }}
                            className={`w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-indigo-50 ${
                              String(option.id) === formData.mk_id
                                ? "bg-indigo-50 font-semibold text-indigo-700"
                                : "text-slate-700"
                            }`}
                          >
                            {option.nama}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-xs text-slate-400">
                          Mata kuliah tidak ditemukan.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* RUANG + SEMESTER */}
            <div className="mb-5 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Ruangan
                </label>
                <select
                  required
                  value={formData.ruang_id}
                  onChange={(e) => set("ruang_id", e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="" disabled>
                    -- Pilih Ruang --
                  </option>
                  {ruangOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Semester
                </label>
                <select
                  required
                  value={formData.master_semester_id}
                  onChange={(e) => set("master_semester_id", e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="" disabled>
                    -- Pilih Semester --
                  </option>
                  {semesterOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* WAKTU */}
            <div className="mb-5 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-bold text-slate-800">
                Waktu Perkuliahan
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Tentukan hari dan rentang waktu.
              </p>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Hari
                </label>
                <select
                  value={formData.hari}
                  onChange={(e) => set("hari", e.target.value)}
                  className={INPUT_CLASS}
                >
                  {DAYS.map((day) => (
                    <option key={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Jam Mulai
                </label>
                <input
                  required
                  type="time"
                  value={formData.jam_mulai}
                  onChange={(e) => set("jam_mulai", e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Jam Selesai
                </label>
                <input
                  required
                  type="time"
                  value={formData.jam_selesai}
                  onChange={(e) => set("jam_selesai", e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            {/* CATATAN */}
            <div className="border-t border-slate-100 pt-5">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Catatan{" "}
                <span className="font-normal text-slate-400">(opsional)</span>
              </label>
              <textarea
                rows={3}
                value={formData.catatan}
                onChange={(e) => set("catatan", e.target.value)}
                placeholder="Tambahkan informasi tambahan..."
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
            <button
              type="button"
              onClick={() => !submitting && onClose()}
              disabled={submitting}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditing ? "Simpan Perubahan" : "Tambah Jadwal"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
