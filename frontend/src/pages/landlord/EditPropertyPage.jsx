import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { djangoApi, getStorageUrl } from "../../lib/djangoApi";

const AMENITIES = ["water", "electricity", "parking", "security", "wifi", "furnished", "garden", "gym"];
const TYPES = ["apartment", "house", "bedsitter", "single_room", "studio"];
const AREAS = ["Town Centre", "Kirimari", "Kithimu", "Ngandori", "Runyenjes", "Ishiara", "Siakago", "Other"];

export default function EditPropertyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    area: "Town Centre",
    price: "",
    bedrooms: 1,
    bathrooms: 1,
    property_type: "apartment",
    amenities: [],
    images: [],
    is_available: true,
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await djangoApi.properties.get(id);
        if (!mounted) return;
        setForm({
          title: data.title || "",
          description: data.description || "",
          location: data.location || "",
          area: data.area || "Town Centre",
          price: data.price || "",
          bedrooms: data.bedrooms || 1,
          bathrooms: data.bathrooms || 1,
          property_type: data.property_type || "apartment",
          amenities: data.amenities || [],
          images: data.images || [],
          is_available: data.is_available !== false,
        });
      } catch (loadError) {
        if (mounted) setError(loadError?.message || "Property not found.");
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [id]);

  function handle(field) {
    return (e) => setForm((current) => ({ ...current, [field]: e.target.value }));
  }

  function toggleAmenity(amenity) {
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }));
  }

  function removeImage(image) {
    setForm((current) => ({ ...current, images: current.images.filter((item) => item !== image) }));
  }

  async function uploadSelectedFiles() {
    const uploaded = [];
    for (const file of files) {
      const data = await djangoApi.media.upload(file);
      uploaded.push(data.path);
    }
    return uploaded;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const newImages = await uploadSelectedFiles();
      await djangoApi.properties.update(id, {
        title: form.title,
        description: form.description,
        location: form.location,
        area: form.area,
        price: parseFloat(form.price),
        bedrooms: parseInt(form.bedrooms),
        bathrooms: parseInt(form.bathrooms),
        property_type: form.property_type,
        amenities: form.amenities,
        images: [...form.images, ...newImages],
        is_available: form.is_available,
      });
      navigate("/landlord");
    } catch (err) {
      setError(err.message || "Failed to update property.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="skeleton h-10 w-56 rounded mb-6" />
        <div className="card p-6 space-y-4">
          <div className="skeleton h-10 rounded" />
          <div className="skeleton h-28 rounded" />
          <div className="skeleton h-10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Edit Property</h1>
          <p className="text-gray-500 mt-1">Update details, availability, amenities, and photos.</p>
        </div>
        <Link to="/landlord" className="btn-secondary text-sm">Back</Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Title *</label>
            <input value={form.title} onChange={handle("title")} required className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={handle("description")} rows={4} className="input-field resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Address *</label>
              <input value={form.location} onChange={handle("location")} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Area *</label>
              <select value={form.area} onChange={handle("area")} className="input-field">
                {AREAS.map((area) => <option key={area}>{area}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Property Details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Rent (KES/mo) *</label>
              <input type="number" value={form.price} onChange={handle("price")} required min={0} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bedrooms</label>
              <select value={form.bedrooms} onChange={handle("bedrooms")} className="input-field">
                {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bathrooms</label>
              <select value={form.bathrooms} onChange={handle("bathrooms")} className="input-field">
                {[1,2,3].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select value={form.property_type} onChange={handle("property_type")} className="input-field">
                {TYPES.map((type) => <option key={type} value={type}>{type.replace("_", " ")}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={form.is_available}
              onChange={(e) => setForm((current) => ({ ...current, is_available: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-brand-600"
            />
            Available for tenants
          </label>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((amenity) => (
              <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all capitalize ${
                  form.amenities.includes(amenity)
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
                }`}>
                {amenity}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Photos</h2>
          {form.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {form.images.map((image) => (
                <div key={image} className="relative overflow-hidden rounded-xl bg-gray-100">
                  <img src={getStorageUrl(image)} alt="" className="aspect-[4/3] w-full object-cover" />
                  <button type="button" onClick={() => removeImage(image)}
                    className="absolute right-2 top-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-red-600 shadow-sm">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <input type="file" multiple accept="image/*" onChange={(e) => setFiles([...e.target.files])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
          {files.length > 0 && (
            <p className="text-xs text-gray-500">{files.length} new image{files.length > 1 ? "s" : ""} selected</p>
          )}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate("/landlord")} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
