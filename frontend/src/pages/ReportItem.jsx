import { useState, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../services/api.js";
import Field from "../components/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const CATEGORIES = [
  { value: "id_card", label: "College ID Card" },
  { value: "phone", label: "Smartphone / Mobile" },
  { value: "wallet", label: "Wallet / Purse / Money" },
  { value: "books", label: "Books / Study Material" },
  { value: "calculator", label: "Scientific Calculator" },
  { value: "bag", label: "Bag / Backpack" },
  { value: "other", label: "Other Accessory / Electronics" },
];

export default function ReportItem({ itemType }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLost = itemType ? itemType === "lost" : location.pathname.includes("lost");
  const type = isLost ? "lost" : "found";

  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    title: "",
    category: "id_card",
    location: "",
    date: new Date().toISOString().split("T")[0],
    contactInfo: user?.phone || user?.email || "",
    description: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return setErr("Only image files (.jpg, .jpeg, .png, .webp) are allowed.");
    }
    if (file.size > 5 * 1024 * 1024) {
      return setErr("Image size cannot exceed 5MB.");
    }

    setErr("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!form.title.trim()) return setErr("Please provide an item title.");
    if (!form.location.trim()) return setErr("Please specify the location.");
    if (!form.date) return setErr("Please select the date.");
    if (!form.contactInfo.trim()) return setErr("Please provide contact information.");
    if (!form.description.trim()) return setErr("Please provide a description of the item.");

    setBusy(true);
    try {
      const data = new FormData();
      data.append("title", form.title.trim());
      data.append("category", form.category);
      data.append("location", form.location.trim());
      data.append("date", form.date);
      data.append("contactInfo", form.contactInfo.trim());
      data.append("description", form.description.trim());
      if (imageFile) {
        data.append("image", imageFile);
      }

      const res = await api.post(`/items/${type}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate(`/items/${res.data._id}`, {
        state: { flash: `Item reported successfully as ${type}!` },
      });
    } catch (error) {
      setErr(error.response?.data?.message || "Failed to submit report. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <span className={`badge badge-${type}`} style={{ marginBottom: ".5rem" }}>
          {isLost ? "Reporting Lost Item" : "Reporting Found Item"}
        </span>
        <h1 style={{ fontSize: "2.2rem" }}>
          {isLost ? "What did you lose?" : "What did you find?"}
        </h1>
        <p className="muted">
          {isLost
            ? "Submit accurate item information so campus finders can identify and match your item."
            : "Describe where and when you found it to help the rightful owner claim it."}
        </p>
      </div>

      {err && <p className="banner-err" role="alert">{err}</p>}

      <form onSubmit={submit} className="profile-form" noValidate>
        <Field
          label="Item title"
          placeholder="e.g. Casio fx-991ES Calculator, Blue Titan Fastrack Bag"
          value={form.title}
          onChange={set("title")}
          required
        />

        <div className="row">
          <label className="field">
            <span>Category</span>
            <select value={form.category} onChange={set("category")}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <Field
            label={isLost ? "Date Lost" : "Date Found"}
            type="date"
            value={form.date}
            onChange={set("date")}
            required
          />
        </div>

        <Field
          label={isLost ? "Last Seen Location" : "Found Location"}
          placeholder="e.g. Library 2nd floor, Canteen counter, CSE Lab 3"
          value={form.location}
          onChange={set("location")}
          required
        />

        <Field
          label="Contact Information"
          placeholder="Phone number, email or hostel room"
          value={form.contactInfo}
          onChange={set("contactInfo")}
          required
        />

        <label className="field">
          <span>Detailed Description</span>
          <textarea
            placeholder="Describe color, brand, condition, identifying stickers, marks, or serial numbers..."
            value={form.description}
            onChange={set("description")}
            required
          />
          <small className="hint">
            {isLost
              ? "Include distinguishing features only the owner would know."
              : "Keep unique secret details hidden so the claimant can verify ownership."}
          </small>
        </label>

        <label className="field">
          <span>Item Photo (Optional but recommended)</span>
          <div
            className="drop-zone"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleFileChange}
            />
            <p style={{ margin: 0, fontWeight: 600 }}>
              {imageFile ? imageFile.name : "Click or drop an image file here"}
            </p>
            <small className="hint">JPG, PNG, or WEBP up to 5MB</small>
          </div>
        </label>

        {imagePreview && (
          <div className="img-preview-box">
            <img src={imagePreview} alt="Preview" className="img-preview" />
            <div style={{ flex: 1 }}>
              <strong>{imageFile?.name}</strong>
              <div className="muted" style={{ fontSize: ".8rem" }}>
                {(imageFile.size / 1024).toFixed(1)} KB
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: ".3rem .6rem", fontSize: ".85rem" }}
              onClick={removeImage}
            >
              Remove
            </button>
          </div>
        )}

        <div className="row-btns" style={{ marginTop: "1.5rem" }}>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Submitting Report…" : isLost ? "Submit Lost Report" : "Submit Found Report"}
          </button>
          <Link to="/" className="btn btn-ghost" style={{ textAlign: "center" }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
