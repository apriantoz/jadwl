// src/pages/master/RuanganPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  AlertTriangle,
  Edit3,
  Layers3,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
  Save,
} from "lucide-react";
import type { Ruangan, TipeRuang } from "../../../types/master";

export const RuanganPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [ruangList, setRuangList] = useState<Ruangan[]>([]);
  const [tipeRuangList, setTipeRuangList] = useState<TipeRuang[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    nama_ruang: "",
    kapasitas: "",
    tipe_ruang_id: "",
  });

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [ruangRes, tipeRes] = await Promise.all([
        supabase
          .from("ruang")
          .select("*, tipe_ruang(tipe_ruang)")
          .order("id", { ascending: true }),
        supabase
          .from("tipe_ruang")
          .select("*")
          .order("id", { ascending: true }),
      ]);
      if (ruangRes.error) throw ruangRes.error;
      if (tipeRes.error) throw tipeRes.error;
      setRuangList(ruangRes.data || []);
      setTipeRuangList(tipeRes.data || []);
    } catch (err) {
      console.error("Error fetching ruangan:", err);
      setError("Data ruangan gagal dimuat. Silakan coba refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ruangList;
    return ruangList.filter((item) =>
      [
        item.nama_ruang,
        item.tipe_ruang?.tipe_ruang,
        item.kapasitas ? String(item.kapasitas) : "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [ruangList, search]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedId(null);
    setError("");
    setForm({
      nama_ruang: "",
      kapasitas: "",
      tipe_ruang_id: tipeRuangList[0]?.id ? String(tipeRuangList[0].id) : "",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: Ruangan) => {
    setIsEditing(true);
    setSelectedId(item.id);
    setError("");
    setForm({
      nama_ruang: item.nama_ruang || "",
      kapasitas: item.kapasitas ? String(item.kapasitas) : "",
      tipe_ruang_id: item.tipe_ruang_id ? String(item.tipe_ruang_id) : "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        nama_ruang: form.nama_ruang.trim(),
        kapasitas: form.kapasitas ? Number(form.kapasitas) : 0,
        tipe_ruang_id: form.tipe_ruang_id ? Number(form.tipe_ruang_id) : null,
      };

      if (isEditing && selectedId) {
        const { error: updateError } = await supabase
          .from("ruang")
          .update(payload)
          .eq("id", selectedId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("ruang")
          .insert([payload]);
        if (insertError) throw insertError;
      }

      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      console.error("Error saving ruangan:", err);
      setError(err?.message || "Gagal menyimpan data ruangan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Yakin ingin menghapus ruangan ini?")) return;
    setError("");
    try {
      const { error: deleteError } = await supabase
        .from("ruang")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
      await fetchData();
    } catch (err: any) {
      console.error("Error deleting ruangan:", err);
      setError(err?.message || "Gagal menghapus data ruangan.");
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
            Tambah Ruangan
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
                Data Ruangan
              </h2>
              <span className="badge badge-ghost badge-sm font-semibold">
                {filtered.length}
                {search ? ` / ${ruangList.length}` : ""}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-base-content/60">
              Daftar ruangan dan kapasitas yang tersedia.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <label className="input input-bordered input-sm w-full flex items-center gap-2">
              <Search className="h-4 w-4 text-base-content/40 shrink-0" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari ruangan..."
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
                Memuat data ruangan...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-base-200 text-base-content/40">
                <Layers3 className="h-7 w-7" />
              </div>
              <p className="mt-4 font-semibold text-base-content">
                {search ? "Data tidak ditemukan" : "Belum ada data ruangan"}
              </p>
              <p className="mt-1 max-w-sm text-sm leading-5 text-base-content/60">
                {search
                  ? `Tidak ada data yang cocok dengan "${search}".`
                  : "Tambahkan ruangan pertama Anda untuk memulai."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="text-sm">Nama Ruangan</th>
                    <th className="text-sm">Tipe</th>
                    <th className="text-sm">Kapasitas</th>
                    <th className="text-sm text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-base-200/50">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div>
                            <p className=" font-semibold text-base-content">
                              {r.nama_ruang}
                            </p>
                            <p className="text-xs text-base-content/50">
                              ID #{r.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-ghost badge-sm font-medium">
                          {r.tipe_ruang?.tipe_ruang || "-"}
                        </span>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 text-sm text-base-content/70">
                          <Users className="h-3.5 w-3.5 text-base-content/40" />
                          {r.kapasitas ? `${r.kapasitas} kursi` : "-"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(r)}
                            className="btn btn-ghost btn-square btn-sm text-primary hover:bg-primary/10"
                            title="Edit"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
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
            ruangan
            {search && ` dari ${ruangList.length} data`}
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
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {isEditing ? "Perbarui Data" : "Data Baru"}
                </p>
                <h2 className="text-base font-bold text-base-content">
                  {isEditing ? "Edit Ruangan" : "Tambah Ruangan"}
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
                <div className="form-control">
                  <label className="label pt-0 pb-1.5">
                    <span className="label-text text-sm font-semibold text-base-content/80">
                      Nama Ruangan
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lab Komputer A"
                    value={form.nama_ruang}
                    onChange={(e) =>
                      setForm({ ...form, nama_ruang: e.target.value })
                    }
                    className="input input-bordered input-sm w-full text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="form-control">
                    <label className="label pt-0 pb-1.5">
                      <span className="label-text text-sm font-semibold text-base-content/80">
                        Tipe Ruang
                      </span>
                    </label>
                    <select
                      required
                      value={form.tipe_ruang_id}
                      onChange={(e) =>
                        setForm({ ...form, tipe_ruang_id: e.target.value })
                      }
                      className="select select-bordered select-sm w-full text-sm"
                    >
                      <option value="" disabled>
                        -- Pilih Tipe --
                      </option>
                      {tipeRuangList.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.tipe_ruang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label pt-0 pb-1.5">
                      <span className="label-text text-sm font-semibold text-base-content/80">
                        Kapasitas Kursi
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="30"
                      value={form.kapasitas}
                      onChange={(e) =>
                        setForm({ ...form, kapasitas: e.target.value })
                      }
                      className="input input-bordered input-sm w-full text-sm"
                    />
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
