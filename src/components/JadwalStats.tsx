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
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {/* Semester Aktif */}
      <div className="card border border-base-200 bg-base-100 shadow-sm">
        <div className="card-body min-w-0 gap-2 p-4 sm:p-5">
          <p className="text-sm font-medium leading-snug text-base-content/60">
            Semester Aktif
          </p>

          <p
            className="truncate text-base font-bold leading-snug text-base-content sm:text-lg"
            title={activeSemesterName}
          >
            {activeSemesterName || "Belum ditentukan"}
          </p>
        </div>
      </div>

      {/* Jadwal Tampil */}
      <div className="card border border-base-200 bg-base-100 shadow-sm">
        <div className="card-body gap-2 p-4 sm:p-5">
          <p className="text-sm font-medium leading-snug text-base-content/60">
            Jadwal Tampil
          </p>

          <p className="text-2xl font-bold tabular-nums leading-tight text-base-content sm:text-3xl">
            {filteredCount}
          </p>

          <p className="text-xs leading-relaxed text-base-content/50">
            Sesuai filter aktif
          </p>
        </div>
      </div>

      {/* Ruangan Terpakai */}
      <div className="card border border-base-200 bg-base-100 shadow-sm">
        <div className="card-body gap-2 p-4 sm:p-5">
          <p className="text-sm font-medium leading-snug text-base-content/60">
            Ruangan Terpakai
          </p>

          <p className="text-2xl font-bold tabular-nums leading-tight text-base-content sm:text-3xl">
            {roomsInUse}
          </p>

          <p className="text-xs leading-relaxed text-base-content/50">
            Ruangan dengan jadwal
          </p>
        </div>
      </div>

      {/* Bentrok */}
      <div
        className={`card border shadow-sm ${
          totalConflict > 0
            ? "border-error/40 bg-error/5"
            : "border-base-200 bg-base-100"
        }`}
      >
        <div className="card-body gap-2 p-4 sm:p-5">
          <p className="text-sm font-medium leading-snug text-base-content/60">
            Jadwal Bentrok
          </p>

          <p
            className={`text-2xl font-bold tabular-nums leading-tight sm:text-3xl ${
              totalConflict > 0 ? "text-error" : "text-base-content"
            }`}
          >
            {totalConflict}
          </p>

          <p
            className={`text-xs leading-relaxed ${
              totalConflict > 0 ? "text-error/80" : "text-base-content/50"
            }`}
          >
            {totalConflict > 0 ? "Perlu diperiksa" : "Tidak ada bentrok"}
          </p>
        </div>
      </div>
    </div>
  );
};
