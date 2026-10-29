// Luggage-tag card used by Login and Register
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-wrap">
      <div className="auth-intro">
        <h1>Lost something on campus?</h1>
        <p>Report it. Search it. Get it back. Students and staff help each other find what went missing.</p>
      </div>
      <section className="tag">
        <div className="tag-hole" aria-hidden="true" />
        <h2>{title}</h2>
        {subtitle ? <p className="muted">{subtitle}</p> : null}
        {children}
        <p className="tag-foot">{footer}</p>
      </section>
    </div>
  );
}
