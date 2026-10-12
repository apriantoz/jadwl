// src/layouts/MasterLayout.tsx
import React from "react";
import { Outlet } from "react-router-dom";

export const MasterLayout: React.FC = () => {
  return (
    <div className="min-h-full bg-base-200/40">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </div>
    </div>
  );
};
