// src/layouts/MasterLayout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export const MasterLayout: React.FC = () => {
  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      <Outlet />
    </div>
  );
};
