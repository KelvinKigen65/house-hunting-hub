import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("bookings").select("*, properties(title, location, price)").eq("tenant_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setBookings(data || []); setLoading(false); });
  }, []);

  async function cancelBooking(id) {
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    setBookings(b => b.map(x => x.id === id ? { ...x, status: "cancelled" } : x));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>
      {loading ? <div className="skeleton h-48 rounded-2xl" /> : bookings.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">
          <div className="text-5xl mb-4">📅</div>
          <p>No bookings yet. Browse listings to book a viewing!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => (
            <div key={b.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{b.properties?.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{b.properties?.location}</p>
                  <p className="text-sm text-gray-600 mt-2">📅 {b.viewing_date} at {b.viewing_time}</p>
                  {b.message && <p className="text-xs text-gray-400 mt-1">"{b.message}"</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    b.status === "confirmed" ? "bg-brand-100 text-brand-700" :
                    b.status === "cancelled" ? "bg-red-100 text-red-700" :
                    b.status === "completed" ? "bg-gray-100 text-gray-700" : "bg-yellow-100 text-yellow-700"
                  }`}>{b.status}</span>
                  {b.status === "pending" && (
                    <button onClick={() => cancelBooking(b.id)} className="text-xs text-red-600 hover:underline">Cancel</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}