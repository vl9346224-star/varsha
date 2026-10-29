import { useState } from "react";
import Field from "../components/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const DEPARTMENTS = ["CSE", "CSE-AI", "IT", "ECE", "EEE", "Mechanical", "Civil"];
const SECTIONS = ["A", "B", "C", "D"];

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    rollNumber: user?.rollNumber || "",
    department: user?.department || "",
    section: user?.section || "",
  });
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setPw = (k) => (e) => setPwForm({ ...pwForm, [k]: e.target.value });

  const save = async (ev) => {
    ev.preventDefault();
    setErr("");
    setMsg("");
    if (form.name.trim().length < 2) return setErr("Enter your full name.");
    if (form.phone && !/^\d{10}$/.test(form.phone)) return setErr("Phone must be 10 digits.");
    setBusy(true);
    try {
      await updateProfile(form);
      setMsg("Profile details saved successfully.");
      setEditing(false);
    } catch (e) {
      setErr(e.response?.data?.message || "Couldn't save profile. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async (ev) => {
    ev.preventDefault();
    setErr("");
    setMsg("");
    if (!pwForm.currentPassword) return setErr("Enter your current password.");
    if (pwForm.newPassword.length < 6) return setErr("New password must be at least 6 characters.");
    if (pwForm.newPassword !== pwForm.confirmPassword) return setErr("New passwords do not match.");
    setBusy(true);
    try {
      await updateProfile({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setMsg("Password updated successfully.");
      setChangingPassword(false);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to change password. Check your current password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="profile">
      <div className="profile-head">
        <div className="avatar big">{user?.name?.[0]?.toUpperCase() || "?"}</div>
        <div>
          <h1>{user?.name}</h1>
          <p className="muted">{user?.role === "admin" ? "Admin" : "Student"}</p>
        </div>
      </div>

      {msg && <p className="banner-ok" role="status" style={{ marginBottom: "1rem" }}>{msg}</p>}
      {err && <p className="banner-err" role="alert" style={{ marginBottom: "1rem" }}>{err}</p>}

      {!editing && !changingPassword ? (
        <>
          <dl className="details">
            <div><dt>Email</dt><dd>{user?.email}</dd></div>
            <div><dt>Roll number</dt><dd>{user?.rollNumber || "—"}</dd></div>
            <div><dt>Department</dt><dd>{user?.department || "—"}</dd></div>
            <div><dt>Section</dt><dd>{user?.section ? `Section ${user?.section}` : "—"}</dd></div>
            <div><dt>Phone</dt><dd>{user?.phone || "Not added"}</dd></div>
            <div><dt>Account Role</dt><dd>{user?.role === "admin" ? "Administrator" : "Student"}</dd></div>
          </dl>
          <div className="row-btns">
            <button
              className="btn btn-primary"
              onClick={() => {
                setMsg("");
                setErr("");
                setForm({
                  name: user?.name || "",
                  phone: user?.phone || "",
                  rollNumber: user?.rollNumber || "",
                  department: user?.department || "",
                  section: user?.section || "",
                });
                setEditing(true);
              }}
            >
              Edit profile
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setMsg("");
                setErr("");
                setChangingPassword(true);
              }}
            >
              Change password
            </button>
          </div>
        </>
      ) : editing ? (
        <form onSubmit={save} noValidate className="profile-form">
          <h3>Edit Profile</h3>
          <Field label="Full name" value={form.name} onChange={set("name")} />
          <Field label="Roll number" value={form.rollNumber} onChange={set("rollNumber")} />

          <div className="row">
            <label className="field">
              <span>Department</span>
              <select value={form.department} onChange={set("department")}>
                <option value="">Select Department</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Section</span>
              <select value={form.section} onChange={set("section")}>
                <option value="">Select Section</option>
                {SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Field label="Phone" inputMode="numeric" value={form.phone} onChange={set("phone")} />
          <div className="row-btns" style={{ marginTop: "1rem" }}>
            <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <form onSubmit={savePassword} noValidate className="profile-form">
          <h3>Change Password</h3>
          <Field
            label="Current password"
            type="password"
            value={pwForm.currentPassword}
            onChange={setPw("currentPassword")}
            autoComplete="current-password"
          />
          <Field
            label="New password"
            type="password"
            value={pwForm.newPassword}
            onChange={setPw("newPassword")}
            autoComplete="new-password"
          />
          <Field
            label="Confirm new password"
            type="password"
            value={pwForm.confirmPassword}
            onChange={setPw("confirmPassword")}
            autoComplete="new-password"
          />
          <div className="row-btns" style={{ marginTop: "1rem" }}>
            <button className="btn btn-primary" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setChangingPassword(false);
                setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
