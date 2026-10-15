// src/pages/MasterSemesterPage.tsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import type { MasterSemester } from "../../../types/master";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  Loader2,
  RefreshCw,
  CalendarDays,
  Search,
  Sparkles,
  GraduationCap,
  X,
  Info,
} from "lucide-react";

type SemesterFormData = {
  tipe_semester: string;
  tahun_ajaran: string;
  is_active: boolean;
};

export const MasterSemesterPage: React.FC = () => {
  const [list, setList] = useState<MasterSemester[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const currentYear = new Date().getFullYear();

  const [tahunAwal, setTahunAwal] = useState<number | string>(currentYear);

  const [formData, setFormData] = useState<SemesterFormData>({
    tipe_semester: "Ganjil",
    tahun_ajaran: `${currentYear}/${currentYear + 1}`,
    is_active: false,
  });

  const [submitting, setSubmitting] = useState(false);

  // Pesan error untuk ditampilkan kepada pengguna.
  const [errorMessage, setErrorMessage] = useState("");

  // Mengambil data semester dari Supabase.
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("master_semester")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        throw error;
      }

      setList((data ?? []) as MasterSemester[]);
    } catch (error) {
      console.error("Gagal mengambil data semester:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data semester.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Filter pencarian semester dan tahun ajaran.
  const filteredList = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return list;
    }

    return list.filter(
      (item) =>
        item.tipe_semester?.toLowerCase().includes(keyword) ||
        item.tahun_ajaran?.toLowerCase().includes(keyword),
    );
  }, [list, search]);

  // Semester yang sedang aktif.
  const activeSemester = useMemo(
    () => list.find((item) => item.is_active),
    [list],
  );

  const ganjilCount = useMemo(
    () => list.filter((item) => item.tipe_semester === "Ganjil").length,
    [list],
  );

  const genapCount = useMemo(
    () => list.filter((item) => item.tipe_semester === "Genap").length,
    [list],
  );

  // Mengubah status aktif semester.
  // Hanya satu semester yang boleh aktif pada satu waktu.
  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    setErrorMessage("");

    try {
      if (!currentStatus) {
        // Nonaktifkan semester lainnya terlebih dahulu.
        const { error: deactivateError } = await supabase
          .from("master_semester")
          .update({ is_active: false })
          .neq("id", id);

        if (deactivateError) {
          throw deactivateError;
        }
      }

      const { error } = await supabase
        .from("master_semester")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) {
        throw error;
      }

      await fetchData();
    } catch (error) {
      console.error("Gagal mengubah status semester:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengubah status semester.",
      );
    }
  };

  // Membentuk tahun ajaran dari tahun awal.
  const handleTahunAwalChange = (year: number | string) => {
    setTahunAwal(year);

    const numYear = Number(year);

    if (
      String(year).trim() !== "" &&
      Number.isInteger(numYear) &&
      numYear >= 2000 &&
      numYear <= 2099
    ) {
      setFormData((prev) => ({
        ...prev,
        tahun_ajaran: `${numYear}/${numYear + 1}`,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        tahun_ajaran: "",
      }));
    }
  };

  // Mengembalikan formulir ke kondisi awal.
  const resetForm = () => {
    const year = new Date().getFullYear();

    setIsEditing(false);
    setSelectedId(null);
    setTahunAwal(year);

    setFormData({
      tipe_semester: "Ganjil",
      tahun_ajaran: `${year}/${year + 1}`,
      is_active: false,
    });

    setErrorMessage("");
  };

  // Membuka modal tambah.
  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Membuka modal edit.
  const openEditModal = (item: MasterSemester) => {
    const initialYear = item.tahun_ajaran
      ? item.tahun_ajaran.split("/")[0]
      : String(new Date().getFullYear());

    setIsEditing(true);
    setSelectedId(item.id);
    setTahunAwal(initialYear);

    setFormData({
      tipe_semester: item.tipe_semester,
      tahun_ajaran: item.tahun_ajaran,
      is_active: item.is_active,
    });

    setErrorMessage("");
    setShowModal(true);
  };

  // Menyimpan semester baru atau perubahan semester.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    const numYear = Number(tahunAwal);

    if (
      String(tahunAwal).trim() === "" ||
      !Number.isInteger(numYear) ||
      numYear < 2000 ||
      numYear > 2099 ||
      !formData.tahun_ajaran
    ) {
      setErrorMessage("Tahun ajaran tidak valid. Masukkan tahun 2000–2099.");
      return;
    }

    if (isEditing && selectedId === null) {
      setErrorMessage("ID semester tidak ditemukan.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      // Jika semester akan diaktifkan, nonaktifkan semester lainnya.
      if (formData.is_active) {
        let deactivateQuery = supabase
          .from("master_semester")
          .update({ is_active: false });

        if (selectedId !== null) {
          deactivateQuery = deactivateQuery.neq("id", selectedId);
        }

        const { error: deactivateError } = await deactivateQuery;

        if (deactivateError) {
          throw deactivateError;
        }
      }

      if (isEditing && selectedId !== null) {
        const { error } = await supabase
          .from("master_semester")
          .update(formData)
          .eq("id", selectedId);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("master_semester")
          .insert([formData]);

        if (error) {
          throw error;
        }
      }

      setShowModal(false);
      resetForm();

      await fetchData();
    } catch (error) {
      console.error("Gagal menyimpan semester:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan semester. Silakan coba lagi.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Menghapus semester.
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Hapus master semester ini? Tindakan ini tidak dapat dibatalkan.",
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("master_semester")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      await fetchData();
    } catch (error) {
      console.error("Gagal menghapus semester:", error);

      setErrorMessage(
        error instanceof Error ? error.message : "Gagal menghapus semester.",
      );
    }
  };

  return (
    <div>
      <div>
        {/* Header */}
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <GraduationCap className="h-4 w-4" />
              </span>
              Administrasi Akademik
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-base-content">
              Master Semester
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-base-content/60">
              Atur periode semester dan tentukan semester yang sedang aktif
              untuk operasional akademik.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchData()}
              disabled={loading}
              title="Refresh data"
              className="btn btn-sm h-10 border border-base-300 bg-base-100 px-3.5 text-sm font-semibold text-base-content/70 shadow-sm hover:bg-base-200"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="btn btn-sm btn-primary h-10 gap-2 px-4 text-sm font-semibold text-white shadow-sm shadow-primary/20"
            >
              <Plus className="h-4 w-4" />
              Tambah Semester
            </button>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div
            role="alert"
            className="alert alert-error mb-6 text-xs font-medium py-3"
          >
            <Info className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body p-3.5 flex flex-row items-start justify-between">
              <div>
                <p className="text-[11px] font-medium text-base-content/60">
                  Semester Aktif
                </p>
                <p className="mt-1 text-sm font-bold text-base-content truncate">
                  {activeSemester?.tipe_semester || "Belum ada"}
                </p>
                <p className="mt-0.5 text-xs text-base-content/50">
                  {activeSemester?.tahun_ajaran || "Belum ditentukan"}
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body p-3.5 flex flex-row items-start justify-between">
              <div>
                <p className="text-[11px] font-medium text-base-content/60">
                  Total Semester
                </p>
                <p className="mt-1 text-xl font-bold text-base-content">
                  {list.length}
                </p>
                <p className="mt-0.5 text-xs text-base-content/50">
                  Periode tersimpan
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-base-200 text-base-content/60">
                <CalendarDays className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body p-3.5 flex flex-row items-start justify-between">
              <div>
                <p className="text-[11px] font-medium text-base-content/60">
                  Semester Ganjil
                </p>
                <p className="mt-1 text-xl font-bold text-base-content">
                  {ganjilCount}
                </p>
                <p className="mt-0.5 text-xs text-base-content/50">
                  Periode tersimpan
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <Circle className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body p-3.5 flex flex-row items-start justify-between">
              <div>
                <p className="text-[11px] font-medium text-base-content/60">
                  Semester Genap
                </p>
                <p className="mt-1 text-xl font-bold text-base-content">
                  {genapCount}
                </p>
                <p className="mt-0.5 text-xs text-base-content/50">
                  Periode tersimpan
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10 text-success">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Active semester highlight */}
        <div className="card bg-base-100 border border-base-200 mb-6 shadow-sm">
          <div className="card-body p-4 sm:p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-base-content/60">
                  Periode Perkuliahan Saat Ini
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-base sm:text-lg font-bold text-base-content">
                    {activeSemester
                      ? `${activeSemester.tipe_semester} · ${activeSemester.tahun_ajaran}`
                      : "Belum ada semester aktif"}
                  </span>

                  {activeSemester && (
                    <div className="badge badge-success badge-sm gap-1 font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-success-content" />
                      AKTIF
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-base-200/50 px-3 py-2 text-xs text-base-content/70">
              <Info className="h-4 w-4 shrink-0 text-base-content/40" />
              <span>Hanya satu semester yang dapat aktif pada satu waktu.</span>
            </div>
          </div>
        </div>

        {/* Main table card */}
        <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
          <div className="card-body p-4 sm:p-5 border-b border-base-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="card-title text-sm font-bold text-base-content">
                Daftar Semester
              </h2>
              <p className="mt-0.5 text-xs text-base-content/60">
                Kelola periode akademik yang tersedia di sistem.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <label className="input input-bordered input-sm w-full flex items-center gap-2">
                <Search className="h-4 w-4 text-base-content/40 shrink-0" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari semester atau tahun..."
                  className="grow border-0 bg-transparent focus:outline-none text-xs"
                />
              </label>
            </div>
          </div>

          <div className="card-body p-0">
            {loading ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center">
                <span className="loading loading-spinner loading-md text-primary"></span>
                <p className="mt-3 text-sm font-semibold text-base-content/70">
                  Memuat data semester...
                </p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center py-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-base-200 text-base-content/40">
                  <CalendarDays className="h-7 w-7" />
                </div>
                <p className="mt-4 font-semibold text-base-content">
                  {search
                    ? "Semester tidak ditemukan"
                    : "Belum ada master semester"}
                </p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-base-content/60">
                  {search
                    ? "Coba gunakan kata kunci atau tahun ajaran yang berbeda."
                    : "Tambahkan periode semester pertama untuk mulai mengatur kalender akademik."}
                </p>

                {!search && (
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="btn btn-primary btn-sm mt-4 gap-2 text-xs"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Semester
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="text-xs">Semester</th>
                      <th className="text-xs">Tahun Ajaran</th>
                      <th className="text-xs">Status</th>
                      <th className="text-xs text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((item) => (
                      <tr key={item.id} className="hover:bg-base-200/50">
                        <td>
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                item.tipe_semester === "Ganjil"
                                  ? "bg-warning/10 text-warning"
                                  : "bg-success/10 text-success"
                              }`}
                            >
                              <CalendarDays className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-base-content">
                                Semester {item.tipe_semester}
                              </p>
                              <p className="text-[10px] text-base-content/50">
                                ID #{item.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="badge badge-ghost badge-sm font-semibold">
                            {item.tahun_ajaran}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            onClick={() =>
                              void handleToggleActive(item.id, item.is_active)
                            }
                            title={
                              item.is_active
                                ? "Klik untuk menonaktifkan"
                                : "Klik untuk mengaktifkan"
                            }
                            className={`badge badge-sm gap-1.5 font-bold cursor-pointer ${
                              item.is_active
                                ? "badge-success"
                                : "badge-ghost text-base-content/50"
                            }`}
                          >
                            {item.is_active ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <Circle className="h-3 w-3" />
                            )}
                            {item.is_active ? "Aktif" : "Tidak Aktif"}
                          </button>
                        </td>

                        <td>
                          <div className="flex justify-end gap-0.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="btn btn-ghost btn-square btn-sm text-primary hover:bg-primary/10"
                              title="Edit semester"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleDelete(item.id)}
                              className="btn btn-ghost btn-square btn-sm text-error hover:bg-error/10"
                              title="Hapus semester"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loading && filteredList.length > 0 && (
            <div className="px-5 py-3 border-t border-base-200 text-xs text-base-content/60">
              Menampilkan{" "}
              <span className="font-semibold text-base-content">
                {filteredList.length}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-base-content">
                {list.length}
              </span>{" "}
              semester
            </div>
          )}
        </div>
      </div>

      {/* Modal tambah/edit */}
      {showModal && (
        <div
          className="modal modal-open bg-base-950/50 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !submitting) {
              setShowModal(false);
            }
          }}
        >
          <div className="modal-box max-w-lg bg-base-100 p-0 shadow-2xl border border-base-200">
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
                    {isEditing
                      ? "Edit Master Semester"
                      : "Tambah Master Semester"}
                  </h2>
                  <p className="text-xs text-base-content/60">
                    Tentukan tipe semester, tahun ajaran, dan status aktif.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !submitting && setShowModal(false)}
                disabled={submitting}
                className="btn btn-ghost btn-sm btn-square text-base-content/60 hover:bg-base-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 px-6 py-5 max-h-[70vh] overflow-y-auto">
                {errorMessage && (
                  <div
                    role="alert"
                    className="alert alert-error text-xs font-medium py-2.5"
                  >
                    <Info className="h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Tipe semester */}
                <div className="form-control">
                  <label className="label pt-0 pb-1.5">
                    <span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/70">
                      Tipe Semester
                    </span>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {(["Ganjil", "Genap"] as const).map((type) => {
                      const selected = formData.tipe_semester === type;

                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              tipe_semester: type,
                            }))
                          }
                          className={`rounded-xl border p-3 text-left transition ${
                            selected
                              ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                              : "border-base-300 bg-base-100 hover:border-base-content/30 hover:bg-base-200/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold ${
                                selected ? "text-primary" : "text-base-content"
                              }`}
                            >
                              {type}
                            </span>
                            <span
                              className={`h-2 w-2 rounded-full ${
                                type === "Ganjil" ? "bg-warning" : "bg-success"
                              }`}
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-base-content/50">
                            Semester {type.toLowerCase()}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tahun ajaran */}
                <div className="form-control">
                  <label htmlFor="tahun_awal" className="label pt-0 pb-1.5">
                    <span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/70">
                      Tahun Ajaran
                    </span>
                  </label>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <input
                      id="tahun_awal"
                      type="number"
                      required
                      min={2000}
                      max={2099}
                      step={1}
                      placeholder="2026"
                      value={tahunAwal}
                      onChange={(e) => handleTahunAwalChange(e.target.value)}
                      className="input input-bordered input-sm w-full text-xs font-semibold"
                    />

                    <span className="text-sm font-bold text-base-content/30">
                      /
                    </span>

                    <div className="flex h-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 px-3">
                      <span className="text-xs font-bold text-primary">
                        {formData.tahun_ajaran
                          ? formData.tahun_ajaran.split("/")[1] || "—"
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <p className="mt-1 text-[10px] text-base-content/50">
                    Tahun berikutnya dibuat otomatis. Contoh: 2026 → 2026/2027.
                  </p>
                </div>

                {/* Status aktif */}
                <div className="rounded-xl border border-base-200 bg-base-200/40 p-3.5">
                  <label className="label cursor-pointer justify-start gap-3 p-0">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_active: e.target.checked,
                        }))
                      }
                      className="checkbox checkbox-primary checkbox-sm"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-base-content">
                        Set sebagai Semester Aktif
                      </span>
                      <span className="block text-[10px] text-base-content/60">
                        Digunakan sebagai periode utama operasional akademik.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Tombol modal */}
              <div className="flex justify-end gap-2 border-t border-base-200 bg-base-200/50 px-6 py-3.5 modal-action mt-0">
                <button
                  type="button"
                  onClick={() => !submitting && setShowModal(false)}
                  disabled={submitting}
                  className="btn btn-sm btn-ghost border border-base-300 font-semibold text-base-content/70"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-sm btn-primary gap-2 text-white"
                >
                  {submitting && (
                    <span className="loading loading-spinner loading-xs"></span>
                  )}
                  {submitting
                    ? "Menyimpan..."
                    : isEditing
                      ? "Simpan Perubahan"
                      : "Simpan Semester"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterSemesterPage;
