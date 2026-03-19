import React from "react";
import { NavLink } from "react-router-dom";

export default function NavBar() {
  return (
    <header className="topBar">
      <div className="container topBarInner">
        <div className="brand">Catholic Media Association Awards</div>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Home
          </NavLink>
          {/* <NavLink to="/awards" className={({ isActive }) => (isActive ? "active" : "")}>
            Awards
          </NavLink> */}
        </nav>
      </div>
    </header>
  );
}