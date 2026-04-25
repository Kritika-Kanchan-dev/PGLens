// src/lib/api.ts
// Central file for all backend API calls
// Base URL points to your Express backend

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Helper: get token from localStorage ─────────────────────────────────────
const getToken = () => localStorage.getItem("pglens_token");

// ─── Helper: build headers ────────────────────────────────────────────────────
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ─── Helper: handle response ──────────────────────────────────────────────────
const handleResponse = async (res: Response) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH APIs
// ═══════════════════════════════════════════════════════════════════════════════

export const authAPI = {
  // POST /api/auth/register
  register: async (name: string, email: string, password: string, role: string) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    return handleResponse(res);
  },

  // POST /api/auth/login
  login: async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  // GET /api/auth/me
  getMe: async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  // Google OAuth — just redirect browser to backend
  googleLogin: () => {
    window.location.href = `${BASE_URL}/auth/google`;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PG APIs
// ═══════════════════════════════════════════════════════════════════════════════

export const pgAPI = {
  // GET /api/pgs?city=...&min_rent=...&sort=...
  getAll: async (filters?: Record<string, string>) => {
    const params = new URLSearchParams(filters || {}).toString();
    const res = await fetch(`${BASE_URL}/pgs${params ? `?${params}` : ""}`);
    return handleResponse(res);
  },

  // GET /api/pgs/:id
  getById: async (id: string | number) => {
    const res = await fetch(`${BASE_URL}/pgs/${id}`);
    return handleResponse(res);
  },

  // POST /api/pgs (owner only)
  create: async (data: Record<string, unknown>) => {
    const res = await fetch(`${BASE_URL}/pgs`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // PUT /api/pgs/:id (owner only)
  update: async (id: number, data: Record<string, unknown>) => {
    const res = await fetch(`${BASE_URL}/pgs/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // DELETE /api/pgs/:id
  delete: async (id: number) => {
    const res = await fetch(`${BASE_URL}/pgs/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  // PATCH /api/pgs/:id/status (admin only)
  updateStatus: async (id: number, status: "approved" | "rejected") => {
    const res = await fetch(`${BASE_URL}/pgs/${id}/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  // GET /api/pgs/owner/my-listings (owner only)
  getOwnerListings: async () => {
    const res = await fetch(`${BASE_URL}/pgs/owner/my-listings`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  // POST /api/pgs/:id/save (student only)
  toggleSave: async (id: number) => {
    const res = await fetch(`${BASE_URL}/pgs/${id}/save`, {
      method: "POST",
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  // GET /api/pgs/student/saved (student only)
  getSaved: async () => {
    const res = await fetch(`${BASE_URL}/pgs/student/saved`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEW APIs
// ═══════════════════════════════════════════════════════════════════════════════

export const reviewAPI = {
  // GET /api/reviews/pg/:pg_id
  getByPG: async (pg_id: number) => {
    const res = await fetch(`${BASE_URL}/reviews/pg/${pg_id}`);
    return handleResponse(res);
  },

  // GET /api/reviews/scorecard/:pg_id
  getScorecard: async (pg_id: number) => {
    const res = await fetch(`${BASE_URL}/reviews/scorecard/${pg_id}`);
    return handleResponse(res);
  },

  // POST /api/reviews (student only)
  submit: async (data: Record<string, unknown>) => {
    const res = await fetch(`${BASE_URL}/reviews`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // POST /api/reviews/verify-residency (student only)
  submitResidency: async (pg_id: number, proof_url: string) => {
    const res = await fetch(`${BASE_URL}/reviews/verify-residency`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ pg_id, proof_url }),
    });
    return handleResponse(res);
  },

  // POST /api/reviews/:id/reply (owner only)
  reply: async (review_id: number, reply: string) => {
    const res = await fetch(`${BASE_URL}/reviews/${review_id}/reply`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ reply }),
    });
    return handleResponse(res);
  },

  // GET /api/reviews/verify-residency/pending (admin only)
  getPendingVerifications: async () => {
    const res = await fetch(`${BASE_URL}/reviews/verify-residency/pending`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  // PATCH /api/reviews/verify-residency/:id (admin only)
  updateResidencyStatus: async (id: number, status: "approved" | "rejected") => {
    const res = await fetch(`${BASE_URL}/reviews/verify-residency/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  // PATCH /api/reviews/:id/flag (admin only)
  flagReview: async (id: number, is_approved: boolean) => {
    const res = await fetch(`${BASE_URL}/reviews/${id}/flag`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ is_approved }),
    });
    return handleResponse(res);
  },

  // GET /api/admin/reviews — all reviews for admin moderation
  getAllReviews: async () => {
    const res = await fetch(`${BASE_URL}/admin/reviews`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  // PATCH /api/reviews/:id/report — student reports a suspicious review
  reportReview: async (id: number) => {
    const res = await fetch(`${BASE_URL}/reviews/${id}/report`, {
      method: "PATCH",
      headers: authHeaders(),
    });
    return handleResponse(res);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE APIs
// ═══════════════════════════════════════════════════════════════════════════════

export const imageAPI = {
  // POST /api/images/upload/:pg_id/:category
  uploadCategory: async (pg_id: number, category: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));

    const res = await fetch(`${BASE_URL}/images/upload/${pg_id}/${category}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        // NOTE: do NOT set Content-Type here — browser sets it automatically with boundary for multipart
      },
      body: formData,
    });
    return handleResponse(res);
  },

  // GET /api/images/pg/:pg_id
  getByPG: async (pg_id: number) => {
    const res = await fetch(`${BASE_URL}/images/pg/${pg_id}`);
    return handleResponse(res);
  },

  // PATCH /api/images/:image_id/primary
  setPrimary: async (image_id: number) => {
    const res = await fetch(`${BASE_URL}/images/${image_id}/primary`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  // DELETE /api/images/:image_id
  delete: async (image_id: number) => {
    const res = await fetch(`${BASE_URL}/images/${image_id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handleResponse(res);
  },
};