import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import PropertyCard from "../../components/ui/PropertyCard";

export default function TenantDashboard() {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    supabase.from("bookings").select("*, properties(title, location, price)").eq("tenant_id", user.id).order("created_at", { ascending: false }).limit(5).then(({ data }) => setBookings(data || []));
    supabase.from("saved_properties").select("*, properties(*)").eq("tenant_id", user.id).limit(3).then(({ data }) => setSaved(data || []));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Welcome, {profile?.full_name?.split(" ")[0]}!</h1>
        <p className="text-gray-500 mt-1">Your tenant dashboard</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Saved Properties", value: saved.length, link: "/tenant/saved", icon: "❤️" },
          { label: "Viewing Bookings", value: bookings.length, link: "/tenant/bookings", icon: "📅" },
          { label: "Browse Listings", value: "→", link: "/listings", icon: "🔍" },
        ].map(({ label, value, link, icon }) => (
          <Link key={label} to={link} className="card p-5 flex items-center gap-4 hover:shadow-hover transition-all">
            <div className="text-3xl">{icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </Link>
        ))}
      </div>
      {bookings.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Bookings</h2>
          <div className="space-y-3">
            {bookings.map(b => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{b.properties?.title}</p>
                  <p className="text-xs text-gray-500">{b.viewing_date} at {b.viewing_time}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  b.status === "confirmed" ? "bg-brand-100 text-brand-700" :
                  b.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                }`}>{b.status}</span>
              </div>
            ))}
          </div>
          <Link to="/tenant/bookings" className="text-sm text-brand-600 hover:underline mt-3 block">View all bookings →</Link>
        </div>
      )}
    </div>
  );
}