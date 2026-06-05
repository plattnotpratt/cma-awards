import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="appShell">
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
