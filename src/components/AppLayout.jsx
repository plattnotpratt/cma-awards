import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="appShell">
      <main className="container">
        <Outlet />
      </main>
      <footer className="siteFooter">
        <a href="https://smithhouse.co" target="_blank" rel="noreferrer">
          Made with love by smithHOUSE
        </a>
      </footer>
    </div>
  );
}
