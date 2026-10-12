import React from "react";

interface Props {
  activeSemesterName: string;
  filteredCount: number;
  roomsInUse: number;
  totalConflict: number;
}

export const JadwalStats: React.FC<Props> = ({
  activeSemesterName,
  filteredCount,
  roomsInUse,
  totalConflict,
}) => {
  return (
    <div className="mb-5 grid grid-cols-4 gap-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
        <p className="text-[11px] font-medium text-slate-400">
          Semester aktif
        </p>
        <p className="mt-1 truncate text-sm font-bold text-slate-800">
          {activeSemesterName}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
        <p className="text-[11px] font-medium text-slate-400">Jadwal tampil</p>
        <p className="mt-1 text-xl font-bold text-slate-900">
          {filteredCount}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
        <p className="text-[11px] font-medium text-slate-400">
          Ruangan terpakai
        </p>
        <p className="mt-1 text-xl font-bold text-slate-900">{roomsInUse}</p>
      </div>

      <div
        className={`rounded-2xl border bg-white p-3.5 shadow-sm ${
          totalConflict ? "border-red-200" : "border-slate-200"
        }`}
      >
        <p className="text-[11px] font-medium text-slate-400">Bentrok</p>
        <p
          className={`mt-1 text-xl font-bold ${
            totalConflict ? "text-red-600" : "text-slate-900"
          }`}
        >
          {totalConflict}
        </p>
      </div>
    </div>
  );
};