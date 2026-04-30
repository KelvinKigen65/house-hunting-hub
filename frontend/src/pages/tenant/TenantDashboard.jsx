import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/useAuth";

// ─── helpers ────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const STATUS = {
  pending:   { label: "Pending",   dot: "bg-yellow-400", pill: "bg-yellow-50 text-yellow-700 ring-yellow-200"  },
  confirmed: { label: "Confirmed", dot: "bg-brand-500",  pill: "bg-brand-50  text-brand-700  ring-brand-200"   },
  cancelled: { label: "Cancelled", dot: "bg-red-400",    pill: "bg-red-50    text-red-700    ring-red-200"      },
  completed: { label: "Completed", dot: "bg-gray-400",   pill: "bg-gray-100  text-gray-600   ring-gray-200"     },
};

// ─── sub-components ─────────────────────────────────────────────────────────
function StatCard({ to, icon, value, label, sub, accent }) {
  return (
    <Link
      to={to}
      className="group relative bg-white rounded-2xl border border-gray-100 p-5 shadow-card hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${accent} rounded-t-2xl`} />
      <div className="flex items-center justify-between mt-1">
        <div>
          <p className="text-3xl font-bold text-gray-900 leading-none mb-1">{value}</p>
          <p className="text-sm font-medium text-gray-700">{label}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl bg-gray-50 group-hover:bg-gray-100 transition-colors flex-shrink-0">
          {icon}
        </div>
      </div>
    </Link>
  );
}

function BookingRow({ b }) {
  const s = STATUS[b.status] || STATUS.pending;
  const dateStr = b.viewing_date
    ? new Date(b.viewing_date).toLocaleDateString("en-KE", {
        weekday: "short", month: "short", day: "numeric",
      })
    : "—";

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 group">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate leading-snug">
          {b.properties?.title || "Property"}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">
          {b.properties?.location} &nbsp;·&nbsp; {dateStr} at {b.viewing_time}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ring-1 ${s.pill}`}>
          {s.label}
        </span>
        <Link
          to={`/listings/${b.property_id}`}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-brand-600 hover:underline whitespace-nowrap"
        >
          View →
        </Link>
      </div>
    </div>
  );
}

function QuickAction({ to, icon, label, desc, color }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{label}</p>
        <p className="text-xs text-gray-400 truncate">{desc}</p>
      </div>
      <svg className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-gray-400 transition-colors"
        fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

// ─── main component ──────────────────────────────────────────────────────────
export default function TenantDashboard() {
  const { user, profile } = useAuth();
  const [bookings, setBookings]     = useState([]);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading]       = useState(true);

  // Inline data fetching to avoid setState-in-effect lint rule
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [{ data: bData }, { count: sCount }] = await Promise.all([
          supabase
            .from("bookings")
            .select("*, properties(title, location, price)")
            .eq("tenant_id", user?.id)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("saved_properties")
            .select("*", { count: "exact", head: true })
            .eq("tenant_id", user?.id),
        ]);
        if (mounted) {
          setBookings(bData || []);
          setSavedCount(sCount || 0);
          setLoading(false);
        }
      } catch (err) {
        console.warn("Failed to fetch tenant dashboard data:", err.message);
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  const firstName      = profile?.full_name?.split(" ")[0] || "there";
  const pendingCount   = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* ── Greeting banner ─────────────────────────────────────────── */}
      <div className="relative bg-gray-900 rounded-3xl overflow-hidden px-6 py-8 sm:px-10 sm:py-10">
        <div className="absolute -top-10 -right-10 w-52 h-52 bg-brand-600 opacity-20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-20 w-32 h-32 bg-brand-400 opacity-10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-brand-400 text-sm font-medium tracking-wide uppercase mb-1">
              {greeting()}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
              {firstName} 👋
            </h1>
            <p className="text-gray-400 text-sm mt-2 max-w-sm leading-relaxed">
              Your personal hub for finding and managing rental properties in Embu County.
            </p>
          </div>
          <Link
            to="/listings"
            className="self-start sm:self-auto flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-colors shadow-lg shadow-brand-900/30 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Browse Houses
          </Link>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard to="/tenant/saved"    icon="❤️" value={loading ? "—" : savedCount}    label="Saved"     sub="Properties"          accent="bg-red-400"     />
        <StatCard to="/tenant/bookings" icon="📅" value={loading ? "—" : bookings.length} label="Bookings" sub="Total viewings"      accent="bg-brand-500"   />
        <StatCard to="/tenant/bookings" icon="⏳" value={loading ? "—" : pendingCount}   label="Pending"   sub="Awaiting confirm"   accent="bg-yellow-400"  />
        <StatCard to="/tenant/bookings" icon="✅" value={loading ? "—" : confirmedCount} label="Confirmed" sub="Ready to attend"    accent="bg-emerald-500" />
      </div>

      {/* ── Two-column main area ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Recent Bookings */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-gray-900 text-base">Recent Bookings</h2>
              <p className="text-xs text-gray-400 mt-0.5">Your latest viewing requests</p>
            </div>
            <Link to="/tenant/bookings" className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors">
              See all →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl mb-4">📅</div>
              <p className="font-medium text-gray-700 text-sm mb-1">No bookings yet</p>
              <p className="text-xs text-gray-400 mb-4 max-w-[180px]">
                Find a property you like and book a viewing.
              </p>
              <Link to="/listings"
                className="text-xs font-semibold text-brand-600 border border-brand-200 px-4 py-1.5 rounded-lg hover:bg-brand-50 transition-colors">
                Browse listings
              </Link>
            </div>
          ) : (
            <div>
              {bookings.map((b) => <BookingRow key={b.id} b={b} />)}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
            <h2 className="font-display font-semibold text-gray-900 text-base mb-3">Quick Actions</h2>
            <div className="space-y-1">
              <QuickAction to="/listings"        icon="🔍" label="Browse Houses"     desc="Find verified rentals in Embu"       color="bg-blue-50"    />
              <QuickAction to="/tenant/saved"    icon="❤️" label="Saved Properties"  desc={`${savedCount} saved`}               color="bg-red-50"     />
              <QuickAction to="/tenant/bookings" icon="📅" label="My Bookings"       desc={`${bookings.length} viewing request${bookings.length !== 1 ? "s" : ""}`} color="bg-brand-50" />
              <QuickAction to="/profile"         icon="👤" label="My Profile"        desc="Update your contact info"            color="bg-gray-100"   />
            </div>
          </div>

          {/* Safety Tips */}
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🛡️</span>
              <h3 className="font-display font-semibold text-sm">Safe Renting Tips</h3>
            </div>
            <ul className="space-y-2.5">
              {[
                "Only view properties with the ✓ Verified badge.",
                "Visit in person before making any payment.",
                "Never pay a deposit without a signed lease.",
                "Use this platform to message landlords.",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-brand-100 leading-relaxed">
                  <span className="w-4 h-4 bg-white bg-opacity-15 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-px">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* ── Profile nudge (if phone missing) ────────────────────────── */}
      {!profile?.phone && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl">📞</span>
            <div>
              <p className="text-sm font-semibold text-yellow-800">Add your phone number</p>
              <p className="text-xs text-yellow-600 mt-0.5">
                Landlords need your number to confirm viewing appointments.
              </p>
            </div>
          </div>
          <Link to="/profile"
            className="flex-shrink-0 text-xs font-semibold bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-xl transition-colors">
            Update Profile
          </Link>
        </div>
      )}

    </div>
  );
}