import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import houseLogo from "../../assets/house-logo.png";

export default function Navbar() {
  const { user, profile, isAdmin, isLandlord, isTenant, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  async function handleSignOut() {
    try {
      const res = await signOut();
      if (res?.error) {
        // show non-blocking error but proceed to navigate home since local state is cleared
        console.warn("Server sign-out returned error:", res.error);
        alert("Signed out locally, but server sign-out failed (network).\nYou may need to sign in again later.");
      }
      // Ensure we navigate home and reload so any cached state is cleared
      navigate("/");
      try {
        // small delay to allow navigation before reload
        setTimeout(() => window.location.reload(), 150);
      } catch {
        // ignore reload errors
      }
    } catch (err) {
      console.warn("Sign out exception:", err);
      alert("Failed to sign out. Please try again.");
    }
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/60 bg-white/70 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="h-1 bg-gradient-to-r from-sky-400 via-brand-500 to-fuchsia-400" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-gray-900/5 transition-transform group-hover:-translate-y-0.5">
              <img src={houseLogo} alt="" className="h-8 w-8 object-contain" aria-hidden="true" />
            </span>
            <span className="hidden sm:block leading-tight">
              <span className="block font-display text-lg font-bold text-gray-950">
                House Hunting <span className="text-brand-600">Hub</span>
              </span>
              <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
                Verified Embu rentals
              </span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 rounded-2xl border border-gray-200/70 bg-white/55 p-1 shadow-sm">
            <NavLink to="/" active={isActive("/")}>Home</NavLink>
            <NavLink to="/listings" active={location.pathname.startsWith("/listings")}>Browse</NavLink>
            {isTenant && <NavLink to="/tenant" active={isActive("/tenant")}>Dashboard</NavLink>}
            {isLandlord && <NavLink to="/landlord" active={isActive("/landlord")}>My Listings</NavLink>}
            {isAdmin && <NavLink to="/admin" active={isActive("/admin")}>Admin</NavLink>}
          </div>

          {/* Right section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                    <span className="text-brand-700 font-semibold text-sm">
                      {profile?.full_name?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-30 truncate">
                    {profile?.full_name || "User"}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {dropOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-hover border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{profile?.full_name}</p>
                      <span className={`text-xs capitalize font-medium ${
                        isAdmin ? "text-purple-600" : isLandlord ? "text-earth-600" : "text-brand-600"
                      }`}>{profile?.role}</span>
                    </div>
                    <Link to="/profile" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Profile
                    </Link>
                    {isTenant && <>
                      <Link to="/tenant/saved" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        Saved
                      </Link>
                      <Link to="/tenant/bookings" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Bookings
                      </Link>
                    </>}
                    {isLandlord && <>
                      <Link to="/landlord/add" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add Property
                      </Link>
                      <Link to="/landlord/inquiries" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        Inquiries
                      </Link>
                    </>}
                    <button onClick={handleSignOut} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 mt-1 border-t border-gray-50">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="rounded-xl border border-gray-200 bg-white/70 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-white">Sign in</Link>
                <Link to="/register" className="rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-700/20 transition-transform hover:-translate-y-0.5">Get started</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100/70 space-y-1 rounded-b-3xl bg-white/85 backdrop-blur-xl">
            <MobileLink to="/" onClick={() => setMenuOpen(false)}>Home</MobileLink>
            <MobileLink to="/listings" onClick={() => setMenuOpen(false)}>Browse Houses</MobileLink>
            {user ? (
              <>
                <MobileLink to="/profile" onClick={() => setMenuOpen(false)}>Profile</MobileLink>
                {isTenant && <>
                  <MobileLink to="/tenant" onClick={() => setMenuOpen(false)}>Dashboard</MobileLink>
                  <MobileLink to="/tenant/saved" onClick={() => setMenuOpen(false)}>Saved</MobileLink>
                  <MobileLink to="/tenant/bookings" onClick={() => setMenuOpen(false)}>Bookings</MobileLink>
                </>}
                {isLandlord && <>
                  <MobileLink to="/landlord" onClick={() => setMenuOpen(false)}>My Listings</MobileLink>
                  <MobileLink to="/landlord/add" onClick={() => setMenuOpen(false)}>Add Property</MobileLink>
                  <MobileLink to="/landlord/inquiries" onClick={() => setMenuOpen(false)}>Inquiries</MobileLink>
                </>}
                {isAdmin && <MobileLink to="/admin" onClick={() => setMenuOpen(false)}>Admin Panel</MobileLink>}
                <button
                  onClick={() => { handleSignOut(); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 rounded-xl hover:bg-red-50"
                >Sign out</button>
              </>
            ) : (
              <div className="flex gap-2 pt-2 px-4">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary text-sm flex-1 text-center">Sign in</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary text-sm flex-1 text-center">Register</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
        active
          ? "bg-white text-brand-700 shadow-sm ring-1 ring-brand-100"
          : "text-gray-600 hover:text-gray-950 hover:bg-white/70"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileLink({ to, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50"
    >
      {children}
    </Link>
  );
}
