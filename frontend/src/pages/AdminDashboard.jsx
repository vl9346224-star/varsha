import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("pending");
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");

  // Remove modal
  const [removeId, setRemoveId] = useState(null);
  const [removeReason, setRemoveReason] = useState("");
  const [removeHard, setRemoveHard] = useState(false);
  const [removeBusy, setRemoveBusy] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (e) {}
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (tab === "pending") params.status = "pending";
      else if (tab === "verified") params.status = "verified";
      else if (tab === "recovered") params.status = "recovered";
      else if (tab === "removed") params.status = "removed";

      const res = await api.get("/admin/reports", { params });
      setReports(res.data.items || []);
    } catch (e) {
      setError("Failed to fetch reports for moderation.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.users || []);
    } catch (e) {
      setError("Failed to fetch user directory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (tab === "users") {
      fetchUsers();
    } else {
      fetchReports();
    }
  }, [tab, fetchReports, fetchUsers]);

  const handleVerify = async (id) => {
    try {
      await api.patch(`/admin/reports/${id}/verify`);
      setFlash("Report verified successfully! Live alert pushed to campus.");
      fetchStats();
      fetchReports();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to verify report.");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/admin/reports/${id}/status`, { status: newStatus });
      setFlash(`Status changed to ${newStatus}.`);
      fetchStats();
      fetchReports();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update status.");
    }
  };

  const handleRemoveSubmit = async (e) => {
    e.preventDefault();
    setRemoveBusy(true);
    try {
      await api.delete(`/admin/reports/${removeId}${removeHard ? "?hard=true" : ""}`, {
        data: { reason: removeReason || "Removed by admin moderation" },
      });
      setFlash("Report removed.");
      setRemoveId(null);
      setRemoveReason("");
      fetchStats();
      fetchReports();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to remove report.");
    } finally {
      setRemoveBusy(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "2.2rem" }}>Admin Moderation & Analytics</h1>
        <p className="muted">
          Review pending lost & found listings, verify authenticity, moderate flagged reports, and manage campus users.
        </p>
      </div>

      {flash && <p className="banner-ok" role="status" style={{ marginBottom: "1rem" }}>{flash}</p>}
      {error && <p className="banner-err" role="alert" style={{ marginBottom: "1rem" }}>{error}</p>}

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-num">{stats.total}</div>
            <div className="stat-label">Total Reports</div>
          </div>
          <div className="stat-card" style={{ borderColor: stats.byStatus.pending > 0 ? "var(--tag)" : "var(--ink)" }}>
            <div className="stat-num" style={{ color: stats.byStatus.pending > 0 ? "#856404" : "inherit" }}>
              {stats.byStatus.pending}
            </div>
            <div className="stat-label">Pending Verification</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: "var(--ok)" }}>{stats.byStatus.verified}</div>
            <div className="stat-label">Verified Listings</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: "var(--teal)" }}>{stats.byStatus.recovered}</div>
            <div className="stat-label">Recovered & Returned</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{stats.users}</div>
            <div className="stat-label">Registered Students</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${tab === "pending" ? "active" : ""}`}
          onClick={() => setTab("pending")}
        >
          Pending Queue ({stats?.byStatus?.pending ?? 0})
        </button>
        <button
          className={`tab-btn ${tab === "all" ? "active" : ""}`}
          onClick={() => setTab("all")}
        >
          All Reports
        </button>
        <button
          className={`tab-btn ${tab === "verified" ? "active" : ""}`}
          onClick={() => setTab("verified")}
        >
          Verified
        </button>
        <button
          className={`tab-btn ${tab === "recovered" ? "active" : ""}`}
          onClick={() => setTab("recovered")}
        >
          Recovered
        </button>
        <button
          className={`tab-btn ${tab === "users" ? "active" : ""}`}
          onClick={() => setTab("users")}
        >
          Campus User Directory
        </button>
      </div>

      {loading ? (
        <p className="center-note">Loading moderation data…</p>
      ) : tab === "users" ? (
        /* User directory tab */
        <div className="table-wrap">
          <table className="clean-table">
            <thead>
              <tr>
                <th>Student / Staff Name</th>
                <th>Email</th>
                <th>Roll Number</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>{u.rollNumber || "—"}</td>
                  <td>{u.phone || "—"}</td>
                  <td>
                    <span className={`badge ${u.role === "admin" ? "badge-found" : ""}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Reports moderation tab */
        reports.length === 0 ? (
          <div className="empty">
            <h3>No reports in this queue</h3>
            <p className="muted">All submissions under this category are up to date.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Item Details</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Reported By</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Moderation Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <strong>
                        <Link to={`/items/${item._id}`}>{item.title}</Link>
                      </strong>
                      <div className="muted" style={{ fontSize: ".8rem" }}>
                        {item.description.slice(0, 50)}...
                      </div>
                    </td>
                    <td><span className={`badge badge-${item.type}`}>{item.type}</span></td>
                    <td>{item.category}</td>
                    <td>📍 {item.location}</td>
                    <td>
                      <div>{item.reportedBy?.name || "Student"}</div>
                      <small className="muted">{item.reportedBy?.email}</small>
                    </td>
                    <td>{new Date(item.date).toLocaleDateString()}</td>
                    <td>
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item._id, e.target.value)}
                        style={{ padding: ".2rem .4rem", fontSize: ".85rem", borderRadius: "6px" }}
                      >
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="recovered">Recovered</option>
                        <option value="removed">Removed</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                        {item.status === "pending" && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: ".25rem .5rem", fontSize: ".8rem", width: "auto", marginTop: 0 }}
                            onClick={() => handleVerify(item._id)}
                          >
                            ✓ Verify
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: ".25rem .5rem", fontSize: ".8rem", borderColor: "var(--danger)", color: "var(--danger)" }}
                          onClick={() => {
                            setRemoveId(item._id);
                            setRemoveReason("");
                            setRemoveHard(false);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Remove Moderation Modal */}
      {removeId && (
        <div className="modal-backdrop" onClick={() => setRemoveId(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Moderate / Remove Report</h2>
            <p className="muted">
              Specify a reason to explain to the student why this report was moderated.
            </p>

            <form onSubmit={handleRemoveSubmit}>
              <label className="field">
                <span>Reason for Removal</span>
                <input
                  type="text"
                  placeholder="e.g. Duplicate report, spam content, inappropriate details..."
                  value={removeReason}
                  onChange={(e) => setRemoveReason(e.target.value)}
                  required
                />
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: ".6rem", margin: "1rem 0", fontSize: ".9rem" }}>
                <input
                  type="checkbox"
                  checked={removeHard}
                  onChange={(e) => setRemoveHard(e.target.checked)}
                />
                <span>Hard delete (permanently remove record and photo from database)</span>
              </label>

              <div className="row-btns">
                <button
                  className="btn btn-primary"
                  style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
                  disabled={removeBusy}
                >
                  {removeBusy ? "Removing…" : "Confirm Removal"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setRemoveId(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
