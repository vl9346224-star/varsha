import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import { useSocket } from "../context/SocketContext.jsx";

export default function Layout() {
  const { toasts, removeToast } = useSocket();

  return (
    <>
      <Navbar />
      <main className="page">
        <Outlet />
      </main>
      {toasts && toasts.length > 0 && (
        <div className="toast-stack" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="toast-card"
              onClick={() => removeToast(t.id)}
              style={{ cursor: "pointer" }}
            >
              {t.msg}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
