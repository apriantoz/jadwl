// src/pages/admin/JadwalTable.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import {
  getBentrokDetails,
  getMkName,
  getRuangName,
} from "../../utils/scheduleHelpers";
import { AlertTriangle, X } from "lucide-react";

import { useJadwalData } from "../../hooks/useJadwalData";
import { DAYS, dayIndex } from "../../types/constants";
import { getItemId, toTimeValue, getErrorMessage } from "../../types/utils";
import type { JadwalItem, ViewMode } from "../../types/types";

import { JadwalHeader } from "../../components/JadwalHeader";
import { JadwalToolbar } from "../../components/JadwalToolbar";
import { JadwalStats } from "../../components/JadwalStats";
import { JadwalListView } from "../../components/JadwalListView";
import {
  JadwalFormModal,
  type JadwalFormValues,
} from "../../components/JadwalFormModal";
import { JadwalConflictModal } from "../../components/JadwalConflictModel";

const EMPTY_FORM: JadwalFormValues = {
  mk_id: "",
  ruang_id: "",
  master_semester_id: "",
  hari: "Senin",
  jam_mulai: "08:00",
  jam_selesai: "10:00",
  catatan: "",
};

const JadwalTable: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const editIdParam = searchParams.get("edit");

  const {
    jadwalList,
    mkOptions,
    ruangOptions,
    semesterOptions,
    activeSemesterId,
    activeSemesterName,
    loading,
    error,
    setError,
    refresh,
  } = useJadwalData();

  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("Semua Hari");
  const [roomFilter, setRoomFilter] = useState("Semua Ruang");
  const [viewMode, setViewMode] = useState<ViewMode>("jadwal");

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState<JadwalFormValues>(EMPTY_FORM);

  const [showConflictModal, setShowConflictModal] = useState(false);
  const [selectedConflictItem, setSelectedConflictItem] =
    useState<JadwalItem | null>(null);

  // =========================================================
  // HELPERS
  // =========================================================

  const getSemesterName = useCallback(
    (item: JadwalItem) => {
      if (item.tahun_ajaran && item.tipe_semester) {
        return `${item.tahun_ajaran} (${item.tipe_semester})`;
      }
      if (item.master_semester_id) {
        const semester = semesterOptions.find(
          (o) => o.id === Number(item.master_semester_id),
        );
        return semester?.nama || `Semester #${item.master_semester_id}`;
      }
      return "-";
    },
    [semesterOptions],
  );

  const isConflict = useCallback(
    (item: JadwalItem) => {
      const details = getBentrokDetails(item, jadwalList);
      return Boolean(item.is_bentrok || (details && details.length > 0));
    },
    [jadwalList],
  );

  // =========================================================
  // FILTER & GROUPING
  // =========================================================

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jadwalList
      .filter((item) => {
        const text = [
          getMkName(item),
          getRuangName(item),
          item.kode_mk || "",
          item.nama_prodi || "",
          item.hari || "",
          getSemesterName(item),
          item.catatan || "",
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch = !query || text.includes(query);
        const matchesDay =
          dayFilter === "Semua Hari" || item.hari === dayFilter;
        const matchesRoom =
          roomFilter === "Semua Ruang" || String(item.ruang_id) === roomFilter;

        return matchesSearch && matchesDay && matchesRoom;
      })
      .sort((a, b) => {
        const diff =
          (dayIndex[a.hari || ""] ?? 9) - (dayIndex[b.hari || ""] ?? 9);
        return (
          diff ||
          String(a.jam_mulai || "").localeCompare(String(b.jam_mulai || ""))
        );
      });
  }, [jadwalList, search, dayFilter, roomFilter, getSemesterName]);

  const groupedByDay = useMemo(
    () =>
      DAYS.map((day) => ({
        day,
        items: filtered.filter((item) => item.hari === day),
      })).filter((g) => g.items.length > 0),
    [filtered],
  );

  const roomsInUse = useMemo(
    () =>
      new Set(
        jadwalList
          .map((item) => item.ruang_id)
          .filter((id) => id !== null && id !== undefined),
      ).size,
    [jadwalList],
  );

  const totalConflict = useMemo(
    () => jadwalList.filter(isConflict).length,
    [jadwalList, isConflict],
  );

  const roomGroups = useMemo(() => {
    const rooms =
      roomFilter !== "Semua Ruang"
        ? ruangOptions.filter((r) => String(r.id) === roomFilter)
        : ruangOptions;

    return rooms
      .map((room) => ({
        room,
        items: filtered.filter((item) => Number(item.ruang_id) === room.id),
      }))
      .filter((g) => g.items.length > 0);
  }, [ruangOptions, filtered, roomFilter]);

  // =========================================================
  // FORM ACTIONS
  // =========================================================

  const openAdd = () => {
    setIsEditing(false);
    setSelectedId(null);
    setFormError("");

    setFormData({
      // Mata kuliah harus dipilih manual
      mk_id: "",

      ruang_id:
        roomFilter !== "Semua Ruang"
          ? roomFilter
          : ruangOptions[0]?.id
            ? String(ruangOptions[0].id)
            : "",

      master_semester_id: activeSemesterId
        ? String(activeSemesterId)
        : semesterOptions[0]?.id
          ? String(semesterOptions[0].id)
          : "",

      hari: dayFilter !== "Semua Hari" ? dayFilter : "Senin",
      jam_mulai: "08:00",
      jam_selesai: "10:00",
      catatan: "",
    });

    setShowModal(true);
  };

  const openEdit = useCallback(
    (item: JadwalItem) => {
      const id = getItemId(item);
      if (id === null) {
        setError("ID jadwal tidak ditemukan. Data tidak dapat diedit.");
        return;
      }
      setIsEditing(true);
      setSelectedId(id);
      setFormError("");
      setFormData({
        mk_id: String(item.mk_id ?? ""),
        ruang_id: String(item.ruang_id ?? ""),
        master_semester_id: String(item.master_semester_id ?? ""),
        hari: item.hari || "Senin",
        jam_mulai: toTimeValue(item.jam_mulai) || "08:00",
        jam_selesai: toTimeValue(item.jam_selesai) || "10:00",
        catatan: item.catatan || "",
      });
      setShowModal(true);
    },
    [setError],
  );

  // ?edit=ID auto open
  useEffect(() => {
    if (!editIdParam || loading) return;

    const editId = Number(editIdParam);
    const clearParam = () =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("edit");
          return next;
        },
        { replace: true },
      );

    if (!Number.isFinite(editId) || editId <= 0) {
      clearParam();
      return;
    }

    const item = jadwalList.find((s) => getItemId(s) === editId);
    if (item) openEdit(item);
    else setError(`Jadwal dengan ID ${editId} tidak ditemukan.`);

    clearParam();
  }, [editIdParam, loading, jadwalList, setSearchParams, openEdit, setError]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!formData.mk_id || !formData.ruang_id || !formData.master_semester_id) {
      setFormError("Mata kuliah, ruangan, dan semester wajib dipilih.");
      return;
    }
    if (
      !formData.jam_mulai ||
      !formData.jam_selesai ||
      formData.jam_selesai <= formData.jam_mulai
    ) {
      setFormError("Jam selesai harus lebih besar dari jam mulai.");
      return;
    }
    if (isEditing && selectedId === null) {
      setFormError("ID jadwal tidak valid.");
      return;
    }

    setSubmitting(true);

    const payload = {
      mk_id: Number(formData.mk_id),
      ruang_id: Number(formData.ruang_id),
      master_semester_id: Number(formData.master_semester_id),
      hari: formData.hari,
      jam_mulai: formData.jam_mulai,
      jam_selesai: formData.jam_selesai,
      catatan: formData.catatan.trim() || null,
    };

    try {
      if (isEditing) {
        const { error: updateError } = await supabase
          .from("jadwal")
          .update(payload)
          .eq("id", selectedId!);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("jadwal")
          .insert([payload]);
        if (insertError) throw insertError;
      }
      setShowModal(false);
      await refresh();
    } catch (err) {
      console.error("Gagal menyimpan jadwal:", err);
      setFormError(getErrorMessage(err, "Gagal menyimpan jadwal."));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus jadwal ini?"))
      return;

    try {
      const { error: deleteError } = await supabase
        .from("jadwal")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
      await refresh();
    } catch (err) {
      console.error("Gagal menghapus jadwal:", err);
      window.alert(
        "Gagal menghapus data: " + getErrorMessage(err, "Terjadi kesalahan."),
      );
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-full">
      <div className="container mx-auto space-y-6 px-4 py-6">
        <JadwalHeader
          loading={loading}
          onRefresh={() => void refresh()}
          onAdd={openAdd}
        />

        <JadwalToolbar
          search={search}
          onSearchChange={setSearch}
          dayFilter={dayFilter}
          onDayFilterChange={setDayFilter}
          roomFilter={roomFilter}
          onRoomFilterChange={setRoomFilter}
          ruangOptions={ruangOptions}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <JadwalStats
          activeSemesterName={activeSemesterName}
          filteredCount={filtered.length}
          roomsInUse={roomsInUse}
          totalConflict={totalConflict}
        />

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Gagal memuat data</p>
              <p className="mt-0.5 break-words text-xs">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <JadwalListView
          loading={loading}
          viewMode={viewMode}
          filtered={filtered}
          groupedByDay={groupedByDay}
          roomGroups={roomGroups}
          jadwalList={jadwalList}
          roomsInUse={roomsInUse}
          search={search}
          dayFilter={dayFilter}
          roomFilter={roomFilter}
          getSemesterName={getSemesterName}
          isConflict={isConflict}
          onOpenConflict={(item) => {
            setSelectedConflictItem(item);
            setShowConflictModal(true);
          }}
          onEdit={openEdit}
          onDelete={remove}
          onFocusRoom={setRoomFilter}
          onAdd={openAdd}
        />
      </div>

      <JadwalConflictModal
        open={showConflictModal}
        item={selectedConflictItem}
        jadwalList={jadwalList}
        getSemesterName={getSemesterName}
        onClose={() => setShowConflictModal(false)}
        onEdit={(item) => {
          setShowConflictModal(false);
          window.setTimeout(() => openEdit(item), 80);
        }}
      />

      <JadwalFormModal
        open={showModal}
        isEditing={isEditing}
        submitting={submitting}
        formError={formError}
        formData={formData}
        mkOptions={mkOptions}
        ruangOptions={ruangOptions}
        semesterOptions={semesterOptions}
        activeSemesterId={activeSemesterId}
        activeSemesterName={activeSemesterName}
        onChange={setFormData}
        onSubmit={submit}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};

export default JadwalTable;
