import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "", role: "tenant", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function handle(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error: err } = await signUp({ email: form.email, password: form.password, fullName: form.fullName, role: form.role });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
  }

  if (success) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card p-8 text-center">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Check your email!</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          We've sent a confirmation link to <strong>{form.email}</strong>. Click the link to activate your account.
        </p>
        <Link to="/login" className="btn-primary inline-block">Go to Login</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
            </div>
          </Link>
          <h1 className="font-display text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Join House Hunting Hub — Embu's trusted property platform</p>
        </div>

        <div className="card p-8">
          {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { value: "tenant", label: "I'm a Tenant", icon: "🔍", desc: "Looking for a house" },
              { value: "landlord", label: "I'm a Landlord", icon: "🏠", desc: "Listing my property" },
            ].map(({ value, label, icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, role: value }))}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  form.role === value
                    ? "border-brand-500 bg-brand-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-1">{icon}</div>
                <p className="font-medium text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input type="text" value={form.fullName} onChange={handle("fullName")}
                required placeholder="John Mwangi" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input type="email" value={form.email} onChange={handle("email")}
                required placeholder="you@example.com" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone (optional)</label>
              <input type="tel" value={form.phone} onChange={handle("phone")}
                placeholder="+254 700 000 000" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={handle("password")}
                required placeholder="Min. 6 characters" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <input type="password" value={form.confirm} onChange={handle("confirm")}
                required placeholder="Repeat password" className="input-field" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}