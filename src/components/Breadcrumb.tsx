import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const breadcrumbLabels: Record<string, string> = {
  homepage: "Jadwal Publik",
  pinjam: "Pinjam Ruangan",
  dashboard: "Dashboard",
  jadwal: "Jadwal",
  "pengajuan-peminjaman": "Pengajuan Peminjaman",
  master: "Master Data",
  semester: "Master Semester",
  ruangan: "Data Ruangan",
  prodi: "Program Studi",
  mk: "Mata Kuliah",
};

export default function Breadcrumb() {
  const location = useLocation();

  const paths = location.pathname.split("/").filter(Boolean);

  return (
    <nav
      aria-label="Breadcrumb"
      className="breadcrumbs text-sm container mx-auto px-3 py-3"
    >
      <ul>
        <li>
          <Link to="/dashboard" className="inline-flex items-center gap-1">
            <Home size={16} />
            Home
          </Link>
        </li>

        {paths.map((path, index) => {
          const to = `/${paths.slice(0, index + 1).join("/")}`;
          const isLast = index === paths.length - 1;

          const label =
            breadcrumbLabels[path] ??
            path
              .replace(/-/g, " ")
              .replace(/\b\w/g, (char) => char.toUpperCase());

          return (
            <li key={to}>
              {isLast ? (
                <span aria-current="page" className="font-semibold">
                  {label}
                </span>
              ) : (
                <Link to={to}>{label}</Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
