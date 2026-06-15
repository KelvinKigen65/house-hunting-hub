import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import PropertyCard from "../components/ui/PropertyCard";
import heroImage from "../assets/hero.png";
import houseLogo from "../assets/house-logo.png";

const AREAS = ["All Areas", "Town Centre", "Kirimari", "Kithimu", "Ngandori", "Runyenjes", "Ishiara", "Siakago"];

const FEATURES = [
  {
    title: "Verified listings",
    desc: "Every visible property is reviewed before tenants spend time on viewings.",
    icon: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "Local area filters",
    desc: "Scan Embu neighborhoods quickly and narrow your search before calling.",
    icon: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
  },
  {
    title: "Direct viewing flow",
    desc: "Book, ask questions, and keep your rental trail organized in one place.",
    icon: "M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5M5.25 5.25h13.5A1.5 1.5 0 0120.25 6.75v12A1.5 1.5 0 0118.75 20.25H5.25A1.5 1.5 0 013.75 18.75v-12A1.5 1.5 0 015.25 5.25z",
  },
];

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("All Areas");
  const [featured, setFeatured] = useState([]);
  const [stats, setStats] = useState({ properties: 0, landlords: 0, tenants: 0 });
  const navigate = useNavigate();

  // Fetch featured and stats on mount (inline to avoid setState-in-effect lint)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("properties")
          .select("*")
          .eq("status", "verified")
          .eq("is_available", true)
          .order("updated_at", { ascending: false })
          .limit(6);
        if (mounted && data) setFeatured(data);
      } catch (err) {
        console.warn("Failed to fetch featured properties:", err.message);
      }

      try {
        const [{ count: properties }, { count: landlords }, { count: tenants }] = await Promise.all([
          supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "verified"),
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "landlord"),
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "tenant"),
        ]);
        if (mounted) setStats({ properties: properties || 0, landlords: landlords || 0, tenants: tenants || 0 });
      } catch (err) {
        console.warn("Failed to fetch stats:", err.message);
      }
    })();
    return () => { mounted = false; };
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (area !== "All Areas") params.set("area", area);
    navigate(`/listings?${params.toString()}`);
  }

  return (
    <div className="bg-slate-50">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#16324f_42%,#5b3b8d_100%)] text-white">
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.16) 1px, transparent 1px)`,
          backgroundSize: "56px 56px"
        }} />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 md:pt-24 md:pb-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.03fr_0.97fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-sky-100 shadow-lg shadow-black/10 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]" />
                Embu rentals, verified before they reach you
              </div>
              <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                Find a home that fits your budget, route, and routine.
            </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
                Compare safe rentals across Embu County, check the neighborhood, and move from shortlist to viewing without chasing scattered contacts.
              </p>

              {/* Search bar */}
              <form onSubmit={handleSearch} className="mt-9 rounded-[2rem] border border-white/20 bg-white/95 p-3 shadow-2xl shadow-black/25">
                <div className="grid gap-3 md:grid-cols-[1fr_190px_auto]">
                  <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                    <svg className="h-5 w-5 flex-none text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m1.1-5.15a6.25 6.25 0 1 1-12.5 0 6.25 6.25 0 0 1 12.5 0z" />
                    </svg>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search location, rent, bedsitter..."
                      className="min-w-0 flex-1 bg-transparent text-sm font-medium text-gray-800 placeholder-gray-400 outline-none"
                    />
                  </label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none ring-1 ring-slate-200"
                  >
                    {AREAS.map(a => <option key={a}>{a}</option>)}
                  </select>
                  <button type="submit" className="rounded-2xl bg-gradient-to-r from-brand-600 to-fuchsia-500 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-brand-900/25 transition-transform hover:-translate-y-0.5">
                    Search homes
                  </button>
                </div>
              </form>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-200">
                {["No hidden listing fees", "Local Embu areas", "Landlord dashboard"].map((item) => (
                  <span key={item} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative min-h-[420px]">
              <div className="absolute inset-4 rounded-[2.25rem] bg-gradient-to-br from-sky-300/25 to-fuchsia-300/25 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-4 shadow-2xl shadow-black/30 backdrop-blur">
                <div className="rounded-[1.5rem] bg-white p-4 text-gray-900 shadow-xl">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-slate-100 to-sky-50">
                    <img src={heroImage} alt="Modern rental home illustration" className="h-full w-full object-contain p-6" />
                    <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-brand-700 shadow-sm">
                      Featured areas
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {["Kirimari", "Town Centre", "Runyenjes"].map((place) => (
                      <div key={place} className="rounded-2xl bg-slate-50 p-3 text-center ring-1 ring-slate-100">
                        <p className="text-xs font-semibold text-gray-500">Area</p>
                        <p className="mt-1 truncate text-sm font-bold text-gray-900">{place}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute -left-2 bottom-10 hidden w-56 rounded-3xl border border-white/20 bg-white/95 p-4 text-gray-900 shadow-xl lg:block">
                <div className="flex items-center gap-3">
                  <img src={houseLogo} alt="" aria-hidden="true" className="h-10 w-10" />
                  <div>
                    <p className="text-sm font-bold">Tenant-ready</p>
                    <p className="text-xs text-gray-500">Listings, bookings, inquiries</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-1 top-10 hidden rounded-3xl border border-white/20 bg-slate-950/80 p-4 text-white shadow-xl backdrop-blur lg:block">
                <p className="text-xs uppercase tracking-[0.18em] text-sky-200">Safety score</p>
                <p className="mt-1 text-3xl font-bold">Verified</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 rounded-[2rem] border border-gray-100 bg-white p-4 text-center shadow-xl shadow-slate-200/70 sm:grid-cols-3">
            {[
              { label: "Verified Listings", value: stats.properties, note: "currently visible" },
              { label: "Landlords", value: stats.landlords, note: "registered owners" },
              { label: "Happy Tenants", value: stats.tenants, note: "tenant accounts" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-3xl bg-slate-50 px-5 py-6 ring-1 ring-gray-100">
                <p className="font-display text-4xl font-bold text-brand-600">{value}+</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{label}</p>
                <p className="mt-1 text-xs text-gray-500">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-600">A cleaner rental path</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-gray-950">How It Works</h2>
            </div>
            <p className="max-w-2xl text-gray-500">Designed around the decisions tenants actually make: location, trust, price, and whether the landlord can respond.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc }, index) => (
              <div key={title} className="group rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-fuchsia-100 text-brand-700 ring-1 ring-brand-100">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
                  </svg>
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Step {index + 1}</p>
                <h3 className="mt-2 font-display text-xl font-bold text-gray-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-600">Fresh inventory</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-gray-950">Latest Listings</h2>
              <p className="text-gray-500 mt-1">Verified properties available now, with fast routes into details and viewing requests.</p>
            </div>
            <Link to="/listings" className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-sm transition-colors hover:bg-slate-50">View all homes</Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-gray-200 bg-slate-50 py-16 text-center text-gray-400">
              <img src={houseLogo} alt="" aria-hidden="true" className="mx-auto mb-4 h-14 w-14 opacity-70" />
              <p className="font-medium">No verified listings yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA for Landlords */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#155e75_0%,#4f46e5_48%,#a21caf_100%)] p-8 text-white shadow-2xl shadow-brand-900/20 md:p-12">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-100">For property owners</p>
                <h2 className="mt-3 font-display text-3xl font-bold">Are You a Landlord?</h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-white/85">
                  List your property for free, manage inquiries cleanly, and connect with tenants already searching around Embu County.
                </p>
              </div>
              <Link to="/register" className="inline-flex items-center justify-center rounded-2xl bg-white px-7 py-4 text-sm font-bold text-brand-700 shadow-lg transition-transform hover:-translate-y-0.5">
                List Your Property Free
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
