import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isDemoMode } from "../../lib/supabase";
import { useAuth } from "../../context/useAuth";

const AMENITIES = ["water", "electricity", "parking", "security", "wifi", "furnished", "garden", "gym"];
const TYPES = ["apartment", "house", "bedsitter", "single_room", "studio"];
const AREAS = ["Town Centre", "Kirimari", "Kithimu", "Ngandori", "Runyenjes", "Ishiara", "Siakago", "Other"];

export default function AddPropertyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", description: "", location: "", area: "Town Centre",
    price: "", bedrooms: 1, bathrooms: 1, property_type: "apartment",
    amenities: [], images: [],
  });
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function handle(field) { return (e) => setForm(f => ({ ...f, [field]: e.target.value })); }

  function toggleAmenity(a) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a]
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setUploading(true);

    if (isDemoMode) {
      setError("Supabase is not configured. Configure your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to enable adding properties.");
      setUploading(false);
      return;
    }

    if (!user) {
      setError("You must be signed in to add a property.");
      setUploading(false);
      navigate('/login');
      return;
    }

    // Upload images
    const imagePaths = [];
    const uploadErrors = [];
    for (const file of files) {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/\s/g, "_")}`;
      try {
        const { error: uploadErr } = await supabase.storage.from("house-images").upload(path, file);
        if (uploadErr) {
          uploadErrors.push(uploadErr.message || String(uploadErr));
        } else {
          imagePaths.push(path);
        }
      } catch (err) {
        uploadErrors.push(err.message || String(err));
      }
    }

    if (uploadErrors.length > 0) {
      setUploading(false);
      setError("One or more image uploads failed: " + uploadErrors[0]);
      return;
    }

    // Insert property
    const { error: insertErr } = await supabase.from("properties").insert({
      landlord_id: user.id,
      title: form.title,
      description: form.description,
      location: form.location,
      area: form.area,
      price: parseFloat(form.price),
      bedrooms: parseInt(form.bedrooms),
      bathrooms: parseInt(form.bathrooms),
      property_type: form.property_type,
      amenities: form.amenities,
      images: imagePaths,
      status: "verified",
      is_available: true,
    });

    setUploading(false);
    if (insertErr) { setError(insertErr.message || "Failed to submit property"); return; }
    navigate("/landlord");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Add New Property</h1>
        <p className="text-gray-500 mt-1">Your listing will go live immediately after submission.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Title *</label>
            <input value={form.title} onChange={handle("title")} required placeholder="e.g. Spacious 2-Bedroom in Embu Town" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={handle("description")} rows={4} placeholder="Describe the property, surroundings, nearby amenities..." className="input-field resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Address *</label>
              <input value={form.location} onChange={handle("location")} required placeholder="Street, Estate, Embu" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Area *</label>
              <select value={form.area} onChange={handle("area")} className="input-field">
                {AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Property specifics */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Property Details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Rent (KES/mo) *</label>
              <input type="number" value={form.price} onChange={handle("price")} required min={0} placeholder="10000" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bedrooms</label>
              <select value={form.bedrooms} onChange={handle("bedrooms")} className="input-field">
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bathrooms</label>
              <select value={form.bathrooms} onChange={handle("bathrooms")} className="input-field">
                {[1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select value={form.property_type} onChange={handle("property_type")} className="input-field">
                {TYPES.map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map(a => (
              <button key={a} type="button" onClick={() => toggleAmenity(a)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all capitalize ${
                  form.amenities.includes(a)
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
                }`}>
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Photos</h2>
          <input type="file" multiple accept="image/*" onChange={(e) => setFiles([...e.target.files])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
          {files.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">{files.length} image{files.length > 1 ? "s" : ""} selected</p>
          )}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate("/landlord")} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={uploading} className="btn-primary flex-1">
            {uploading ? "Uploading & Submitting..." : "Submit for Review"}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">Make sure the property details are accurate before publishing.</p>
      </form>
    </div>
  );
}