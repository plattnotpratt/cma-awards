import React from "react";
import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";

export default function AppLayout() {
  return (
    <div className="appShell">
      <NavBar />
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}