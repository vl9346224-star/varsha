import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { isAuthed } = useAuth();
  const [socket, setSocket] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addToast = (msg, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (!isAuthed) {
      if (socket) socket.disconnect();
      return;
    }

    const token = localStorage.getItem("token");
    const s = io("http://localhost:5000", {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => {
      // connected to live alerts
    });

    s.on("newItem", (item) => {
      addToast(`📢 New ${item.type} item reported: "${item.title}" (${item.category})`, "item");
    });

    s.on("itemRecovered", (item) => {
      addToast(`🎉 Item recovered: "${item.title}"`, "recovered");
    });

    s.on("itemStatusChanged", ({ status }) => {
      addToast(`ℹ️ An item status was updated to: ${status}`, "status");
    });

    s.on("notification", (notif) => {
      addToast(`🔔 ${notif.message}`, "notif");
      setUnreadCount((c) => c + 1);
    });

    s.on("newClaim", () => {
      addToast(`🔒 Someone submitted an ownership claim for your reported item!`, "claim");
      setUnreadCount((c) => c + 1);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [isAuthed]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        toasts,
        unreadCount,
        setUnreadCount,
        addToast,
        removeToast,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
