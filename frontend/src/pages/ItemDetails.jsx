import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import Field from "../components/Field.jsx";

export default function ItemDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [item, setItem] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState(location.state?.flash || "");

  // Claim modal state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimProof, setClaimProof] = useState("");
  const [claimIdentifiers, setClaimIdentifiers] = useState("");
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimErr, setClaimErr] = useState("");
  const [claimSuccess, setClaimSuccess] = useState("");

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    location: "",
    contactInfo: "",
    description: "",
  });
  const [editBusy, setEditBusy] = useState(false);
  const [editErr, setEditErr] = useState("");

  const isOwner = user && item?.reportedBy && (item.reportedBy._id === user.id || item.reportedBy === user.id);
  const isAdmin = user?.role === "admin";

  const fetchItem = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/items/${id}`);
      setItem(res.data);
      setEditForm({
        title: res.data.title,
        category: res.data.category,
        location: res.data.location,
        contactInfo: res.data.contactInfo,
        description: res.data.description,
      });

      // If owner or admin, also fetch claims for this item
      if (user && (res.data.reportedBy?._id === user.id || user.role === "admin")) {
        try {
          const claimsRes = await api.get(`/claims/item/${id}`);
          setClaims(claimsRes.data || []);
        } catch (e) {
          // non-critical
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load item details.");
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleMarkRecovered = async () => {
    if (!window.confirm("Are you sure you want to mark this item as recovered?")) return;
    try {
      const res = await api.patch(`/items/${id}/recovered`);
      setItem(res.data);
      setFlash("Item marked as recovered successfully!");
    } catch (e) {
      setError(e.response?.data?.message || "Could not mark as recovered.");
    }
  };

  const handleDeleteItem = async () => {
    if (!window.confirm("Are you sure you want to delete this report? This cannot be undone.")) return;
    try {
      await api.delete(`/items/${id}`);
      navigate("/my-reports", { state: { flash: "Report deleted successfully." } });
    } catch (e) {
      setError(e.response?.data?.message || "Failed to delete report.");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditErr("");
    setEditBusy(true);
    try {
      const res = await api.put(`/items/${id}`, editForm);
      setItem(res.data);
      setShowEditModal(false);
      setFlash("Report updated successfully!");
    } catch (e) {
      setEditErr(e.response?.data?.message || "Failed to update item.");
    } finally {
      setEditBusy(false);
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setClaimErr("");
    if (!claimProof.trim() || !claimIdentifiers.trim()) {
      return setClaimErr("Both proof description and unique identifiers are required.");
    }

    setClaimBusy(true);
    try {
      await api.post(`/claims/${id}`, {
        proofDescription: claimProof.trim(),
        uniqueIdentifiers: claimIdentifiers.trim(),
      });
      setClaimSuccess("Your ownership claim has been submitted to the finder!");
      setTimeout(() => {
        setShowClaimModal(false);
        setClaimProof("");
        setClaimIdentifiers("");
        setClaimSuccess("");
      }, 2000);
    } catch (e) {
      setClaimErr(e.response?.data?.message || "Failed to submit claim.");
    } finally {
      setClaimBusy(false);
    }
  };

  const handleClaimDecision = async (claimId, status) => {
    const action = status === "approved" ? "approve" : "reject";
    const reason = window.prompt(`Enter remarks to ${action} this claim (optional):`);
    if (reason === null) return; // user cancelled

    try {
      await api.patch(`/claims/${claimId}/status`, { status, ownerRemarks: reason });
      setFlash(`Claim ${status} successfully.`);
      fetchItem();
    } catch (e) {
      setError(e.response?.data?.message || `Failed to ${action} claim.`);
    }
  };

  if (loading) return <p className="center-note">Loading item details…</p>;
  if (error || !item) {
    return (
      <div className="empty" style={{ textAlign: "center", padding: "3rem" }}>
        <h2>Item not found</h2>
        <p className="muted">{error || "This item may have been removed or does not exist."}</p>
        <Link to="/search" className="btn btn-primary" style={{ display: "inline-block", width: "auto" }}>
          Back to Search
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <Link to="/search" className="muted" style={{ textDecoration: "none", fontSize: ".9rem" }}>
          ← Back to Search
        </Link>
      </div>

      {flash && <p className="banner-ok" role="status" style={{ marginBottom: "1rem" }}>{flash}</p>}
      {error && <p className="banner-err" role="alert" style={{ marginBottom: "1rem" }}>{error}</p>}

      <div className="item-detail-layout">
        <div className="item-detail-image-wrap">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} />
          ) : (
            <div className="muted" style={{ fontWeight: 600 }}>No image provided</div>
          )}
        </div>

        <div className="item-detail-content">
          <div className="item-detail-badges">
            <span className={`badge badge-${item.type}`}>{item.type}</span>
            <span className="badge">{item.category}</span>
            {item.status === "verified" && <span className="badge badge-verified">Verified</span>}
            {item.status === "recovered" && <span className="badge badge-recovered">Recovered</span>}
            {item.status === "pending" && <span className="badge badge-pending">Pending Admin Verification</span>}
          </div>

          <h1>{item.title}</h1>
          <p className="item-detail-desc">{item.description}</p>

          <dl className="details" style={{ marginBottom: "1.5rem" }}>
            <div>
              <dt>Location</dt>
              <dd>📍 {item.location}</dd>
            </div>
            <div>
              <dt>Date {item.type === "lost" ? "Lost" : "Found"}</dt>
              <dd>📅 {new Date(item.date).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt>Reported By</dt>
              <dd>{item.reportedBy?.name || "Student"} {isOwner && "(You)"}</dd>
            </div>
            <div>
              <dt>Contact Info</dt>
              <dd>📞 {item.contactInfo}</dd>
            </div>
            {item.recoveredAt && (
              <div>
                <dt>Recovered At</dt>
                <dd>✅ {new Date(item.recoveredAt).toLocaleDateString()}</dd>
              </div>
            )}
          </dl>

          {/* Actions for owner */}
          {(isOwner || isAdmin) ? (
            <div className="row-btns" style={{ flexWrap: "wrap" }}>
              {item.status !== "recovered" && (
                <button className="btn btn-primary" onClick={handleMarkRecovered}>
                  Mark as Recovered
                </button>
              )}
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowEditModal(true)}
              >
                Edit Report
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
                onClick={handleDeleteItem}
              >
                Delete
              </button>
            </div>
          ) : (
            /* Actions for other users: Claim Request */
            <div style={{ marginTop: "1rem" }}>
              {item.status !== "recovered" ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowClaimModal(true)}
                >
                  🔒 Claim This Item
                </button>
              ) : (
                <p className="banner-ok" style={{ margin: 0 }}>
                  This item has already been marked as recovered by the owner.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review claims section for Item Owner */}
      {(isOwner || isAdmin) && (
        <div style={{ marginTop: "2.5rem" }}>
          <h2>Ownership Verification & Claims ({claims.length})</h2>
          <p className="muted">
            Students who believe this item belongs to them can submit security verification proof. Review their answers below.
          </p>

          {claims.length === 0 ? (
            <div className="empty" style={{ marginTop: "1rem" }}>
              No claims submitted for this item yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
              {claims.map((claim) => (
                <div key={claim._id} className="stat-card" style={{ background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: ".5rem" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "1.1rem" }}>
                        Claimant: {claim.claimant?.name}
                      </h4>
                      <p className="muted" style={{ margin: ".2rem 0", fontSize: ".85rem" }}>
                        Email: {claim.claimant?.email} | Roll: {claim.claimant?.rollNumber || "N/A"} | Phone: {claim.claimant?.phone || "N/A"}
                      </p>
                    </div>
                    <span className={`badge badge-${claim.status}`}>{claim.status}</span>
                  </div>

                  <div style={{ margin: "1rem 0", background: "var(--mist)", padding: "1rem", borderRadius: "8px" }}>
                    <strong>Detailed Proof:</strong>
                    <p style={{ margin: ".3rem 0 .8rem", whiteSpace: "pre-wrap" }}>{claim.proofDescription}</p>
                    <strong>Unique Identifiers / Serial / Secret Marks:</strong>
                    <p style={{ margin: ".3rem 0 0", whiteSpace: "pre-wrap" }}>{claim.uniqueIdentifiers}</p>
                  </div>

                  {claim.ownerRemarks && (
                    <p className="muted" style={{ fontSize: ".85rem", margin: "0 0 .8rem" }}>
                      <strong>Remarks:</strong> {claim.ownerRemarks}
                    </p>
                  )}

                  {claim.status === "pending" && (
                    <div className="row-btns">
                      <button
                        className="btn btn-primary"
                        style={{ width: "auto", padding: ".4rem .9rem", fontSize: ".85rem" }}
                        onClick={() => handleClaimDecision(claim._id, "approved")}
                      >
                        ✓ Approve Claim & Hand Over
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ width: "auto", padding: ".4rem .9rem", fontSize: ".85rem", borderColor: "var(--danger)", color: "var(--danger)" }}
                        onClick={() => handleClaimDecision(claim._id, "rejected")}
                      >
                        ✕ Reject Claim
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Claim Submission Modal */}
      {showClaimModal && (
        <div className="modal-backdrop" onClick={() => setShowClaimModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Claim "{item.title}"</h2>
            <p className="muted">
              To verify that this item belongs to you, provide specific details that only the true owner would know.
            </p>

            {claimSuccess && <p className="banner-ok">{claimSuccess}</p>}
            {claimErr && <p className="banner-err">{claimErr}</p>}

            {!claimSuccess && (
              <form onSubmit={handleClaimSubmit}>
                <label className="field">
                  <span>Detailed Proof of Ownership</span>
                  <textarea
                    placeholder="Describe specific features (e.g., contents inside the wallet, scratch on bottom left, stickers, protective cover)..."
                    value={claimProof}
                    onChange={(e) => setClaimProof(e.target.value)}
                    required
                  />
                </label>

                <label className="field">
                  <span>Unique Identifiers / Serial Numbers / Secret Details</span>
                  <textarea
                    placeholder="Enter serial number, student ID number inside, exact amount of cash, or lock screen details..."
                    value={claimIdentifiers}
                    onChange={(e) => setClaimIdentifiers(e.target.value)}
                    required
                  />
                  <small className="hint">This info is reviewed securely by the finder to verify your identity.</small>
                </label>

                <div className="row-btns" style={{ marginTop: "1.2rem" }}>
                  <button className="btn btn-primary" disabled={claimBusy}>
                    {claimBusy ? "Submitting Claim…" : "Submit Ownership Claim"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setShowClaimModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Report Details</h2>
            {editErr && <p className="banner-err">{editErr}</p>}

            <form onSubmit={handleEditSubmit}>
              <Field
                label="Item title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
              />

              <Field
                label="Location"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                required
              />

              <Field
                label="Contact Information"
                value={editForm.contactInfo}
                onChange={(e) => setEditForm({ ...editForm, contactInfo: e.target.value })}
                required
              />

              <label className="field">
                <span>Description</span>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  required
                />
              </label>

              <div className="row-btns" style={{ marginTop: "1.2rem" }}>
                <button className="btn btn-primary" disabled={editBusy}>
                  {editBusy ? "Saving Changes…" : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowEditModal(false)}
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
