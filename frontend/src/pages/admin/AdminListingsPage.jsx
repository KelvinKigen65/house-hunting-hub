import { useState, useEffect } from "react";
import { supabase, getStorageUrl } from "../../lib/supabase";

const PLACEHOLDER = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=300&q=80";

export default function AdminListingsPage() {
  const [properties, setProperties] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState({});

  useEffect(() => { fetchProperties(); }, [filter]);

  async function fetchProperties() {
    setLoading(true);
    const q = supabase.from("properties").select("*, profiles!landlord_id(full_name, phone)").order("created_at", { ascending: false });
    if (filter !== "all") q.eq("status", filter);
    const { data } = await q;
    if (data) setProperties(data);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    await supabase.from("properties").update({ status, admin_note: note[id] || null }).eq("id", id);
    fetchProperties();
  }

  const price = (v) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Manage Listings</h1>
        <p className="text-gray-500 mt-1">Review and verify property listings</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-100">
        {["pending", "verified", "rejected", "all"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize -mb-px ${
              filter === f ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card p-4 h-32 skeleton" />)}</div>
      ) : properties.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">
          <p className="text-5xl mb-4">✅</p>
          <p>No {filter} listings</p>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map(p => (
            <div key={p.id} className="card overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-40 h-32 sm:h-auto flex-shrink-0 bg-gray-100">
                  <img src={p.images?.[0] ? getStorageUrl(p.images[0]) : PLACEHOLDER} alt=""
                    className="w-full h-full object-cover" onError={(e) => { e.target.src = PLACEHOLDER; }} />
                </div>
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h3 className="font-semibold text-gray-900">{p.title}</h3>
                      <p className="text-sm text-gray-500">{p.location} · {p.bedrooms} bed · {price(p.price)}/mo</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        By: {p.profiles?.full_name || "Unknown"} · {p.profiles?.phone || ""}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                      p.status === "verified" ? "bg-brand-100 text-brand-700" :
                      p.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                    }`}>{p.status}</span>
                  </div>

                  {p.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{p.description}</p>}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {p.status !== "verified" && (
                      <button onClick={() => updateStatus(p.id, "verified")}
                        className="flex-1 btn-primary text-xs py-2">✓ Verify</button>
                    )}
                    {p.status !== "rejected" && (
                      <div className="flex gap-2 flex-1">
                        <input
                          placeholder="Rejection reason..."
                          value={note[p.id] || ""}
                          onChange={(e) => setNote(n => ({ ...n, [p.id]: e.target.value }))}
                          className="input-field text-xs py-2 flex-1"
                        />
                        <button onClick={() => updateStatus(p.id, "rejected")}
                          className="btn-danger text-xs py-2 px-3 whitespace-nowrap">✗ Reject</button>
                      </div>
                    )}
                    {p.status !== "pending" && (
                      <button onClick={() => updateStatus(p.id, "pending")}
                        className="btn-secondary text-xs py-2">Reset to Pending</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}