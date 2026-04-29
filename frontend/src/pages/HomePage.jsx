import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import PropertyCard from "../components/ui/PropertyCard";

const AREAS = ["All Areas", "Town Centre", "Kirimari", "Kithimu", "Ngandori", "Runyenjes", "Ishiara", "Siakago"];

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("All Areas");
  const [featured, setFeatured] = useState([]);
  const [stats, setStats] = useState({ properties: 0, landlords: 0, tenants: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeatured();
    fetchStats();
  }, []);

  async function fetchFeatured() {
    try {
      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "verified")
        .eq("is_available", true)
        .order("updated_at", { ascending: false })
        .limit(6);
      if (data) setFeatured(data);
    } catch (err) {
      console.warn("Failed to fetch featured properties:", err.message);
    }
  }

  async function fetchStats() {
    try {
      const [{ count: properties }, { count: landlords }, { count: tenants }] = await Promise.all([
        supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "verified"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "landlord"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "tenant"),
      ]);
      setStats({ properties: properties || 0, landlords: landlords || 0, tenants: tenants || 0 });
    } catch (err) {
      console.warn("Failed to fetch stats:", err.message);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (area !== "All Areas") params.set("area", area);
    navigate(`/listings?${params.toString()}`);
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-brand-900 text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "40px 40px"
          }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-brand-600 bg-opacity-20 border border-brand-500 border-opacity-30 rounded-full px-4 py-1.5 text-sm text-brand-300 mb-6">
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
              Embu's #1 Property Platform
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6">
              Find Your Perfect Home in{" "}
              <span className="text-brand-400">Embu</span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl mb-10 leading-relaxed">
              Browse verified, affordable rental houses across Embu County. Safe, transparent, and scam-free.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by location, area, or keyword..."
                className="flex-1 px-4 py-3 text-gray-800 placeholder-gray-400 outline-none text-sm rounded-xl"
              />
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="px-4 py-3 text-gray-700 text-sm border-0 outline-none rounded-xl bg-gray-50 sm:w-40"
              >
                {AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
              <button type="submit" className="btn-primary px-8 whitespace-nowrap">
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Verified Listings", value: stats.properties },
              { label: "Landlords", value: stats.landlords },
              { label: "Happy Tenants", value: stats.tenants },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-display text-3xl font-bold text-brand-600">{value}+</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500">Finding your next home is simple and safe</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "🔍",
                title: "Browse & Search",
                desc: "Filter by location, price, and type. Only verified listings appear so you stay scam-free.",
              },
              {
                icon: "📅",
                title: "Book a Viewing",
                desc: "Schedule a viewing directly with the landlord through the platform at your convenience.",
              },
              {
                icon: "🏠",
                title: "Move In",
                desc: "Agree on terms, sign your lease, and move into your new home confidently.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="card p-6 text-center">
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="font-display font-semibold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold text-gray-900">Latest Listings</h2>
              <p className="text-gray-500 mt-1">Verified properties available now</p>
            </div>
            <Link to="/listings" className="btn-secondary text-sm">View all →</Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">🏘️</div>
              <p>No verified listings yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA for Landlords */}
      <section className="bg-brand-600 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Are You a Landlord?</h2>
          <p className="text-brand-100 text-lg mb-8">
            List your property for free and connect with thousands of verified tenants in Embu County.
          </p>
          <Link to="/register" className="inline-block bg-white text-brand-700 font-semibold px-8 py-3 rounded-xl hover:bg-brand-50 transition-colors">
            List Your Property Free →
          </Link>
        </div>
      </section>
    </div>
  );
}