// src/pages/MasterDataPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  AlertTriangle,
  BookOpen,
  Building2,
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
import {
  type SemesterItem,
  type TipeRuang,
  type Ruangan,
  type MataKuliah,
} from "../../types/master";

type TabType = "ruang" | "prodi" | "mk";

interface ProdiItem {
  id: number;
  kode_prodi: string;
  nama_prodi: string;
}

const TAB_META: Record<
  TabType,
  { label: string; description: string; icon: React.ReactNode }
> = {
  ruang: {
    label: "Ruangan",
    description: "Kelola ruang dan kapasitas",
    icon: <MapPin className="h-4 w-4" />,
  },
  prodi: {
    label: "Program Studi",
    description: "Kelola program studi",
    icon: <Building2 className="h-4 w-4" />,
  },
  mk: {
    label: "Mata Kuliah",
    description: "Kelola mata kuliah",
    icon: <BookOpen className="h-4 w-4" />,
  },
};

export const MasterDataPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("ruang");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [ruangList, setRuangList] = useState<Ruangan[]>([]);
  const [tipeRuangList, setTipeRuangList] = useState<TipeRuang[]>([]);
  const [prodiList, setProdiList] = useState<ProdiItem[]>([]);
  const [semesterList, setSemesterList] = useState<SemesterItem[]>([]);
  const [mkList, setMkList] = useState<MataKuliah[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formRuang, setFormRuang] = useState({
    nama_ruang: "",
    kapasitas: "",
    tipe_ruang_id: "",
  });

  const [formProdi, setFormProdi] = useState({
    kode_prodi: "",
    nama_prodi: "",
  });

  const [formMk, setFormMk] = useState({
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
      if (activeTab === "ruang") {
        const [ruangRes, tipeRuangRes] = await Promise.all([
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
        if (tipeRuangRes.error) throw tipeRuangRes.error;

        setRuangList(ruangRes.data || []);
        setTipeRuangList(tipeRuangRes.data || []);
      }

      if (activeTab === "prodi") {
        const { data, error: prodiError } = await supabase
          .from("prodi")
          .select("*")
          .order("id", { ascending: true });

        if (prodiError) throw prodiError;
        setProdiList(data || []);
      }

      if (activeTab === "mk") {
        const [mkRes, prodiRes, smtRes] = await Promise.all([
          supabase
            .from("mk")
            .select("*, prodi(nama_prodi), semester(semester)")
            .order("id", { ascending: true }),
          supabase.from("prodi").select("*").order("id", { ascending: true }),
          supabase
            .from("semester")
            .select("*")
            .order("id", { ascending: true }),
        ]);

        if (mkRes.error) throw mkRes.error;
        if (prodiRes.error) throw prodiRes.error;
        if (smtRes.error) throw smtRes.error;

        setMkList(mkRes.data || []);
        setProdiList(prodiRes.data || []);
        setSemesterList(smtRes.data || []);
      }
    } catch (err) {
      console.error("Error fetching master data:", err);
      setError("Data master gagal dimuat. Silakan coba refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearch("");
    fetchData();
  }, [activeTab]);

  const filteredRuang = useMemo(() => {
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

  const filteredProdi = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return prodiList;

    return prodiList.filter((item) =>
      `${item.kode_prodi} ${item.nama_prodi}`.toLowerCase().includes(q),
    );
  }, [prodiList, search]);

  const filteredMk = useMemo(() => {
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

  const handleOpenAdd = async () => {
    setIsEditing(false);
    setSelectedId(null);
    setError("");

    let currentTipeRuang = tipeRuangList;
    if (currentTipeRuang.length === 0) {
      const { data, error: tipeError } = await supabase
        .from("tipe_ruang")
        .select("*")
        .order("id", { ascending: true });

      if (tipeError) {
        setError("Tipe ruang gagal dimuat.");
        return;
      }

      currentTipeRuang = data || [];
      setTipeRuangList(currentTipeRuang);
    }

    let currentProdi = prodiList;
    if (currentProdi.length === 0) {
      const { data, error: prodiError } = await supabase
        .from("prodi")
        .select("*")
        .order("id", { ascending: true });

      if (prodiError) {
        setError("Data program studi gagal dimuat.");
        return;
      }

      currentProdi = data || [];
      setProdiList(currentProdi);
    }

    let currentSemester = semesterList;
    if (currentSemester.length === 0) {
      const { data, error: semesterError } = await supabase
        .from("semester")
        .select("*")
        .order("id", { ascending: true });

      if (semesterError) {
        setError("Data semester gagal dimuat.");
        return;
      }

      currentSemester = data || [];
      setSemesterList(currentSemester);
    }

    setFormRuang({
      nama_ruang: "",
      kapasitas: "",
      tipe_ruang_id: currentTipeRuang[0]?.id
        ? String(currentTipeRuang[0].id)
        : "",
    });

    setFormProdi({
      kode_prodi: "",
      nama_prodi: "",
    });

    setFormMk({
      kode_mk: "",
      nama_mk: "",
      sks: "2",
      smt_id: currentSemester[0]?.id ? String(currentSemester[0].id) : "",
      prodi_id: currentProdi[0]?.id ? String(currentProdi[0].id) : "",
    });

    setShowModal(true);
  };

  const handleOpenEdit = async (item: any) => {
    setIsEditing(true);
    setSelectedId(item.id);
    setError("");

    if (semesterList.length === 0) {
      const { data } = await supabase
        .from("semester")
        .select("*")
        .order("id", { ascending: true });
      setSemesterList(data || []);
    }

    if (prodiList.length === 0) {
      const { data } = await supabase
        .from("prodi")
        .select("*")
        .order("id", { ascending: true });
      setProdiList(data || []);
    }

    if (tipeRuangList.length === 0) {
      const { data } = await supabase
        .from("tipe_ruang")
        .select("*")
        .order("id", { ascending: true });
      setTipeRuangList(data || []);
    }

    if (activeTab === "ruang") {
      setFormRuang({
        nama_ruang: item.nama_ruang || "",
        kapasitas: item.kapasitas ? String(item.kapasitas) : "",
        tipe_ruang_id: item.tipe_ruang_id ? String(item.tipe_ruang_id) : "",
      });
    }

    if (activeTab === "prodi") {
      setFormProdi({
        kode_prodi: item.kode_prodi || "",
        nama_prodi: item.nama_prodi || "",
      });
    }

    if (activeTab === "mk") {
      setFormMk({
        kode_mk: item.kode_mk || "",
        nama_mk: item.nama_mk || "",
        sks: String(item.sks || 2),
        smt_id: item.smt_id ? String(item.smt_id) : "",
        prodi_id: item.prodi_id ? String(item.prodi_id) : "",
      });
    }

    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      let table = activeTab;
      let payload: Record<string, unknown> = {};

      if (activeTab === "ruang") {
        payload = {
          nama_ruang: formRuang.nama_ruang.trim(),
          kapasitas: formRuang.kapasitas ? Number(formRuang.kapasitas) : 0,
          tipe_ruang_id: formRuang.tipe_ruang_id
            ? Number(formRuang.tipe_ruang_id)
            : null,
        };
      }

      if (activeTab === "prodi") {
        payload = {
          kode_prodi: formProdi.kode_prodi.trim(),
          nama_prodi: formProdi.nama_prodi.trim(),
        };
      }

      if (activeTab === "mk") {
        payload = {
          kode_mk: formMk.kode_mk.trim(),
          nama_mk: formMk.nama_mk.trim(),
          sks: Number(formMk.sks),
          smt_id: formMk.smt_id ? Number(formMk.smt_id) : null,
          prodi_id: formMk.prodi_id ? Number(formMk.prodi_id) : null,
        };
      }

      if (isEditing && selectedId) {
        const { error: updateError } = await supabase
          .from(table)
          .update(payload)
          .eq("id", selectedId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from(table)
          .insert([payload]);

        if (insertError) throw insertError;
      }

      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      console.error("Error saving master data:", err);
      setError(err?.message || "Gagal menyimpan data.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Yakin ingin menghapus data ini?")) return;

    setError("");

    try {
      const { error: deleteError } = await supabase
        .from(activeTab)
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      await fetchData();
    } catch (err: any) {
      console.error("Error deleting master data:", err);
      setError(err?.message || "Gagal menghapus data.");
    }
  };

  const currentCount =
    activeTab === "ruang"
      ? filteredRuang.length
      : activeTab === "prodi"
        ? filteredProdi.length
        : filteredMk.length;

  const totalCount =
    activeTab === "ruang"
      ? ruangList.length
      : activeTab === "prodi"
        ? prodiList.length
        : mkList.length;

  const renderEmpty = (message: string) => (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
      <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
        <Layers3 className="h-6 w-6" />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-700">
        {search ? "Data tidak ditemukan" : message}
      </p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
        {search
          ? `Tidak ada data yang cocok dengan "${search}".`
          : "Belum ada data yang tersedia pada bagian ini."}
      </p>
    </div>
  );

  const actionButtons = (item: any) => (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => handleOpenEdit(item)}
        className="rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
        title="Edit"
      >
        <Edit3 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => handleDelete(item.id)}
        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        title="Hapus"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="min-h-full bg-slate-50/60">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
              <Layers3 className="h-3.5 w-3.5" />
              Administrasi Akademik
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Master Data
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
              Kelola data dasar yang digunakan untuk penyusunan jadwal
              perkuliahan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              title="Refresh data"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Tambah {TAB_META[activeTab].label}
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

        {/* Tab navigation */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
            {(Object.keys(TAB_META) as TabType[]).map((tab) => {
              const active = activeTab === tab;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      active
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {TAB_META[tab].icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {TAB_META[tab].label}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                      {TAB_META[tab].description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Content */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900">
                  Data {TAB_META[activeTab].label}
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                  {currentCount}
                  {search ? ` / ${totalCount}` : ""}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {activeTab === "ruang"
                  ? "Daftar ruangan dan kapasitas yang tersedia."
                  : activeTab === "prodi"
                    ? "Daftar program studi yang tersedia."
                    : "Daftar mata kuliah beserta semester dan program studi."}
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Cari ${TAB_META[activeTab].label.toLowerCase()}...`}
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
              <p className="mt-3 text-sm">Memuat data master...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* RUANGAN */}
              {activeTab === "ruang" && (
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
                    {filteredRuang.length === 0
                      ? null
                      : filteredRuang.map((r) => (
                          <tr
                            key={r.id}
                            className="group transition hover:bg-slate-50/70"
                          >
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
                            <td className="px-6 py-4">{actionButtons(r)}</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              )}

              {/* PRODI */}
              {activeTab === "prodi" && (
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/70">
                    <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-3.5">Kode</th>
                      <th className="px-6 py-3.5">Program Studi</th>
                      <th className="px-6 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProdi.map((p) => (
                      <tr
                        key={p.id}
                        className="group transition hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-lg bg-indigo-50 px-2.5 py-1 font-mono text-xs font-semibold text-indigo-700">
                            {p.kode_prodi}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {p.nama_prodi}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-400">
                                Program studi
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{actionButtons(p)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* MATA KULIAH */}
              {activeTab === "mk" && (
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/70">
                    <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-3.5">Kode MK</th>
                      <th className="px-6 py-3.5">Mata Kuliah</th>
                      <th className="px-6 py-3.5">SKS</th>
                      <th className="px-6 py-3.5">Semester</th>
                      <th className="px-6 py-3.5">Program Studi</th>
                      <th className="px-6 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMk.map((m) => (
                      <tr
                        key={m.id}
                        className="group transition hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-lg bg-indigo-50 px-2.5 py-1 font-mono text-xs font-semibold text-indigo-700">
                            {m.kode_mk || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                              <BookOpen className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">
                                {m.nama_mk}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-400">
                                Mata kuliah
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-700">
                            {m.sks} SKS
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {m.semester?.semester || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {m.prodi?.nama_prodi || "-"}
                        </td>
                        <td className="px-6 py-4">{actionButtons(m)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {currentCount === 0 &&
                renderEmpty(
                  activeTab === "ruang"
                    ? "Belum ada data ruangan"
                    : activeTab === "prodi"
                      ? "Belum ada data program studi"
                      : "Belum ada data mata kuliah",
                )}
            </div>
          )}

          {!loading && currentCount > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3">
              <p className="text-xs text-slate-400">
                Menampilkan{" "}
                <span className="font-semibold text-slate-600">
                  {currentCount}
                </span>{" "}
                {TAB_META[activeTab].label.toLowerCase()}
                {search && ` dari ${totalCount} data`}
              </p>
            </div>
          )}
        </section>
      </div>

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
                  {isEditing ? "Edit " : "Tambah "}
                  {TAB_META[activeTab].label}
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
              {/* Ruangan */}
              {activeTab === "ruang" && (
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Nama Ruangan
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Lab Komputer A"
                      value={formRuang.nama_ruang}
                      onChange={(e) =>
                        setFormRuang({
                          ...formRuang,
                          nama_ruang: e.target.value,
                        })
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
                        value={formRuang.tipe_ruang_id}
                        onChange={(e) =>
                          setFormRuang({
                            ...formRuang,
                            tipe_ruang_id: e.target.value,
                          })
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
                        value={formRuang.kapasitas}
                        onChange={(e) =>
                          setFormRuang({
                            ...formRuang,
                            kapasitas: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Prodi */}
              {activeTab === "prodi" && (
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Kode Program Studi
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: ANIM"
                      value={formProdi.kode_prodi}
                      onChange={(e) =>
                        setFormProdi({
                          ...formProdi,
                          kode_prodi: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm uppercase text-slate-800 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Nama Program Studi
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Desain Komunikasi Visual"
                      value={formProdi.nama_prodi}
                      onChange={(e) =>
                        setFormProdi({
                          ...formProdi,
                          nama_prodi: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              )}

              {/* Mata Kuliah */}
              {activeTab === "mk" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Kode MK
                      </label>
                      <input
                        type="text"
                        placeholder="ANIM101"
                        value={formMk.kode_mk}
                        onChange={(e) =>
                          setFormMk({
                            ...formMk,
                            kode_mk: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm uppercase text-slate-800 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Nama Mata Kuliah
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Animasi 2D"
                        value={formMk.nama_mk}
                        onChange={(e) =>
                          setFormMk({
                            ...formMk,
                            nama_mk: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Jumlah SKS
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="6"
                        value={formMk.sks}
                        onChange={(e) =>
                          setFormMk({
                            ...formMk,
                            sks: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Semester
                      </label>
                      <select
                        required
                        value={formMk.smt_id}
                        onChange={(e) =>
                          setFormMk({
                            ...formMk,
                            smt_id: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="">- Pilih -</option>
                        {semesterList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.semester || `Semester ${s.id}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Program Studi
                      </label>
                      <select
                        required
                        value={formMk.prodi_id}
                        onChange={(e) =>
                          setFormMk({
                            ...formMk,
                            prodi_id: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="">- Pilih -</option>
                        {prodiList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.kode_prodi} - {p.nama_prodi}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

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
    </div>
  );
};
