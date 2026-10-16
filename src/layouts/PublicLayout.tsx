import { Outlet } from "react-router-dom";

function PublicLayout() {
  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      <Outlet />
    </div>
  );
}

export default PublicLayout;
