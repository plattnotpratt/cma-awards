import { Outlet } from "react-router-dom";
import AccessGate from "./AccessGate";

export default function AppLayout() {
  return (
    <AccessGate>
      <div className="appShell">
        <main className="container">
          <Outlet />
        </main>
      </div>
    </AccessGate>
  );
}
