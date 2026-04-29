import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ pending: 0, verified: 0, total: 0, tenants: 0, landlords: 0 });

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    const [
      { count: pending }, { count: verified }, { count: total },
      { count: tenants }, { count: landlords }
    ] = await Promise.all([
      supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "verified"),
      supabase.from("properties").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "tenant"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "landlord"),
    ]);
    setStats({ pending: pending || 0, verified: verified || 0, total: total || 0, tenants: tenants || 0, landlords: landlords || 0 });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform overview and moderation</p>
      </div>

      {stats.pending > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-yellow-800">{stats.pending} listing{stats.pending > 1 ? "s" : ""} pending review</p>
              <p className="text-sm text-yellow-600">Verify or reject these before tenants can see them.</p>
            </div>
          </div>
          <Link to="/admin/listings" className="btn-primary text-sm">Review Now</Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total Properties", value: stats.total, color: "text-gray-700" },
          { label: "Verified", value: stats.verified, color: "text-brand-600" },
          { label: "Pending", value: stats.pending, color: "text-yellow-600" },
          { label: "Tenants", value: stats.tenants, color: "text-blue-600" },
          { label: "Landlords", value: stats.landlords, color: "text-purple-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/admin/listings" className="card p-6 hover:shadow-hover transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-100 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-brand-200 transition-colors">🏘️</div>
            <div>
              <h3 className="font-display font-semibold text-gray-900">Manage Listings</h3>
              <p className="text-sm text-gray-500">Verify, reject, or remove properties</p>
            </div>
          </div>
        </Link>
        <Link to="/admin/users" className="card p-6 hover:shadow-hover transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-purple-200 transition-colors">👥</div>
            <div>
              <h3 className="font-display font-semibold text-gray-900">Manage Users</h3>
              <p className="text-sm text-gray-500">View tenants, landlords, and roles</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}