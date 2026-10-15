// src/pages/master/MataKuliahPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  AlertTriangle,
  BookOpen,
  Edit3,
  Layers3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  Save,
} from "lucide-react";
import type { SemesterItem, MataKuliah } from "../../../types/master";

interface ProdiItem {
  id: number;
  kode_prodi: string;
  nama_prodi: string;
}

export const MataKuliahPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [mkList, setMkList] = useState<MataKuliah[]>([]);
  const [prodiList, setProdiList] = useState<ProdiItem[]>([]);
  const [semesterList, setSemesterList] = useState<SemesterItem[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    kode_mk: "",
    nama_mk: "",
    sks: "2",
    smt_id: "",
    prodi_id: "",
  });

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [mkRes, prodiRes, smtRes] = await Promise.all([
        supabase
          .from("mk")
          .select("*, prodi(nama_prodi), semester(semester)")
          .order("id", { ascending: true }),
        supabase.from("prodi").select("*").order("id", { ascending: true }),
        supabase.from("semester").select("*").order("id", { ascending: true }),
      ]);

      if (mkRes.error) throw mkRes.error;
      if (prodiRes.error) throw prodiRes.error;
      if (smtRes.error) throw smtRes.error;

      setMkList(mkRes.data || []);
      setProdiList(prodiRes.data || []);
      setSemesterList(smtRes.data || []);
    } catch (err) {
      console.error("Error fetching mata kuliah:", err);
      setError("Data mata kuliah gagal dimuat. Silakan coba refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mkList;
    return mkList.filter((item) =>
      [
        item.kode_mk,
        item.nama_mk,
        item.semester?.semester,
        item.prodi?.nama_prodi,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [mkList, search]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedId(null);
    setError("");
    setForm({
      kode_mk: "",
      nama_mk: "",
      sks: "2",
      smt_id: semesterList[0]?.id ? String(semesterList[0].id) : "",
      prodi_id: prodiList[0]?.id ? String(prodiList[0].id) : "",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: MataKuliah) => {
    setIsEditing(true);
    setSelectedId(item.id);
    setError("");
    setForm({
      kode_mk: item.kode_mk || "",
      nama_mk: item.nama_mk || "",
      sks: String(item.sks || 2),
      smt_id: item.smt_id ? String(item.smt_id) : "",
      prodi_id: item.prodi_id ? String(item.prodi_id) : "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        kode_mk: form.kode_mk.trim(),
        nama_mk: form.nama_mk.trim(),
        sks: Number(form.sks),
        smt_id: form.smt_id ? Number(form.smt_id) : null,
        prodi_id: form.prodi_id ? Number(form.prodi_id) : null,
      };

      if (isEditing && selectedId) {
        const { error: updateError } = await supabase
          .from("mk")
          .update(payload)
          .eq("id", selectedId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("mk")
          .insert([payload]);
        if (insertError) throw insertError;
      }

      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      console.error("Error saving mata kuliah:", err);
      setError(err?.message || "Gagal menyimpan data mata kuliah.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Yakin ingin menghapus mata kuliah ini?")) return;
    setError("");
    try {
      const { error: deleteError } = await supabase
        .from("mk")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
      await fetchData();
    } catch (err: any) {
      console.error("Error deleting mata kuliah:", err);
      setError(err?.message || "Gagal menghapus data mata kuliah.");
    }
  };

  return (
    <>
      {/* Toolbar */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end mb-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="btn btn-sm h-10 border border-base-300 bg-base-100 px-3.5  font-semibold text-base-content/70 shadow-sm hover:bg-base-200 disabled:opacity-60"
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn btn-sm btn-primary h-10 gap-2 px-4  font-semibold text-white shadow-sm shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            Tambah Mata Kuliah
          </button>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="alert alert-error mb-5 text-sm font-medium py-3"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="btn btn-ghost btn-xs btn-square ml-auto"
            title="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Content */}
      <section className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
        <div className="card-body p-4 sm:p-5 border-b border-base-200 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="card-title  font-bold text-base-content">
                Data Mata Kuliah
              </h2>
              <span className="badge badge-ghost badge-sm font-semibold">
                {filtered.length}
                {search ? ` / ${mkList.length}` : ""}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-base-content/60">
              Daftar mata kuliah beserta semester dan program studi.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <label className="input input-bordered input-sm w-full flex items-center gap-2">
              <Search className="h-4 w-4 text-base-content/40 shrink-0" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari mata kuliah..."
                className="grow border-0 bg-transparent focus:outline-none text-sm"
              />
            </label>
          </div>
        </div>

        <div className="card-body p-0 min-h-90 flex flex-col justify-center">
          {loading ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center">
              <span className="loading loading-spinner loading-md text-primary"></span>
              <p className="mt-3  font-semibold text-base-content/70">
                Memuat data mata kuliah...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-base-200 text-base-content/40">
                <Layers3 className="h-7 w-7" />
              </div>
              <p className="mt-4 font-semibold text-base-content">
                {search ? "Data tidak ditemukan" : "Belum ada data mata kuliah"}
              </p>
              <p className="mt-1 max-w-sm text-sm leading-5 text-base-content/60">
                {search
                  ? `Tidak ada data yang cocok dengan "${search}".`
                  : "Tambahkan mata kuliah pertama Anda untuk memulai."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="text-sm">Kode MK</th>
                    <th className="text-sm">Mata Kuliah</th>
                    <th className="text-sm">SKS</th>
                    <th className="text-sm">Semester</th>
                    <th className="text-sm">Program Studi</th>
                    <th className="text-sm text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200">
                  {filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-base-200/50">
                      <td>
                        <span className="badge badge-primary badge-soft badge-sm font-mono font-semibold">
                          {m.kode_mk || "-"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className=" font-semibold text-base-content">
                              {m.nama_mk}
                            </p>
                            <p className="text-xs text-base-content/50">
                              {m.prodi?.nama_prodi}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-base-content/80">
                          {m.sks} SKS
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-ghost badge-sm font-medium">
                          {m.semester?.semester || "-"}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm text-base-content/70">
                          {m.prodi?.nama_prodi || "-"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(m)}
                            className="btn btn-ghost btn-square btn-sm text-primary hover:bg-primary/10"
                            title="Edit"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(m.id)}
                            className="btn btn-ghost btn-square btn-sm text-error hover:bg-error/10"
                            title="Hapus"
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

        {!loading && filtered.length > 0 && (
          <div className="border-t border-base-200 bg-base-200/40 px-5 py-3 text-sm text-base-content/60">
            Menampilkan{" "}
            <span className="font-semibold text-base-content">
              {filtered.length}
            </span>{" "}
            mata kuliah
            {search && ` dari ${mkList.length} data`}
          </div>
        )}
      </section>

      {/* Modal */}
      {showModal && (
        <div
          className="modal modal-open bg-base-950/50 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !submitting)
              setShowModal(false);
          }}
        >
          <div className="modal-box max-w-lg bg-base-100 p-0 shadow-2xl border border-base-200">
            <div className="flex items-center justify-between border-b border-base-200 px-6 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  {isEditing ? "Perbarui Data" : "Data Baru"}
                </p>
                <h2 className="text-base font-bold text-base-content">
                  {isEditing ? "Edit Mata Kuliah" : "Tambah Mata Kuliah"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn btn-ghost btn-sm btn-square text-base-content/60 hover:bg-base-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 px-6 py-5 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="form-control">
                    <label className="label pt-0 pb-1.5">
                      <span className="label-text text-sm font-semibold text-base-content/80">
                        Kode MK
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="ANIM101"
                      value={form.kode_mk}
                      onChange={(e) =>
                        setForm({ ...form, kode_mk: e.target.value })
                      }
                      className="input input-bordered input-sm w-full text-sm uppercase"
                    />
                  </div>

                  <div className="form-control sm:col-span-2">
                    <label className="label pt-0 pb-1.5">
                      <span className="label-text text-sm font-semibold text-base-content/80">
                        Nama Mata Kuliah
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Animasi 2D"
                      value={form.nama_mk}
                      onChange={(e) =>
                        setForm({ ...form, nama_mk: e.target.value })
                      }
                      className="input input-bordered input-sm w-full text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="form-control">
                    <label className="label pt-0 pb-1.5">
                      <span className="label-text text-sm font-semibold text-base-content/80">
                        Jumlah SKS
                      </span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="6"
                      value={form.sks}
                      onChange={(e) =>
                        setForm({ ...form, sks: e.target.value })
                      }
                      className="input input-bordered input-sm w-full text-sm"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label pt-0 pb-1.5">
                      <span className="label-text text-sm font-semibold text-base-content/80">
                        Semester
                      </span>
                    </label>
                    <select
                      required
                      value={form.smt_id}
                      onChange={(e) =>
                        setForm({ ...form, smt_id: e.target.value })
                      }
                      className="select select-bordered select-sm w-full text-sm"
                    >
                      <option value="" disabled>
                        -- Pilih --
                      </option>
                      {semesterList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.semester || `Semester ${s.id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label pt-0 pb-1.5">
                      <span className="label-text text-sm font-semibold text-base-content/80">
                        Program Studi
                      </span>
                    </label>
                    <select
                      required
                      value={form.prodi_id}
                      onChange={(e) =>
                        setForm({ ...form, prodi_id: e.target.value })
                      }
                      className="select select-bordered select-sm w-full text-sm"
                    >
                      <option value="" disabled>
                        -- Pilih --
                      </option>
                      {prodiList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.kode_prodi ? `${p.kode_prodi} - ` : ""}
                          {p.nama_prodi}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-base-200 bg-base-200/50 px-6 py-3.5 modal-action mt-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-sm btn-ghost border border-base-300 font-semibold text-base-content/70"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-sm btn-primary gap-2 text-white"
                >
                  {submitting ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Simpan Data
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
