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
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Ruangan
          </button>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="ml-auto rounded-md p-0.5 hover:bg-red-100"
            title="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Content */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm mt-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900">Data Ruangan</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                {filtered.length}
                {search ? ` / ${ruangList.length}` : ""}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Daftar ruangan dan kapasitas yang tersedia.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ruangan..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-80 flex-col items-center justify-center text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
            <p className="mt-3 text-sm">Memuat data ruangan...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
              <Layers3 className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              {search ? "Data tidak ditemukan" : "Belum ada data ruangan"}
            </p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
              {search
                ? `Tidak ada data yang cocok dengan "${search}".`
                : "Tambahkan ruangan pertama Anda untuk memulai."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70">
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3.5">Nama Ruangan</th>
                  <th className="px-6 py-3.5">Tipe</th>
                  <th className="px-6 py-3.5">Kapasitas</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="transition hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {r.nama_ruang}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            ID #{r.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {r.tipe_ruang?.tipe_ruang || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-600">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {r.kapasitas ? `${r.kapasitas} kursi` : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(r)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3">
            <p className="text-xs text-slate-400">
              Menampilkan{" "}
              <span className="font-semibold text-slate-600">
                {filtered.length}
              </span>{" "}
              ruangan
              {search && ` dari ${ruangList.length} data`}
            </p>
          </div>
        )}
      </section>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  {isEditing ? "Perbarui Data" : "Data Baru"}
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {isEditing ? "Edit Ruangan" : "Tambah Ruangan"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto p-5 sm:p-6"
            >
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Nama Ruangan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lab Komputer A"
                    value={form.nama_ruang}
                    onChange={(e) =>
                      setForm({ ...form, nama_ruang: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Tipe Ruang
                    </label>
                    <select
                      required
                      value={form.tipe_ruang_id}
                      onChange={(e) =>
                        setForm({ ...form, tipe_ruang_id: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">- Pilih Tipe -</option>
                      {tipeRuangList.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.tipe_ruang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Kapasitas Kursi
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="30"
                      value={form.kapasitas}
                      onChange={(e) =>
                        setForm({ ...form, kapasitas: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
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
