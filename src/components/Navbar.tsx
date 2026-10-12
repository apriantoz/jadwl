// src/components/Navbar.tsx
import { CalendarHeartIcon, LogOutIcon, Menu } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <Menu />
          </div>
          <ul
            tabIndex={-1}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
          >
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
            <li>
              <span>Master Data</span>
              <ul className="p-2">
                <li>
                  <Link to="/master/ruangan">Ruangan</Link>
                </li>
                <li>
                  <Link to="/master/prodi">Program Studi</Link>
                </li>
                <li>
                  <Link to="/master/mk">Mata Kuliah</Link>
                </li>
              </ul>
            </li>
            <li>
              <Link to="/jadwal">Kelola Jadwal</Link>
            </li>
          </ul>
        </div>
        <Link to="/dashboard" className="text-2xl flex items-center gap-2">
          <CalendarHeartIcon className="text-primary" />
          JadwL
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <button className="btn sm:hidden" popoverTarget="my-megamenu-2">
          Menu
        </button>
        <div
          className="megamenu max-sm:megamenu-vertical megamenu-wide p-2"
          id="my-megamenu-2"
          popover="auto"
        >
          <span className="megamenu-active"></span>

          <button popoverTarget="b1">Jadwal</button>
          <div id="b1" popover="auto">
            <ul className="menu menu-horizontal">
              <li>
                <Link to="/jadwal">Kelola Jadwal</Link>
              </li>
            </ul>
          </div>

          <button popoverTarget="b2">Semester</button>
          <div id="b2" popover="auto">
            <ul className="menu menu-horizontal">
              <li>
                <Link to="/semester">Kelola Semester</Link>
              </li>
            </ul>
          </div>

          <button popoverTarget="b3">Master Data</button>
          <div id="b3" popover="auto">
            <ul className="menu menu-horizontal">
              <li>
                <Link to="/master/ruangan">Ruangan</Link>
              </li>
              <li>
                <Link to="/master/prodi">Program Studi</Link>
              </li>
              <li>
                <Link to="/master/mk">Mata Kuliah</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="navbar-end">
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
          className="btn btn-circle"
        >
          <LogOutIcon />
        </button>
      </div>
    </div>
  );
}

export default Navbar;
