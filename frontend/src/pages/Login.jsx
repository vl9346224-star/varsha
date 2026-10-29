import { useState } from "react";
import { Link, useNavigate, useLocation, Navigate, useSearchParams } from "react-router-dom";
import AuthShell from "../components/AuthShell.jsx";
import Field from "../components/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, logout, isAuthed, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get("type") === "admin" ? "admin" : "student";
  const [loginType, setLoginType] = useState(initialType);
  const from = location.state?.from?.pathname;

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  if (isAuthed) {
    return <Navigate to={user?.role === "admin" ? "/admin" : "/"} replace />;
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password) e.password = "Enter your password.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;
    setBusy(true);
    try {
      const loggedUser = await login(form);
      if (loginType === "admin") {
        if (loggedUser?.role !== "admin") {
          logout();
          setServerError("Access denied. Only administrators can use Admin Login.");
          return;
        }
        navigate(from || "/admin", { replace: true });
      } else {
        if (loggedUser?.role === "admin") {
          logout();
          setServerError("Administrator account detected. Please use Admin Login.");
          return;
        }
        navigate(from || "/", { replace: true });
      }
    } catch (err) {
      setServerError(err.response?.data?.message || "Can't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={loginType === "admin" ? "Admin Login" : "Student Login"}
      footer={
        loginType === "admin" ? (
          <>
            Looking for student access?{" "}
            <button
              type="button"
              onClick={() => {
                setLoginType("student");
                setServerError("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--ink)",
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              Student Login
            </button>
          </>
        ) : (
          <>
            New here? <Link to="/register">Create an account</Link>
          </>
        )
      }
    >
      <form onSubmit={submit} noValidate>
        <div className="row-btns" style={{ marginBottom: "1.2rem" }}>
          <button
            type="button"
            className={`btn ${loginType === "student" ? "btn-primary" : "btn-ghost"}`}
            style={{ flex: 1, marginTop: 0, padding: ".5rem .6rem", fontSize: ".9rem" }}
            onClick={() => {
              setLoginType("student");
              setServerError("");
              setErrors({});
            }}
          >
            Student Login
          </button>
          <button
            type="button"
            className={`btn ${loginType === "admin" ? "btn-primary" : "btn-ghost"}`}
            style={{ flex: 1, marginTop: 0, padding: ".5rem .6rem", fontSize: ".9rem" }}
            onClick={() => {
              setLoginType("admin");
              setServerError("");
              setErrors({});
            }}
          >
            Admin Login
          </button>
        </div>

        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
          autoComplete="email"
        />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
          autoComplete="current-password"
        />
        {serverError && <p className="banner-err" role="alert">{serverError}</p>}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Logging in…" : loginType === "admin" ? "Log in as Admin" : "Log in as Student"}
        </button>
      </form>
    </AuthShell>
  );
}
