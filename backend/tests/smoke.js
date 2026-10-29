// Runs through the whole API against a RUNNING server.
// Usage:  npm run test:smoke
// Optional admin checks: set ADMIN_EMAIL and ADMIN_PASSWORD (create one with `npm run create-admin`)
// PowerShell:  $env:ADMIN_EMAIL="admin@campus.edu"; $env:ADMIN_PASSWORD="Admin@12345"; npm run test:smoke
const BASE = process.env.BASE_URL || "http://localhost:5000";
let pass = 0, fail = 0;

async function call(method, path, { token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = "Bearer " + token;
  let payload;
  if (body) { headers["Content-Type"] = "application/json"; payload = JSON.stringify(body); }
  if (form) { payload = form; }
  const res = await fetch(BASE + path, { method, headers, body: payload });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  return { status: res.status, data };
}

function check(name, ok, extra = "") {
  if (ok) { pass++; console.log("  PASS", name); }
  else { fail++; console.log("  FAIL", name, extra); }
}

function itemForm(over = {}) {
  const f = new FormData();
  const v = { title: "Blue wallet", description: "Lost near the library", category: "wallet",
    location: "Library", date: "2026-10-01", contactInfo: "9999999999", ...over };
  Object.entries(v).forEach(([k, val]) => f.append(k, val));
  return f;
}

(async () => {
  // Test with personal email (e.g. Gmail)
  const email = `student${Date.now()}@gmail.com`;
  const password = "secret123";

  console.log("AUTH (Member 1 - Registration with Dept & Section, Personal Email Login)");
  // Missing department/section check
  let r = await call("POST", "/api/auth/register", { body: { name: "Test Student", email, password, rollNumber: "21691A0501" } });
  check("register missing dept/sec -> 400", r.status === 400);

  // Complete registration with personal email, department, and section
  r = await call("POST", "/api/auth/register", {
    body: {
      name: "Test Student",
      email,
      password,
      rollNumber: "21691A0501",
      department: "CSE",
      section: "A",
    },
  });
  check("register with personal email, CSE, section A -> 201", r.status === 201 && r.data.user?.department === "CSE" && r.data.user?.section === "A");

  r = await call("POST", "/api/auth/register", {
    body: { name: "Dup", email, password, department: "CSE", section: "A" },
  });
  check("duplicate email -> 409", r.status === 409);

  r = await call("POST", "/api/auth/login", { body: { email, password: "wrong" } });
  check("wrong password -> 401", r.status === 401);

  // Login with personal email
  r = await call("POST", "/api/auth/login", { body: { email, password } });
  check("login with personal email -> 200 + token", r.status === 200 && !!r.data.token && r.data.user?.department === "CSE");
  const token = r.data.token;

  r = await call("GET", "/api/auth/me", { token });
  check("me -> 200 preserves dept & section", r.status === 200 && r.data.email === email && r.data.department === "CSE" && r.data.section === "A");

  // Edit profile and verify department & section persistence
  r = await call("PUT", "/api/auth/me", {
    token,
    body: { name: "Updated Student", department: "CSE-AI", section: "B" },
  });
  check("update profile dept & section -> 200", r.status === 200 && r.data.department === "CSE-AI" && r.data.section === "B");

  r = await call("GET", "/api/items/lost");
  check("no token -> 401", r.status === 401);

  console.log("ITEMS (Member 2)");
  r = await call("POST", "/api/items/lost", { token, form: itemForm() });
  check("report lost -> 201", r.status === 201, JSON.stringify(r.data));
  const lostId = r.data && r.data._id;
  r = await call("POST", "/api/items/found", { token, form: itemForm({ title: "Black phone", category: "phone", location: "Canteen" }) });
  check("report found -> 201", r.status === 201);
  const foundId = r.data && r.data._id;
  r = await call("POST", "/api/items/lost", { token, form: itemForm({ category: "spaceship" }) });
  check("bad category -> 400", r.status === 400);
  r = await call("POST", "/api/items/lost", { token, form: (() => { const f = new FormData(); f.append("title", "x"); return f; })() });
  check("missing fields -> 400", r.status === 400);
  r = await call("GET", "/api/items/lost", { token });
  check("list lost -> 200", r.status === 200 && Array.isArray(r.data));
  r = await call("GET", "/api/items/my", { token });
  check("my reports -> 2 items", r.status === 200 && r.data.length === 2);
  r = await call("GET", "/api/items/" + lostId, { token });
  check("item details -> 200", r.status === 200 && r.data._id === lostId);
  r = await call("GET", "/api/items/notanid", { token });
  check("bad id -> 400", r.status === 400);
  const fe = new FormData(); fe.append("title", "Brown wallet");
  r = await call("PUT", "/api/items/" + lostId, { token, form: fe });
  check("edit own -> 200", r.status === 200 && r.data.title === "Brown wallet");

  console.log("SEARCH & FILTERS (Member 3)");
  r = await call("GET", "/api/search?q=wallet", { token });
  check("search q=wallet finds item", r.status === 200 && r.data.items.some((i) => i._id === lostId));
  r = await call("GET", "/api/search?category=phone&type=found", { token });
  check("filter category+type", r.status === 200 && r.data.items.every((i) => i.category === "phone"));
  r = await call("GET", "/api/search?category=nope", { token });
  check("search bad category -> 400", r.status === 400);
  r = await call("GET", "/api/search?limit=1&page=1", { token });
  check("pagination limit=1", r.status === 200 && r.data.items.length <= 1 && r.data.pages >= 1);
  r = await call("GET", "/api/search/meta", { token });
  check("meta -> categories", r.status === 200 && r.data.categories.includes("wallet"));

  console.log("CLAIMS & VERIFICATION (Member 4)");
  const claimantEmail = `claimant${Date.now()}@gmail.com`;
  r = await call("POST", "/api/auth/register", {
    body: {
      name: "Claimant Student",
      email: claimantEmail,
      password: "password123",
      rollNumber: "21691A0599",
      department: "ECE",
      section: "C",
    },
  });
  check("register claimant student with ECE, Sec C -> 201", r.status === 201 && r.data.user?.department === "ECE");
  const claimantToken = r.data.token;

  r = await call("POST", `/api/claims/${foundId}`, {
    token: claimantToken,
    body: { proofDescription: "It has a cracked glass at top right and my picture inside back cover", uniqueIdentifiers: "IMEI ends with 8821" },
  });
  check("submit claim -> 201", r.status === 201);
  const claimId = r.data && r.data._id;

  r = await call("POST", `/api/claims/${foundId}`, {
    token, // reporter cannot claim own item
    body: { proofDescription: "me", uniqueIdentifiers: "me" },
  });
  check("claim own item -> 400", r.status === 400);

  r = await call("GET", "/api/claims/my", { token: claimantToken });
  check("claimant get my claims -> 200", r.status === 200 && r.data.some((c) => c._id === claimId));

  r = await call("GET", `/api/claims/item/${foundId}`, { token });
  check("item reporter view claims -> 200", r.status === 200 && r.data.length >= 1);

  r = await call("PATCH", `/api/claims/${claimId}/status`, {
    token,
    body: { status: "approved", ownerRemarks: "Verified in person at Canteen" },
  });
  check("approve claim -> 200", r.status === 200 && r.data.status === "approved");

  r = await call("GET", `/api/items/${foundId}`, { token });
  check("item automatically marked recovered upon claim approval", r.status === 200 && r.data.status === "recovered");

  console.log("NOTIFICATIONS & LIVE ALERTS (Member 5)");
  r = await call("GET", "/api/notifications", { token });
  check("reporter received claim notification", r.status === 200 && r.data.notifications.some((n) => n.message.includes("submitted an ownership claim")));

  r = await call("GET", "/api/notifications", { token: claimantToken });
  check("claimant received approval notification", r.status === 200 && r.data.notifications.some((n) => n.message.includes("APPROVED")));

  console.log("ADMIN DASHBOARD (Member 6)");
  r = await call("GET", "/api/admin/stats", { token });
  check("student on admin route -> 403", r.status === 403);
  const adminEmail = process.env.ADMIN_EMAIL || "admin@campus.edu";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";

  r = await call("POST", "/api/auth/login", { body: { email: adminEmail, password: adminPassword } });
  if (r.status === 200) {
    const at = r.data.token;
    check("admin login -> 200", true);
    r = await call("GET", "/api/admin/stats", { token: at });
    check("admin stats -> 200", r.status === 200 && typeof r.data.total === "number");
    r = await call("GET", "/api/admin/reports?status=pending", { token: at });
    check("admin reports queue -> 200", r.status === 200 && Array.isArray(r.data.items));
    r = await call("GET", "/api/admin/users", { token: at });
    check("admin user directory -> 200", r.status === 200 && Array.isArray(r.data.users));
  } else {
    console.log("  (admin login skipped)");
  }

  console.log("CLEANUP");
  r = await call("DELETE", "/api/items/" + lostId, { token });
  check("delete own report -> 200", r.status === 200);

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${pass} PASSED, ${fail} FAILED`);
  console.log(`========================================\n`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("Test run crashed:", e.message, "- is the server running?"); process.exit(1); });
