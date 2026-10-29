import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api.js";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "id_card", label: "ID Card" },
  { value: "phone", label: "Phone" },
  { value: "wallet", label: "Wallet" },
  { value: "books", label: "Books" },
  { value: "calculator", label: "Calculator" },
  { value: "bag", label: "Bag" },
  { value: "other", label: "Other" },
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || "";
  const category = searchParams.get("category") || "";
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const updateParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val);
    else next.delete(key);
    next.set("page", "1");
    setSearchParams(next);
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const params = {
        q: q || undefined,
        type: type || undefined,
        category: category || undefined,
        status: status || undefined,
        page,
        limit: 9,
      };
      const res = await api.get("/search", { params });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (error) {
      setErr("Failed to load items. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  }, [q, type, category, status, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "2.2rem" }}>Search & Browse Campus Items</h1>
        <p className="muted">
          Find lost belongings, search found notices, and filter by campus location or category.
        </p>
      </div>

      <div className="search-bar-wrap">
        <div className="search-row">
          <input
            type="text"
            className="search-input"
            placeholder="Search by keywords, item name, or location..."
            value={q}
            onChange={(e) => updateParam("q", e.target.value)}
          />

          <select
            className="filter-select"
            value={type}
            onChange={(e) => updateParam("type", e.target.value)}
          >
            <option value="">All Types (Lost & Found)</option>
            <option value="lost">Lost Items Only</option>
            <option value="found">Found Items Only</option>
          </select>

          <select
            className="filter-select"
            value={status}
            onChange={(e) => updateParam("status", e.target.value)}
          >
            <option value="">All Active Statuses</option>
            <option value="verified">Verified Only</option>
            <option value="pending">Pending Verification</option>
            <option value="recovered">Recovered Items</option>
          </select>
        </div>

        <div className="chips-bar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              className={`chip-btn ${category === cat.value ? "active" : ""}`}
              onClick={() => updateParam("category", cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {err && <p className="banner-err">{err}</p>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="muted" style={{ margin: 0 }}>
          {loading ? "Searching..." : `Showing ${items.length} of ${total} items`}
        </p>
        <div style={{ display: "flex", gap: ".5rem" }}>
          <Link to="/report-lost" className="btn btn-primary" style={{ width: "auto", fontSize: ".85rem", padding: ".4rem .8rem" }}>
            + Report Lost
          </Link>
          <Link to="/report-found" className="btn btn-ghost" style={{ width: "auto", fontSize: ".85rem", padding: ".4rem .8rem" }}>
            + Report Found
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="center-note">Loading campus items…</p>
      ) : items.length === 0 ? (
        <div className="empty" style={{ marginTop: "1.5rem", textAlign: "center", padding: "3rem 1rem" }}>
          <h3>No items found</h3>
          <p className="muted" style={{ margin: ".5rem 0 1.2rem" }}>
            Try adjusting your search terms, changing category filters, or filing a new report.
          </p>
          <button
            className="btn btn-ghost"
            onClick={() => setSearchParams(new URLSearchParams())}
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {items.map((item) => (
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
                  {item.status === "recovered" && (
                    <span className="badge badge-recovered">Recovered</span>
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

      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "2.5rem", alignItems: "center" }}>
          <button
            className="btn btn-ghost"
            disabled={page <= 1}
            onClick={() => updateParam("page", String(page - 1))}
          >
            ← Previous
          </button>
          <span style={{ fontWeight: 700 }}>
            Page {page} of {pages}
          </span>
          <button
            className="btn btn-ghost"
            disabled={page >= pages}
            onClick={() => updateParam("page", String(page + 1))}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
