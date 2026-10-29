import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { useSocket } from "../context/SocketContext.jsx";

export default function NotificationBell() {
  const { unreadCount, setUnreadCount } = useSocket();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread || 0);
    } catch (e) {
      // non-critical
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(c - 1, 0));
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  return (
    <div className="notif-wrap" ref={ref}>
      <button
        type="button"
        className="notif-bell-btn"
        aria-label="Notifications"
        onClick={() => {
          if (!open) fetchNotifications();
          setOpen(!open);
        }}
      >
        🔔
        {unreadCount > 0 && <span className="notif-bubble">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-popover">
          <div className="notif-popover-head">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: ".2rem .5rem", fontSize: ".75rem" }}
                onClick={markAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-popover-list">
            {loading ? (
              <p style={{ padding: "1rem", textAlign: "center", margin: 0, color: "var(--muted)" }}>
                Loading alerts…
              </p>
            ) : notifications.length === 0 ? (
              <p style={{ padding: "1.5rem", textAlign: "center", margin: 0, color: "var(--muted)" }}>
                No notifications yet.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`notif-popover-item ${!n.read ? "unread" : ""}`}
                  onClick={() => !n.read && markRead(n._id)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: ".5rem" }}>
                    <span>{n.message}</span>
                    {!n.read && (
                      <span style={{ color: "var(--teal)", fontSize: "1.2rem", lineHeight: 1 }}>•</span>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: ".3rem" }}>
                    <small className="muted" style={{ fontSize: ".75rem" }}>
                      {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </small>
                    {n.item && (
                      <Link
                        to={`/items/${n.item}`}
                        style={{ fontSize: ".75rem", fontWeight: 700 }}
                        onClick={() => setOpen(false)}
                      >
                        View Item →
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
