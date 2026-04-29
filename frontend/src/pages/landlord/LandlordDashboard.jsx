import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase, getStorageUrl } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

const PLACEHOLDER = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80";
const STATUS_STYLES = {
  verified: "badge-verified", pending: "badge-pending", rejected: "badge-rejected", unavailable: "badge-pending"
};

export default function LandlordDashboard() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, bookings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const [{ data: props }, { count: bookings }] = await Promise.all([
      supabase.from("properties").select("*").eq("landlord_id", user.id).order("created_at", { ascending: false }),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("landlord_id", user.id).eq("status", "pending"),
    ]);
    if (props) {
      setProperties(props);
      setStats({
        total: props.length,
        verified: props.filter(p => p.status === "verified").length,
        pending: props.filter(p => p.status === "pending").length,
        bookings: bookings || 0,
      });
    }
    setLoading(false);
  }

  async function toggleAvailability(id, current) {
    await supabase.from("properties").update({ is_available: !current }).eq("id", id);
    fetchData();
  }

  async function deleteProperty(id) {
    if (!confirm("Delete this property? This cannot be undone.")) return;
    await supabase.from("properties").delete().eq("id", id);
    fetchData();
  }

  const price = (v) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">My Properties</h1>
          <p className="text-gray-500 mt-1">Manage your rental listings</p>
        </div>
        <Link to="/landlord/add" className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Property
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Listings", value: stats.total, color: "bg-blue-50 text-blue-700" },
          { label: "Verified", value: stats.verified, color: "bg-brand-50 text-brand-700" },
          { label: "Pending Review", value: stats.pending, color: "bg-yellow-50 text-yellow-700" },
          { label: "Pending Bookings", value: stats.bookings, color: "bg-purple-50 text-purple-700" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`card p-4 ${color}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm mt-1 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="card p-4 h-24 skeleton" />)}
        </div>
      ) : properties.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">🏘️</div>
          <p className="font-display text-xl text-gray-600 mb-2">No properties yet</p>
          <p className="text-gray-500 text-sm mb-6">Add your first listing to start connecting with tenants.</p>
          <Link to="/landlord/add" className="btn-primary inline-block">Add Your First Property</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((p) => (
            <div key={p.id} className="card flex flex-col sm:flex-row overflow-hidden">
              <div className="w-full sm:w-36 h-32 sm:h-auto flex-shrink-0 bg-gray-100">
                <img
                  src={p.images?.[0] ? getStorageUrl(p.images[0]) : PLACEHOLDER}
                  alt={p.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = PLACEHOLDER; }}
                />
              </div>
              <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{p.title}</h3>
                    <span className={STATUS_STYLES[p.status]}>{p.status}</span>
                    {!p.is_available && <span className="badge-pending">Unavailable</span>}
                  </div>
                  <p className="text-sm text-gray-500">{p.location} · {p.bedrooms} bed · {price(p.price)}/mo</p>
                  {p.admin_note && p.status === "rejected" && (
                    <p className="text-xs text-red-600 mt-1">Rejection note: {p.admin_note}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => toggleAvailability(p.id, p.is_available)}
                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                    Mark {p.is_available ? "Unavailable" : "Available"}
                  </button>
                  <Link to={`/landlord/edit/${p.id}`} className="text-xs px-3 py-1.5 border border-brand-200 text-brand-600 rounded-lg hover:bg-brand-50">Edit</Link>
                  <button onClick={() => deleteProperty(p.id)} className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}