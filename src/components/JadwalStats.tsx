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
    <div className="mb-5 grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Semester Aktif */}
      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body p-3.5">
          <p className="text-[11px] font-medium text-base-content/60">
            Semester aktif
          </p>
          <p className="mt-1 truncate text-sm font-bold text-base-content">
            {activeSemesterName}
          </p>
        </div>
      </div>

      {/* Jadwal Tampil */}
      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body p-3.5">
          <p className="text-[11px] font-medium text-base-content/60">
            Jadwal tampil
          </p>
          <p className="mt-1 text-xl font-bold text-base-content">
            {filteredCount}
          </p>
        </div>
      </div>

      {/* Ruangan Terpakai */}
      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body p-3.5">
          <p className="text-[11px] font-medium text-base-content/60">
            Ruangan terpakai
          </p>
          <p className="mt-1 text-xl font-bold text-base-content">
            {roomsInUse}
          </p>
        </div>
      </div>

      {/* Bentrok */}
      <div
        className={`card bg-base-100 border shadow-sm ${
          totalConflict ? "border-error/40 bg-error/5" : "border-base-200"
        }`}
      >
        <div className="card-body p-3.5">
          <p className="text-[11px] font-medium text-base-content/60">
            Bentrok
          </p>
          <p
            className={`mt-1 text-xl font-bold ${
              totalConflict ? "text-error" : "text-base-content"
            }`}
          >
            {totalConflict}
          </p>
        </div>
      </div>
    </div>
  );
};
