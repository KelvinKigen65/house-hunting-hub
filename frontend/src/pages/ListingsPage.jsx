import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import PropertyCard from "../components/ui/PropertyCard";

const AREAS = ["All Areas", "Town Centre", "Kirimari", "Kithimu", "Ngandori", "Runyenjes", "Ishiara", "Siakago"];
const TYPES = ["All Types", "apartment", "house", "bedsitter", "single_room", "studio"];
const TYPE_LABELS = { apartment: "Apartment", house: "House", bedsitter: "Bedsitter", single_room: "Single Room", studio: "Studio" };
const PRICE_RANGES = [
  { label: "Any Price", min: 0, max: Infinity },
  { label: "Under KES 5,000", min: 0, max: 5000 },
  { label: "KES 5,000 – 10,000", min: 5000, max: 10000 },
  { label: "KES 10,000 – 20,000", min: 10000, max: 20000 },
  { label: "KES 20,000+", min: 20000, max: Infinity },
];

export default function ListingsPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [area, setArea] = useState(searchParams.get("area") || "All Areas");
  const [type, setType] = useState("All Types");
  const [priceRange, setPriceRange] = useState(0);
  const [bedrooms, setBedrooms] = useState("Any");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchProperties();
    if (user) fetchSaved();
  }, []);

  async function fetchProperties() {
    setLoading(true);
    let query = supabase
      .from("properties")
      .select("*")
      .eq("status", "verified")
      .eq("is_available", true);

    const { data } = await query;
    if (data) setProperties(data);
    setLoading(false);
  }

  async function fetchSaved() {
    const { data } = await supabase
      .from("saved_properties")
      .select("property_id")
      .eq("tenant_id", user.id);
    if (data) setSavedIds(new Set(data.map((s) => s.property_id)));
  }

  async function handleSaveToggle(propertyId, isSaved) {
    if (!user) { alert("Please sign in to save properties"); return; }
    if (isSaved) {
      await supabase.from("saved_properties").delete().match({ tenant_id: user.id, property_id: propertyId });
      setSavedIds((prev) => { const n = new Set(prev); n.delete(propertyId); return n; });
    } else {
      await supabase.from("saved_properties").insert({ tenant_id: user.id, property_id: propertyId });
      setSavedIds((prev) => new Set([...prev, propertyId]));
    }
  }

  const range = PRICE_RANGES[priceRange];

  const filtered = properties
    .filter((p) => {
      const matchQ = !q || p.title.toLowerCase().includes(q.toLowerCase()) || p.location.toLowerCase().includes(q.toLowerCase());
      const matchArea = area === "All Areas" || p.area === area;
      const matchType = type === "All Types" || p.property_type === type;
      const matchPrice = p.price >= range.min && p.price <= range.max;
      const matchBed = bedrooms === "Any" || p.bedrooms >= parseInt(bedrooms);
      return matchQ && matchArea && matchType && matchPrice && matchBed;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">Browse Houses</h1>
        <p className="text-gray-500 mt-1">Find verified rental properties across Embu County</p>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-8 shadow-card">
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, location..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none"
            />
          </div>

          {/* Filter row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            <select value={area} onChange={(e) => setArea(e.target.value)} className="input-field text-sm py-2">
              {AREAS.map(a => <option key={a}>{a}</option>)}
            </select>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input-field text-sm py-2">
              {TYPES.map(t => <option key={t} value={t}>{t === "All Types" ? "All Types" : TYPE_LABELS[t]}</option>)}
            </select>
            <select value={priceRange} onChange={(e) => setPriceRange(Number(e.target.value))} className="input-field text-sm py-2">
              {PRICE_RANGES.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
            </select>
            <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="input-field text-sm py-2">
              {["Any", "1", "2", "3"].map(b => <option key={b} value={b}>{b === "Any" ? "Any Bedrooms" : `${b}+ Bed`}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field text-sm py-2">
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {loading ? "Loading..." : `${filtered.length} propert${filtered.length === 1 ? "y" : "ies"} found`}
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton aspect-[4/3]" />
              <div className="p-4 space-y-3">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="skeleton h-9 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              saved={savedIds.has(p.id)}
              onSaveToggle={handleSaveToggle}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-gray-400">
          <div className="text-6xl mb-4">🏘️</div>
          <p className="font-display text-xl text-gray-600 mb-2">No properties found</p>
          <p className="text-sm">Try adjusting your filters or search term</p>
        </div>
      )}
    </div>
  );
}