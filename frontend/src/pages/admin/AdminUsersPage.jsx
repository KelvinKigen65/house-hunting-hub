import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let q = supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("role", filter);
    q.then(({ data }) => { setUsers(data || []); setLoading(false); });
  }, [filter]);

  async function changeRole(id, role) {
    await supabase.from("profiles").update({ role }).eq("id", id);
    setUsers(u => u.map(x => x.id === id ? { ...x, role } : x));
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">Manage Users</h1>
      <div className="flex gap-2 mb-6">
        {["all", "tenant", "landlord", "admin"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm font-medium rounded-xl transition-colors capitalize ${filter === f ? "bg-brand-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {f}
          </button>
        ))}
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                <td className="px-4 py-3 text-gray-500">{u.phone || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                    u.role === "admin" ? "bg-purple-100 text-purple-700" :
                    u.role === "landlord" ? "bg-earth-100 text-earth-700" : "bg-brand-100 text-brand-700"
                  }`}>{u.role}</span>
                </td>
                <td className="px-4 py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString("en-KE")}</td>
                <td className="px-4 py-3">
                  <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none">
                    <option value="tenant">Tenant</option>
                    <option value="landlord">Landlord</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}