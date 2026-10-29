import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const out = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="nav">
      <Link to="/" className="brand">
        Lost<span>&amp;</span>Found
      </Link>
      <nav>
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/search">Search</NavLink>
        <NavLink to="/my-reports">My reports</NavLink>
        {user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
      </nav>
      <div className="nav-user">
        <NotificationBell />
        <NavLink to="/profile" className="avatar" aria-label="Profile">
          {user?.name?.[0]?.toUpperCase() || "?"}
        </NavLink>
        <button className="btn btn-ghost" onClick={out}>
          Log out
        </button>
      </div>
    </header>
  );
}
