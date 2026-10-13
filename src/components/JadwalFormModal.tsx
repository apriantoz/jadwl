import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Edit,
  Plus,
  Save,
  Search,
  X,
} from "lucide-react";
import { DAYS } from "../types/constants";
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
  activeSemesterId: number | null;
  activeSemesterName: string;
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
  activeSemesterId,
  activeSemesterName,
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
      className="modal modal-open bg-base-950/50 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="modal-box max-w-2xl border border-base-200 bg-base-100 p-0 shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-base-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {isEditing ? (
                <Edit className="h-5 w-5" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
            </div>

            <div>
              <h2 className="text-base font-bold text-base-content">
                {isEditing ? "Edit Jadwal" : "Tambah Jadwal Baru"}
              </h2>
              <p className="text-xs text-base-content/60">
                Atur mata kuliah, ruang, waktu, dan semester.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="btn btn-ghost btn-sm btn-square text-base-content/60 hover:bg-base-200"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
            {formError && (
              <div
                role="alert"
                className="alert alert-error mb-4 py-3 text-xs font-medium"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* INFORMASI AKADEMIK */}
            <div className="mb-5">
              <h3 className="text-sm font-bold text-base-content">
                Informasi Akademik
              </h3>
              <p className="mt-0.5 text-xs text-base-content/60">
                Pilih mata kuliah, ruangan, dan semester aktif.
              </p>
            </div>

            {/* MATA KULIAH */}
            <div className="form-control mb-4">
              <label className="label pb-1.5 pt-0">
                <span className="label-text text-xs font-semibold text-base-content/80">
                  Mata Kuliah
                </span>
              </label>

              <div className="relative">
                <label className="input w-full">
                  <Search className="text-base-content/40" />

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
                    className="input"
                  />

                  <ChevronDown
                    className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40 transition ${
                      mkOpen ? "rotate-180" : ""
                    }`}
                  />
                </label>

                {mkOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Tutup daftar mata kuliah"
                      className="fixed inset-0 z-10 cursor-default"
                      onClick={() => setMkOpen(false)}
                    />

                    <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-base-200 bg-base-100 p-1.5 shadow-xl">
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
                            className={`w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-primary/10 ${
                              String(option.id) === formData.mk_id
                                ? "bg-primary/10 font-semibold text-primary"
                                : "text-base-content"
                            }`}
                          >
                            {option.nama}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-xs text-base-content/40">
                          Mata kuliah tidak ditemukan.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* RUANGAN DAN SEMESTER AKTIF */}
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="form-control">
                <label className="label pb-1.5 pt-0">
                  <span className="label-text text-xs font-semibold text-base-content/80">
                    Ruangan
                  </span>
                </label>

                <select
                  required
                  disabled={submitting}
                  value={formData.ruang_id}
                  onChange={(e) => set("ruang_id", e.target.value)}
                  className="select w-full"
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

              <div className="form-control">
                <label className="label pb-1.5 pt-0">
                  <span className="label-text text-xs font-semibold text-base-content/80">
                    Semester Aktif
                  </span>
                </label>

                <select
                  required
                  disabled={activeSemesterId === null || submitting}
                  value={
                    activeSemesterId !== null ? String(activeSemesterId) : ""
                  }
                  onChange={(e) => set("master_semester_id", e.target.value)}
                  className="select w-full"
                >
                  {activeSemesterId !== null ? (
                    <option value={String(activeSemesterId)}>
                      {activeSemesterName}
                    </option>
                  ) : (
                    <option value="">Belum ada semester aktif</option>
                  )}
                </select>

                {activeSemesterId === null && (
                  <p className="mt-1 text-xs text-error">
                    Aktifkan semester terlebih dahulu sebelum menambah jadwal.
                  </p>
                )}
              </div>
            </div>

            {/* WAKTU PERKULIAHAN */}
            <div className="mb-5 border-t border-base-200 pt-5">
              <h3 className="text-sm font-bold text-base-content">
                Waktu Perkuliahan
              </h3>
              <p className="mt-0.5 text-xs text-base-content/60">
                Tentukan hari dan rentang waktu.
              </p>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="form-control">
                <label className="label pb-1.5 pt-0">
                  <span className="label-text text-xs font-semibold text-base-content/80">
                    Hari
                  </span>
                </label>

                <select
                  required
                  disabled={submitting}
                  value={formData.hari}
                  onChange={(e) => set("hari", e.target.value)}
                  className="select w-full"
                >
                  {DAYS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label pb-1.5 pt-0">
                  <span className="label-text text-xs font-semibold text-base-content/80">
                    Jam Mulai
                  </span>
                </label>

                <input
                  required
                  disabled={submitting}
                  type="time"
                  value={formData.jam_mulai}
                  onChange={(e) => set("jam_mulai", e.target.value)}
                  className="input w-full"
                />
              </div>

              <div className="form-control">
                <label className="label pb-1.5 pt-0">
                  <span className="label-text text-xs font-semibold text-base-content/80">
                    Jam Selesai
                  </span>
                </label>

                <input
                  required
                  disabled={submitting}
                  type="time"
                  value={formData.jam_selesai}
                  onChange={(e) => set("jam_selesai", e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>

            {/* CATATAN */}
            <div className="form-control border-t border-base-200 pt-5">
              <label className="label pb-1.5 pt-0">
                <span className="label-text text-xs font-semibold text-base-content/80">
                  Catatan{" "}
                  <span className="font-normal text-base-content/40">
                    (opsional)
                  </span>
                </span>
              </label>

              <textarea
                rows={3}
                disabled={submitting}
                value={formData.catatan}
                onChange={(e) => set("catatan", e.target.value)}
                placeholder="Tambahkan informasi tambahan..."
                className="textarea w-full resize-none"
              />
            </div>
          </div>

          {/* FOOTER MODAL */}
          <div className="modal-action mt-0 flex justify-end gap-2 border-t border-base-200 bg-base-200/50 px-6 py-4">
            <button
              type="button"
              onClick={() => !submitting && onClose()}
              disabled={submitting}
              className="btn btn-sm btn-ghost border border-base-300 font-semibold text-base-content/70"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={submitting || activeSemesterId === null}
              className="btn btn-sm btn-primary gap-2 text-white"
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
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
