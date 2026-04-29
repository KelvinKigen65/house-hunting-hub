import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({ full_name: profile?.full_name || "", phone: profile?.phone || "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSavedOk] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("profiles").update(form).eq("id", profile.id);
    await refreshProfile();
    setSaving(false);
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 3000);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center text-3xl font-bold text-brand-700">
            {profile?.full_name?.[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{profile?.full_name}</p>
            <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full ${
              profile?.role === "admin" ? "bg-purple-100 text-purple-700" :
              profile?.role === "landlord" ? "bg-earth-100 text-earth-700" : "bg-brand-100 text-brand-700"
            }`}>{profile?.role}</span>
          </div>
        </div>
        {saved && <div className="bg-brand-50 text-brand-700 text-sm rounded-xl px-4 py-2 mb-4">Profile updated!</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field" placeholder="+254 700 000 000" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? "Saving..." : "Save Changes"}</button>
        </form>
      </div>
    </div>
  );
}