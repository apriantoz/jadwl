import { useEffect, useRef } from "react";
import {
  CalendarDays,
  Database,
  Globe2,
  LogOut,
  Menu,
  HandshakeIcon,
  LandmarkIcon,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const navLinks = [
  { to: "/dashboard", icon: Globe2, label: "Dashboard" },
  { to: "/jadwal", icon: CalendarDays, label: "Jadwal" },
  { to: "/pengajuan-peminjaman", icon: HandshakeIcon, label: "Peminjaman" },
  {
    label: "Master Data",
    icon: Database,
    children: [
      { to: "/master/semester", label: "Semester" },
      { to: "/master/ruangan", label: "Ruangan" },
      { to: "/master/prodi", label: "Program Studi" },
      { to: "/master/mk", label: "Mata Kuliah" },
    ],
  },
];

function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const navbarRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeMenus = () => {
      mobileMenuRef.current?.removeAttribute("open");
      navbarRef.current?.querySelectorAll("details").forEach((menu) => {
        menu.open = false;
      });
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        !navbarRef.current?.contains(event.target)
      ) {
        closeMenus();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    mobileMenuRef.current?.removeAttribute("open");
    navbarRef.current?.querySelectorAll("details").forEach((menu) => {
      menu.open = false;
    });
  }, [pathname]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return console.error("Gagal logout:", error);
    navigate("/login", { replace: true });
  };

  const renderLinks = () =>
    navLinks.map(({ to, icon: Icon, label, children }) => (
      <li key={label}>
        {children ? (
          <details>
            <summary>
              <Icon size={15} />
              {label}
            </summary>
            <ul className="z-50 w-48 bg-base-100 p-2 shadow">
              {children.map((child) => (
                <li key={child.to}>
                  <Link to={child.to}>{child.label}</Link>
                </li>
              ))}
            </ul>
          </details>
        ) : (
          <Link to={to!}>
            <Icon size={15} />
            {label}
          </Link>
        )}
      </li>
    ));

  return (
    <nav
      ref={navbarRef}
      className="navbar sticky top-0 z-50 bg-base-100 shadow-sm"
    >
      <div className="navbar-start">
        <div className="dropdown lg:hidden">
          <details ref={mobileMenuRef}>
            <summary
              className="btn btn-ghost list-none"
              aria-label="Buka menu navigasi"
            >
              <Menu />
            </summary>
            <ul className="menu dropdown-content z-50 mt-3 w-56 rounded-box bg-base-100 p-2 shadow">
              {renderLinks()}
            </ul>
          </details>
        </div>

        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-2xl font-bold"
        >
          <LandmarkIcon className="text-primary" />
          JadwL
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">{renderLinks()}</ul>
      </div>

      <div className="navbar-end">
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Keluar dari akun"
          title="Logout"
          className="btn btn-circle btn-ghost"
        >
          <LogOut />
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
