import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api.js";

export default function MyReports() {
  const location = useLocation();
  const [tab, setTab] = useState("all");
  const [reports, setReports] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(location.state?.flash || "");
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [itemsRes, claimsRes] = await Promise.all([
        api.get("/items/my"),
        api.get("/claims/my"),
      ]);
      setReports(itemsRes.data || []);
      setMyClaims(claimsRes.data || []);
    } catch (e) {
      setError("Failed to fetch reports. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarkRecovered = async (id) => {
    if (!window.confirm("Mark this item as recovered?")) return;
    try {
      await api.patch(`/items/${id}/recovered`);
      setFlash("Item marked as recovered!");
      fetchData();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update item.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this report?")) return;
    try {
      await api.delete(`/items/${id}`);
      setFlash("Report deleted.");
      fetchData();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to delete item.");
    }
  };

  const filteredReports = reports.filter((r) => {
    if (tab === "all") return true;
    if (tab === "lost") return r.type === "lost";
    if (tab === "found") return r.type === "found";
    if (tab === "recovered") return r.status === "recovered";
    return true;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "2.2rem" }}>My Campus Reports & Claims</h1>
          <p className="muted">
            Track reports you filed and monitor status of ownership claims you submitted.
          </p>
        </div>
        <div style={{ display: "flex", gap: ".5rem" }}>
          <Link to="/report-lost" className="btn btn-primary" style={{ width: "auto" }}>
            + Report Lost Item
          </Link>
          <Link to="/report-found" className="btn btn-ghost" style={{ width: "auto" }}>
            + Report Found Item
          </Link>
        </div>
      </div>

      {flash && <p className="banner-ok" role="status" style={{ marginBottom: "1rem" }}>{flash}</p>}
      {error && <p className="banner-err" role="alert" style={{ marginBottom: "1rem" }}>{error}</p>}

      <div className="tab-bar">
        <button
          className={`tab-btn ${tab === "all" ? "active" : ""}`}
          onClick={() => setTab("all")}
        >
          All Reports ({reports.length})
        </button>
        <button
          className={`tab-btn ${tab === "lost" ? "active" : ""}`}
          onClick={() => setTab("lost")}
        >
          Lost Items ({reports.filter((r) => r.type === "lost").length})
        </button>
        <button
          className={`tab-btn ${tab === "found" ? "active" : ""}`}
          onClick={() => setTab("found")}
        >
          Found Items ({reports.filter((r) => r.type === "found").length})
        </button>
        <button
          className={`tab-btn ${tab === "recovered" ? "active" : ""}`}
          onClick={() => setTab("recovered")}
        >
          Recovered ({reports.filter((r) => r.status === "recovered").length})
        </button>
        <button
          className={`tab-btn ${tab === "claims" ? "active" : ""}`}
          onClick={() => setTab("claims")}
        >
          My Claims ({myClaims.length})
        </button>
      </div>

      {loading ? (
        <p className="center-note">Loading your records…</p>
      ) : tab === "claims" ? (
        /* Claims filed by the student */
        myClaims.length === 0 ? (
          <div className="empty">
            <h3>No claims filed yet</h3>
            <p className="muted">When you see a found item that belongs to you, you can file a claim from its details page.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {myClaims.map((claim) => (
              <div key={claim._id} className="stat-card" style={{ background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: ".5rem" }}>
                  <div>
                    <h3 style={{ margin: "0 0 .3rem" }}>
                      Item: <Link to={`/items/${claim.item?._id}`}>{claim.item?.title || "Item"}</Link>
                    </h3>
                    <p className="muted" style={{ margin: 0, fontSize: ".85rem" }}>
                      Filed on {new Date(claim.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`badge badge-${claim.status}`}>
                    Claim Status: {claim.status}
                  </span>
                </div>

                <div style={{ background: "var(--mist)", padding: ".85rem", borderRadius: "8px", margin: "1rem 0" }}>
                  <strong>Your Proof Details:</strong>
                  <p style={{ margin: ".3rem 0 .5rem", whiteSpace: "pre-wrap" }}>{claim.proofDescription}</p>
                  <strong>Provided Identifiers:</strong>
                  <p style={{ margin: ".3rem 0 0", whiteSpace: "pre-wrap" }}>{claim.uniqueIdentifiers}</p>
                </div>

                {claim.ownerRemarks && (
                  <p style={{ margin: 0, fontSize: ".9rem" }}>
                    <strong>Reporter Remarks:</strong> {claim.ownerRemarks}
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        /* Reports created by student */
        filteredReports.length === 0 ? (
          <div className="empty">
            <h3>No reports in this category</h3>
            <p className="muted">You haven't filed any reports under this tab yet.</p>
          </div>
        ) : (
          <div className="cards-grid">
            {filteredReports.map((item) => (
              <div key={item._id} className="item-card">
                <div className="item-card-media">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} />
                  ) : (
                    <div className="no-img">No Image Provided</div>
                  )}
                  <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: "6px" }}>
                    <span className={`badge badge-${item.type}`}>{item.type}</span>
                    <span className={`badge badge-${item.status}`}>{item.status}</span>
                  </div>
                </div>
                <div className="item-card-body">
                  <div className="item-card-title">{item.title}</div>
                  <div className="item-card-desc">{item.description}</div>
                  <div className="item-card-meta">
                    <span>📍 {item.location}</span>
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>

                  <div className="row-btns" style={{ marginTop: "1rem" }}>
                    <Link
                      to={`/items/${item._id}`}
                      className="btn btn-ghost"
                      style={{ flex: 1, padding: ".4rem", fontSize: ".85rem", textAlign: "center" }}
                    >
                      View
                    </Link>
                    {item.status !== "recovered" && (
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1, padding: ".4rem", fontSize: ".85rem", marginTop: 0 }}
                        onClick={() => handleMarkRecovered(item._id)}
                      >
                        Recovered
                      </button>
                    )}
                    <button
                      className="btn btn-ghost"
                      style={{ padding: ".4rem .6rem", fontSize: ".85rem", borderColor: "var(--danger)", color: "var(--danger)" }}
                      onClick={() => handleDelete(item._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
