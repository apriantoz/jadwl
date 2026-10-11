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
              <a>Item 1</a>
            </li>
            <li>
              <a>Parent</a>
              <ul className="p-2">
                <li>
                  <a>Submenu 1</a>
                </li>
                <li>
                  <a>Submenu 2</a>
                </li>
              </ul>
            </li>
            <li>
              <a>Item 3</a>
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

          <button popoverTarget="b1">One</button>
          <div id="b1" popover="auto">
            <ul className="menu menu-horizontal">
              <li>
                <a>Enterprise</a>
              </li>
              <li>
                <a>CRM software</a>
              </li>
              <li>
                <a>Security</a>
              </li>
              <li>
                <a>Consulting</a>
              </li>
            </ul>
          </div>

          <button popoverTarget="b2">Two</button>
          <div id="b2" popover="auto">
            <ul className="menu menu-horizontal">
              <li>
                <a>AI infrastructure</a>
              </li>
              <li>
                <a>Image generation</a>
              </li>
              <li>
                <a>MCP servers</a>
              </li>
            </ul>
          </div>

          <button popoverTarget="b3">Three</button>
          <div id="b3" popover="auto">
            <ul className="menu menu-horizontal">
              <li>
                <a>Cloud computing</a>
              </li>
              <li>
                <a>Storage solutions</a>
              </li>
              <li>
                <a>Database services</a>
              </li>
              <li>
                <a>CDN performance</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="navbar-end">
        {/* Tombol logout gampang */}
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
