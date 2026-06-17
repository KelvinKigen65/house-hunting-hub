import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { djangoApi } from "../../lib/djangoApi";
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

const ICONS = {
  saved: "M5 5.5A3.5 3.5 0 0 1 11 3a3.5 3.5 0 0 1 6 2.5c0 4.6-6 8.5-6 8.5S5 10.1 5 5.5Z",
  bookings: "M7 3v3m10-3v3M4.5 9h15M6 5.5h12A1.5 1.5 0 0 1 19.5 7v10A1.5 1.5 0 0 1 18 18.5H6A1.5 1.5 0 0 1 4.5 17V7A1.5 1.5 0 0 1 6 5.5Z",
  pending: "M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  confirmed: "m5 12 4 4L19 6",
  search: "m21 21-4.35-4.35m1.1-5.15a6.25 6.25 0 1 1-12.5 0 6.25 6.25 0 0 1 12.5 0Z",
  user: "M15.75 8.25a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20a7.5 7.5 0 0 1 15 0",
  shield: "M12 3.5 19 6v5.5c0 4.1-2.8 7.8-7 9-4.2-1.2-7-4.9-7-9V6l7-2.5Z",
  phone: "M6.5 4.5h3l1.5 4-2 1.2a12.5 12.5 0 0 0 5.3 5.3l1.2-2 4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.5 6.7a2 2 0 0 1 2-2.2Z",
};

function DashboardIcon({ name, className = "h-5 w-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={ICONS[name]} />
    </svg>
  );
}

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
        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gray-50 text-gray-500 group-hover:bg-gray-100 transition-colors flex-shrink-0">
          <DashboardIcon name={icon} />
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
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <DashboardIcon name={icon} className="h-4 w-4 text-gray-700" />
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
        const [bData, savedData] = await Promise.all([
          djangoApi.bookings.list(),
          djangoApi.savedProperties.list(),
        ]);
        if (mounted) {
          setBookings([...bData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5));
          setSavedCount(savedData.length);
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
              {firstName}
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
        <StatCard to="/tenant/saved"    icon="saved" value={loading ? "—" : savedCount}    label="Saved"     sub="Properties"          accent="bg-red-400"     />
        <StatCard to="/tenant/bookings" icon="bookings" value={loading ? "—" : bookings.length} label="Bookings" sub="Total viewings"      accent="bg-brand-500"   />
        <StatCard to="/tenant/bookings" icon="pending" value={loading ? "—" : pendingCount}   label="Pending"   sub="Awaiting confirm"   accent="bg-yellow-400"  />
        <StatCard to="/tenant/bookings" icon="confirmed" value={loading ? "—" : confirmedCount} label="Confirmed" sub="Ready to attend"    accent="bg-emerald-500" />
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
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-500 mb-4">
                <DashboardIcon name="bookings" className="h-6 w-6" />
              </div>
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
              <QuickAction to="/listings"        icon="search" label="Browse Houses"     desc="Find verified rentals in Embu"       color="bg-blue-50"    />
              <QuickAction to="/tenant/saved"    icon="saved" label="Saved Properties"  desc={`${savedCount} saved`}               color="bg-red-50"     />
              <QuickAction to="/tenant/bookings" icon="bookings" label="My Bookings"       desc={`${bookings.length} viewing request${bookings.length !== 1 ? "s" : ""}`} color="bg-brand-50" />
              <QuickAction to="/profile"         icon="user" label="My Profile"        desc="Update your contact info"            color="bg-gray-100"   />
            </div>
          </div>

          {/* Safety Tips */}
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <DashboardIcon name="shield" className="h-5 w-5 text-brand-100" />
              <h3 className="font-display font-semibold text-sm">Safe Renting Tips</h3>
            </div>
            <ul className="space-y-2.5">
              {[
                "Only view properties marked as verified.",
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
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
              <DashboardIcon name="phone" />
            </span>
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
