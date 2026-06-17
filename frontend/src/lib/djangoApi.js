const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

let currentUser = null;
const authListeners = new Set();

function makeError(message, status) {
  const err = new Error(message || "Request failed");
  err.status = status;
  return err;
}

function qs(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      query.set(key, value);
    }
  });
  return query.size ? `?${query}` : "";
}

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) throw makeError(body.error || res.statusText, res.status);
  return body;
}

function emitAuth(event) {
  const session = currentUser ? { user: currentUser } : null;
  authListeners.forEach((listener) => listener(event, session));
}

async function listProperties(filters = {}) {
  const params = { ...filters };
  if (params.publicOnly) {
    params.public = "true";
    delete params.publicOnly;
  }
  if (params.available === true) params.available = "true";
  const body = await request(`/properties/${qs(params)}`);
  return body.properties || [];
}

async function listProfiles(filters = {}) {
  const body = await request(`/profiles/${qs(filters)}`);
  return body.profiles || [];
}

async function listSavedProperties() {
  const body = await request("/saved-properties/");
  return body.saved_properties || [];
}

async function listBookings(filters = {}) {
  const body = await request(`/bookings/${qs(filters)}`);
  return body.bookings || [];
}

async function listInquiries(filters = {}) {
  const body = await request(`/inquiries/${qs(filters)}`);
  return body.inquiries || [];
}

export const djangoApi = {
  auth: {
    async getSession() {
      const body = await request("/auth/me/");
      currentUser = body.user;
      return currentUser ? { user: currentUser } : null;
    },
    onAuthStateChange(callback) {
      authListeners.add(callback);
      return { unsubscribe: () => authListeners.delete(callback) };
    },
    async register({ email, password, fullName, role }) {
      const body = await request("/auth/register/", {
        method: "POST",
        body: JSON.stringify({ email, password, full_name: fullName, role }),
      });
      currentUser = body.user;
      emitAuth("SIGNED_IN");
      return body.user;
    },
    async login({ email, password }) {
      const body = await request("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      currentUser = body.user;
      emitAuth("SIGNED_IN");
      return body.user;
    },
    async logout() {
      try {
        await request("/auth/logout/", { method: "POST" });
      } finally {
        currentUser = null;
        emitAuth("SIGNED_OUT");
      }
    },
  },
  stats: {
    async public() {
      return (await request("/stats/")).stats;
    },
    async adminDashboard() {
      return (await request("/dashboard/admin/")).stats;
    },
    async landlordDashboard() {
      return (await request("/dashboard/landlord/")).stats;
    },
    async tenantDashboard() {
      return (await request("/dashboard/tenant/")).stats;
    },
  },
  profiles: {
    list: listProfiles,
    async get(id) {
      return (await request(`/profiles/${id}/`)).profile;
    },
    async update(data) {
      return (await request("/profile/", { method: "PATCH", body: JSON.stringify(data) })).profile;
    },
    async updateRole(id, role) {
      return (await request(`/profiles/${id}/role/`, { method: "PATCH", body: JSON.stringify({ role }) })).profile;
    },
  },
  properties: {
    list: listProperties,
    async get(id) {
      return (await request(`/properties/${id}/`)).property;
    },
    async create(data) {
      return (await request("/properties/", { method: "POST", body: JSON.stringify(data) })).property;
    },
    async update(id, data) {
      return (await request(`/properties/${id}/`, { method: "PATCH", body: JSON.stringify(data) })).property;
    },
    async remove(id) {
      return request(`/properties/${id}/`, { method: "DELETE" });
    },
    async incrementViews(id) {
      return request(`/properties/${id}/views/`, { method: "POST" });
    },
  },
  savedProperties: {
    list: listSavedProperties,
    async has(propertyId) {
      const rows = await listSavedProperties();
      return rows.some((row) => String(row.property_id) === String(propertyId));
    },
    async create(propertyId) {
      return (await request("/saved-properties/", { method: "POST", body: JSON.stringify({ property_id: propertyId }) })).saved;
    },
    async remove(propertyId) {
      return request(`/saved-properties/${propertyId}/`, { method: "DELETE" });
    },
  },
  bookings: {
    list: listBookings,
    async create(data) {
      return (await request("/bookings/", { method: "POST", body: JSON.stringify(data) })).booking;
    },
    async updateStatus(id, status) {
      return (await request(`/bookings/${id}/`, { method: "PATCH", body: JSON.stringify({ status }) })).booking;
    },
  },
  inquiries: {
    list: listInquiries,
    async create(data) {
      return (await request("/inquiries/", { method: "POST", body: JSON.stringify(data) })).inquiry;
    },
    async reply(id, reply) {
      return (await request(`/inquiries/${id}/reply/`, { method: "PATCH", body: JSON.stringify({ reply }) })).inquiry;
    },
  },
  media: {
    async upload(file) {
      const form = new FormData();
      form.append("file", file);
      const body = await request("/media/upload/", { method: "POST", body: form });
      return { path: body.url || body.path, url: body.url };
    },
  },
};

export function getStorageUrl(path) {
  if (!path) return null;
  if (path.startsWith("data:")) return path;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/media/")) return `${API_ORIGIN}${path}`;
  if (path.startsWith("media/")) return `${API_ORIGIN}/${path}`;
  return `${API_ORIGIN}/media/${path}`;
}
