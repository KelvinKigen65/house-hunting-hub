import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase, getStorageUrl } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const PLACEHOLDER = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80";
const AMENITY_ICONS = {
  water: "💧", electricity: "⚡", parking: "🚗", security: "🔒",
  wifi: "📶", furnished: "🛋️", garden: "🌳", gym: "🏋️",
};

export default function PropertyDetailPage() {
  const { id } = useParams();
  const { user, profile, isTenant } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [landlord, setLandlord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("booking"); // booking | inquiry

  // Booking form
  const [bookDate, setBookDate] = useState("");
  const [bookTime, setBookTime] = useState("10:00 AM");
  const [bookMsg, setBookMsg] = useState("");
  const [bookLoading, setBookLoading] = useState(false);
  const [bookSuccess, setBookSuccess] = useState(false);

  // Inquiry form
  const [inqMsg, setInqMsg] = useState("");
  const [inqLoading, setInqLoading] = useState(false);
  const [inqSuccess, setInqSuccess] = useState(false);

  useEffect(() => {
    fetchProperty();
    if (user) checkSaved();
  }, [id]);

  async function fetchProperty() {
    const { data } = await supabase.from("properties").select("*").eq("id", id).single();
    if (!data) { setLoading(false); return; }
    setProperty(data);
    // Increment views
    supabase.from("properties").update({ views_count: (data.views_count || 0) + 1 }).eq("id", id);
    // Fetch landlord
    const { data: lData } = await supabase.from("profiles").select("full_name, phone, avatar_url").eq("id", data.landlord_id).single();
    if (lData) setLandlord(lData);
    setLoading(false);
  }

  async function checkSaved() {
    const { data } = await supabase.from("saved_properties").select("id").match({ tenant_id: user.id, property_id: id }).single();
    setSaved(!!data);
  }

  async function toggleSave() {
    if (!user) { navigate("/login"); return; }
    if (saved) {
      await supabase.from("saved_properties").delete().match({ tenant_id: user.id, property_id: id });
      setSaved(false);
    } else {
      await supabase.from("saved_properties").insert({ tenant_id: user.id, property_id: id });
      setSaved(true);
    }
  }

  async function submitBooking(e) {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    setBookLoading(true);
    const { error } = await supabase.from("bookings").insert({
      property_id: id,
      tenant_id: user.id,
      landlord_id: property.landlord_id,
      viewing_date: bookDate,
      viewing_time: bookTime,
      message: bookMsg,
    });
    setBookLoading(false);
    if (!error) { setBookSuccess(true); setBookDate(""); setBookMsg(""); }
    else alert("Failed to book viewing. Please try again.");
  }

  async function submitInquiry(e) {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    setInqLoading(true);
    const { error } = await supabase.from("inquiries").insert({
      property_id: id,
      tenant_id: user.id,
      landlord_id: property.landlord_id,
      message: inqMsg,
    });
    setInqLoading(false);
    if (!error) { setInqSuccess(true); setInqMsg(""); }
    else alert("Failed to send inquiry. Please try again.");
  }

  const price = (v) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(v);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="skeleton aspect-video rounded-2xl mb-6" />
      <div className="space-y-4">
        <div className="skeleton h-8 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-4 w-full rounded" />
      </div>
    </div>
  );

  if (!property) return (
    <div className="text-center py-24">
      <p className="text-xl font-display text-gray-600">Property not found</p>
      <Link to="/listings" className="btn-primary mt-4 inline-block">Browse Listings</Link>
    </div>
  );

  const images = property.images?.length ? property.images.map(getStorageUrl) : [PLACEHOLDER];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link to="/listings" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: images + details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image gallery */}
          <div className="card overflow-hidden">
            <div className="relative aspect-video bg-gray-100">
              <img src={images[imgIdx]} alt={property.title} className="w-full h-full object-cover" onError={(e) => { e.target.src = PLACEHOLDER; }} />
              {images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all">‹</button>
                  <button onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all">›</button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setImgIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === imgIdx ? "bg-white" : "bg-white bg-opacity-50"}`} />
                    ))}
                  </div>
                </>
              )}
              {/* Status badge */}
              <div className="absolute top-3 left-3 flex gap-2">
                {property.status === "verified" && <span className="badge-verified">✓ Verified</span>}
              </div>
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === imgIdx ? "border-brand-500" : "border-transparent"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.src = PLACEHOLDER; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">{property.title}</h1>
                <p className="text-gray-500 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                  {property.location}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-brand-600">{price(property.price)}</p>
                <p className="text-sm text-gray-400">per month</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-100 mb-4">
              <div className="text-center">
                <p className="font-semibold text-gray-900">{property.bedrooms}</p>
                <p className="text-xs text-gray-500">Bedrooms</p>
              </div>
              <div className="text-center border-x border-gray-100">
                <p className="font-semibold text-gray-900">{property.bathrooms}</p>
                <p className="text-xs text-gray-500">Bathrooms</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 capitalize">{property.property_type.replace("_", " ")}</p>
                <p className="text-xs text-gray-500">Type</p>
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-5">{property.description || "No description provided."}</p>

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <>
                <h3 className="font-semibold text-gray-900 mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2 mb-5">
                  {property.amenities.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-sm px-3 py-1 rounded-full">
                      <span>{AMENITY_ICONS[a] || "✓"}</span>
                      <span className="capitalize">{a}</span>
                    </span>
                  ))}
                </div>
              </>
            )}

            {/* Save button */}
            <button onClick={toggleSave} className={`flex items-center gap-2 text-sm font-medium transition-colors ${saved ? "text-red-500" : "text-gray-400 hover:text-red-400"}`}>
              <svg className="w-5 h-5" fill={saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              {saved ? "Saved to favourites" : "Save to favourites"}
            </button>
          </div>
        </div>

        {/* Right: landlord + forms */}
        <div className="space-y-4">
          {/* Landlord card */}
          {landlord && (
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Listed by</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                  <span className="text-brand-700 font-semibold">{landlord.full_name[0]}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{landlord.full_name}</p>
                  {landlord.phone && <p className="text-xs text-gray-500">{landlord.phone}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Booking / Inquiry tabs */}
          {isTenant ? (
            <div className="card p-4">
              <div className="flex rounded-xl border border-gray-100 p-1 mb-4 bg-gray-50">
                <button onClick={() => { setTab("booking"); setBookSuccess(false); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "booking" ? "bg-white shadow text-brand-700" : "text-gray-500 hover:text-gray-700"}`}>
                  Book Viewing
                </button>
                <button onClick={() => { setTab("inquiry"); setInqSuccess(false); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "inquiry" ? "bg-white shadow text-brand-700" : "text-gray-500 hover:text-gray-700"}`}>
                  Inquire
                </button>
              </div>

              {tab === "booking" && (
                <>
                  {bookSuccess ? (
                    <div className="text-center py-4">
                      <div className="text-3xl mb-2">✅</div>
                      <p className="font-semibold text-gray-900 text-sm">Viewing request sent!</p>
                      <p className="text-xs text-gray-500 mt-1">The landlord will confirm your booking soon.</p>
                      <button onClick={() => setBookSuccess(false)} className="text-xs text-brand-600 mt-3 underline">Book another</button>
                    </div>
                  ) : (
                    <form onSubmit={submitBooking} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Preferred Date</label>
                        <input type="date" value={bookDate} onChange={(e) => setBookDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          required className="input-field text-sm py-2" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Preferred Time</label>
                        <select value={bookTime} onChange={(e) => setBookTime(e.target.value)} className="input-field text-sm py-2">
                          {["8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Message (optional)</label>
                        <textarea value={bookMsg} onChange={(e) => setBookMsg(e.target.value)}
                          rows={3} placeholder="Any special requests..." className="input-field text-sm py-2 resize-none" />
                      </div>
                      <button type="submit" disabled={bookLoading} className="btn-primary w-full text-sm">
                        {bookLoading ? "Sending..." : "Request Viewing"}
                      </button>
                    </form>
                  )}
                </>
              )}

              {tab === "inquiry" && (
                <>
                  {inqSuccess ? (
                    <div className="text-center py-4">
                      <div className="text-3xl mb-2">📨</div>
                      <p className="font-semibold text-gray-900 text-sm">Inquiry sent!</p>
                      <p className="text-xs text-gray-500 mt-1">The landlord will reply soon.</p>
                      <button onClick={() => setInqSuccess(false)} className="text-xs text-brand-600 mt-3 underline">Send another</button>
                    </div>
                  ) : (
                    <form onSubmit={submitInquiry} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Your Message</label>
                        <textarea value={inqMsg} onChange={(e) => setInqMsg(e.target.value)}
                          rows={5} required placeholder="Ask about rent, availability, deposit requirements..."
                          className="input-field text-sm py-2 resize-none" />
                      </div>
                      <button type="submit" disabled={inqLoading} className="btn-primary w-full text-sm">
                        {inqLoading ? "Sending..." : "Send Inquiry"}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          ) : !user ? (
            <div className="card p-5 text-center">
              <p className="text-sm text-gray-600 mb-4">Sign in to book a viewing or send an inquiry</p>
              <Link to="/login" className="btn-primary text-sm block">Sign In</Link>
              <Link to="/register" className="block text-sm text-brand-600 mt-2 hover:underline">Create account</Link>
            </div>
          ) : null}

          {/* Property info */}
          <div className="card p-4 text-sm text-gray-500 space-y-2">
            <p className="flex justify-between"><span>Listed</span><span className="text-gray-700">{new Date(property.created_at).toLocaleDateString("en-KE")}</span></p>
            <p className="flex justify-between"><span>Views</span><span className="text-gray-700">{property.views_count || 0}</span></p>
            <p className="flex justify-between"><span>Area</span><span className="text-gray-700">{property.area || "—"}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}