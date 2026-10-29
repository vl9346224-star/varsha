import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

const actions = [
  { to: "/report-lost", title: "I lost something", text: "Describe it and where you last saw it.", cls: "lost" },
  { to: "/report-found", title: "I found something", text: "Help the owner get it back.", cls: "found" },
  { to: "/search", title: "Search items", text: "Filter by category, place and date.", cls: "search" },
];

export default function Home() {
  const { user } = useAuth();
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/search?limit=4")
      .then((res) => {
        setRecentItems(res.data.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="hero">
        <h1>Hi {user?.name?.split(" ")[0] || "there"}.</h1>
        <p>What are you doing today?</p>
      </section>
      <section className="tiles">
        {actions.map((a) => (
          <Link key={a.to} to={a.to} className={`tile ${a.cls}`}>
            <h3>{a.title}</h3>
            <p>{a.text}</p>
          </Link>
        ))}
      </section>
      <section className="recent">
        <h2>Recent reports</h2>
        {loading ? (
          <p className="muted" style={{ padding: "1rem 0" }}>Loading latest campus reports…</p>
        ) : recentItems.length === 0 ? (
          <p className="empty">No reports yet. When someone reports an item, it shows up here.</p>
        ) : (
          <div className="cards-grid">
            {recentItems.map((item) => (
              <Link key={item._id} to={`/items/${item._id}`} className="item-card">
                <div className="item-card-media">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} loading="lazy" />
                  ) : (
                    <div className="no-img">No Image Provided</div>
                  )}
                  <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: "6px" }}>
                    <span className={`badge badge-${item.type}`}>{item.type}</span>
                    {item.status === "verified" && (
                      <span className="badge badge-verified">Verified</span>
                    )}
                  </div>
                </div>
                <div className="item-card-body">
                  <div className="item-card-title">{item.title}</div>
                  <div className="item-card-desc">{item.description}</div>
                  <div className="item-card-meta">
                    <span>📍 {item.location}</span>
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
