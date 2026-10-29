import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import AuthShell from "../components/AuthShell.jsx";
import Field from "../components/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const DEPARTMENTS = ["CSE", "CSE-AI", "IT", "ECE", "EEE", "Mechanical", "Civil"];
const SECTIONS = ["A", "B", "C", "D"];

export default function Register() {
  const { register, isAuthed } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    rollNumber: "",
    department: "",
    section: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  if (isAuthed) return <Navigate to="/" replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.rollNumber.trim()) e.rollNumber = "Enter your roll number.";
    if (!form.department) e.department = "Select your department.";
    if (!form.section) e.section = "Select your section.";
    if (form.phone && !/^\d{10}$/.test(form.phone)) e.phone = "Use 10 digits.";
    if (form.password.length < 6) e.password = "Use at least 6 characters.";
    if (form.confirm !== form.password) e.confirm = "Passwords don't match.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;
    setBusy(true);
    try {
      const { confirm, ...payload } = form;
      await register(payload);
      navigate("/", { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || "Can't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Takes under a minute."
      footer={<>Have an account? <Link to="/login">Log in</Link></>}
    >
      <form onSubmit={submit} noValidate>
        <Field label="Full name" value={form.name} onChange={set("name")} error={errors.name} autoComplete="name" />
        <Field label="Personal Email" type="email" placeholder="e.g. name@gmail.com" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />

        <div className="row">
          <Field label="Roll number" value={form.rollNumber} onChange={set("rollNumber")} error={errors.rollNumber} />
          <Field label="Phone (optional)" inputMode="numeric" value={form.phone} onChange={set("phone")} error={errors.phone} />
        </div>

        <div className="row">
          <label className="field">
            <span>Department</span>
            <select
              value={form.department}
              onChange={set("department")}
              aria-invalid={!!errors.department}
            >
              <option value="">Select Department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {errors.department && <small className="err">{errors.department}</small>}
          </label>

          <label className="field">
            <span>Section</span>
            <select
              value={form.section}
              onChange={set("section")}
              aria-invalid={!!errors.section}
            >
              <option value="">Select Section</option>
              {SECTIONS.map((sec) => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>
            {errors.section && <small className="err">{errors.section}</small>}
          </label>
        </div>

        <Field label="Password" type="password" value={form.password} onChange={set("password")} error={errors.password} autoComplete="new-password" />
        <Field label="Confirm password" type="password" value={form.confirm} onChange={set("confirm")} error={errors.confirm} autoComplete="new-password" />
        {serverError && <p className="banner-err" role="alert">{serverError}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
      </form>
    </AuthShell>
  );
}
