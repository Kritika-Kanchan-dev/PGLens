// src/pages/AdminDashboard.tsx
import { useState, useEffect } from "react";
import { Home, Building, Users, CheckCircle, AlertTriangle, Flag, Eye, XCircle } from "lucide-react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { pgAPI, reviewAPI } from "@/lib/api";
import { toast } from "sonner";

const sidebarItems = [
  { label: "Dashboard", icon: Home, path: "/admin" },
  { label: "PG Approvals", icon: CheckCircle, path: "/admin/approvals" },
  { label: "Verify Residents", icon: Users, path: "/admin/residents" },
  { label: "Review Moderation", icon: Flag, path: "/admin/moderation" },
];

// ─── Admin Home ───────────────────────────────────────────────────────────────
const AdminHome = () => {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [pendingPGs, setPendingPGs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      pgAPI.getAll({ limit: "100" }),
      fetch("http://localhost:5000/api/pgs?status=pending&limit=3", {
        headers: { Authorization: `Bearer ${localStorage.getItem("pglens_token")}` }
      }).then(r => r.json())
    ]).then(([allData]) => {
      const all = allData.pgs || [];
      setStats({
        total: allData.pagination?.total || all.length,
        pending: all.filter((p: any) => p.status === 'pending').length,
        approved: all.filter((p: any) => p.status === 'approved').length,
      });
    }).catch(console.error).finally(() => setLoading(false));

    fetch("http://localhost:5000/api/admin/pgs/pending", {
      headers: { Authorization: `Bearer ${localStorage.getItem("pglens_token")}` }
    }).then(r => r.json()).then(data => {
      if (data.pgs) setPendingPGs(data.pgs.slice(0, 3));
    }).catch(() => {});
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await pgAPI.updateStatus(id, "approved");
      setPendingPGs((prev) => prev.filter((pg) => pg.id !== id));
      setStats((prev) => ({ ...prev, pending: prev.pending - 1, approved: prev.approved + 1 }));
      toast.success("PG approved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to approve PG");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await pgAPI.updateStatus(id, "rejected");
      setPendingPGs((prev) => prev.filter((pg) => pg.id !== id));
      setStats((prev) => ({ ...prev, pending: prev.pending - 1 }));
      toast.success("PG rejected");
    } catch (err: any) {
      toast.error(err.message || "Failed to reject PG");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total PGs" value={stats.total} icon={Building} subtitle="On platform" />
        <StatCard title="Pending Approvals" value={stats.pending} icon={AlertTriangle} subtitle="Needs attention" />
        <StatCard title="Approved PGs" value={stats.approved} icon={CheckCircle} subtitle="Live listings" />
        <StatCard title="Platform Status" value="Active" icon={Flag} subtitle="All systems normal" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Recent PG Submissions</h2>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary/50" />)}</div>
          ) : pendingPGs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending PGs. All caught up! ✅</p>
          ) : (
            <div className="space-y-3">
              {pendingPGs.map((pg) => (
                <div key={pg.id} className="flex items-center justify-between rounded-xl bg-secondary/30 p-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{pg.name}</p>
                    <p className="text-xs text-muted-foreground">{pg.location} • by {pg.owner_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" className="h-8 gap-1" onClick={() => handleApprove(pg.id)}>
                      <CheckCircle className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-destructive gap-1" onClick={() => handleReject(pg.id)}>
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Platform Health</h2>
          <div className="space-y-3">
            {[
              { label: "Approved PGs Rate", value: stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0, color: "bg-success" },
              { label: "Review Authenticity", value: 96, color: "bg-success" },
              { label: "Price Fairness Index", value: 78, color: "bg-primary" },
              { label: "Response Rate", value: 91, color: "bg-success" },
            ].map((m) => (
              <div key={m.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{m.label}</span>
                  <span className="font-semibold text-foreground">{m.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${m.value}%` }} transition={{ duration: 0.8 }}
                    className={`h-full rounded-full ${m.color}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PG Approvals ─────────────────────────────────────────────────────────────
const PGApprovals = () => {
  const [pgs, setPGs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/admin/pgs/pending", {
      headers: { Authorization: `Bearer ${localStorage.getItem("pglens_token")}` }
    }).then(r => r.json()).then(data => {
      setPGs(data.pgs || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleStatus = async (id: number, status: "approved" | "rejected") => {
    try {
      await pgAPI.updateStatus(id, status);
      setPGs((prev) => prev.filter((pg) => pg.id !== id));
      toast.success(`PG ${status}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">PG Approval Queue</h2>
      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-secondary/50" />
      ) : pgs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <CheckCircle className="mx-auto h-10 w-10 text-success/50" />
          <p className="mt-3 text-muted-foreground">No pending PGs! All caught up ✅</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left font-semibold text-foreground">PG Name</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Owner</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Location</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Rent</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pgs.map((pg) => (
                <tr key={pg.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{pg.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{pg.owner_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{pg.location}</td>
                  <td className="px-4 py-3 text-foreground">₹{pg.monthly_rent?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" className="h-8" onClick={() => handleStatus(pg.id, "approved")}>Approve</Button>
                      <Button size="sm" variant="ghost" className="h-8 text-destructive" onClick={() => handleStatus(pg.id, "rejected")}>Reject</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Verify Residents ─────────────────────────────────────────────────────────
const VerifyResidents = () => {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewAPI.getPendingVerifications()
      .then((data) => setVerifications(data.verifications || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStatus = async (id: number, status: "approved" | "rejected") => {
    try {
      await reviewAPI.updateResidencyStatus(id, status);
      setVerifications((prev) => prev.filter((v) => v.id !== id));
      toast.success(`Residency ${status}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Residency Verification Requests</h2>
      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-secondary/50" />
      ) : verifications.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-success/50" />
          <p className="mt-3 text-muted-foreground">No pending verifications! ✅</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left font-semibold text-foreground">Student</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">PG Name</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Proof</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {verifications.map((v) => (
                <tr key={v.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{v.student_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.pg_name}</td>
                  <td className="px-4 py-3">
                    <a href={v.proof_url} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-primary">
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" className="h-8" onClick={() => handleStatus(v.id, "approved")}>Approve</Button>
                      <Button size="sm" variant="ghost" className="h-8 text-destructive" onClick={() => handleStatus(v.id, "rejected")}>Reject</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Review Moderation ────────────────────────────────────────────────────────
const ReviewModeration = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "flagged" | "approved" | "removed">("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    reviewAPI.getAllReviews()
      .then((data) => setReviews(data.reviews || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = reviews.filter((r) => {
    if (filter === "all")      return true;
    if (filter === "flagged")  return r.is_flagged && r.is_approved;
    if (filter === "approved") return r.is_approved && !r.is_flagged;
    if (filter === "removed")  return !r.is_approved;
    return true;
  });

  // Clear flag — makes review fully approved and visible, removes flag
  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await reviewAPI.flagReview(id, true);
      setReviews((prev) =>
        prev.map((r) => r.id === id ? { ...r, is_approved: true, is_flagged: false } : r)
      );
      toast.success("Review approved and visible to students");
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  // Flag — review stays visible but marked for attention
  const handleFlag = async (id: number) => {
    setActionLoading(id);
    try {
      await reviewAPI.flagReview(id, true);
      setReviews((prev) =>
        prev.map((r) => r.id === id ? { ...r, is_flagged: true, is_approved: true } : r)
      );
      toast.success("Review flagged for attention");
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  // Remove — hides review from public completely
  const handleRemove = async (id: number) => {
    setActionLoading(id);
    try {
      await reviewAPI.flagReview(id, false);
      setReviews((prev) =>
        prev.map((r) => r.id === id ? { ...r, is_approved: false, is_flagged: true } : r)
      );
      toast.success("Review hidden from public view");
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const sentimentColor = (s: string) => {
    if (s === "positive") return "text-green-600 bg-green-50";
    if (s === "negative") return "text-red-600 bg-red-50";
    return "text-yellow-600 bg-yellow-50";
  };

  const tabs = [
    { key: "all",      label: "All Reviews", count: reviews.length },
    { key: "approved", label: "Approved",     count: reviews.filter(r => r.is_approved && !r.is_flagged).length },
    { key: "flagged",  label: "Flagged",      count: reviews.filter(r => r.is_flagged && r.is_approved).length },
    { key: "removed",  label: "Removed",      count: reviews.filter(r => !r.is_approved).length },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Review Moderation</h2>
        <span className="text-sm text-muted-foreground">{reviews.length} total reviews</span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              filter === tab.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-secondary/50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Flag className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-muted-foreground">No reviews in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <div
              key={review.id}
              className={`rounded-2xl border bg-card p-4 transition-all ${
                !review.is_approved
                  ? "border-red-200 bg-red-50/30"
                  : review.is_flagged
                  ? "border-yellow-200 bg-yellow-50/30"
                  : "border-border"
              }`}
            >
              {/* Top row: PG name · reviewer · date + badges */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  <span className="font-semibold text-primary">{review.pg_name}</span>
                  <span>·</span>
                  <span>{review.reviewer_name}</span>
                  <span>·</span>
                  <span>
                    {new Date(review.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-semibold">⭐ {review.overall_rating}/5</span>
                  {/* Status badge */}
                  {!review.is_approved ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Removed</span>
                  ) : review.is_flagged ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Flagged</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Approved</span>
                  )}
                  {/* NLP sentiment badge */}
                  {review.sentiment && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${sentimentColor(review.sentiment)}`}>
                      {review.sentiment}
                    </span>
                  )}
                </div>
              </div>

              {/* Review text */}
              <p className="text-sm text-foreground mb-2 leading-relaxed">
                {review.review_text
                  ? `"${review.review_text}"`
                  : <span className="italic text-muted-foreground">No written review — ratings only</span>
                }
              </p>

              {/* NLP keywords */}
              {review.nlp_keywords && review.nlp_keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {review.nlp_keywords.map((kw: string, i: number) => (
                    <span key={i} className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              {/* Sub-ratings */}
              <div className="flex gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
                <span>🧹 Hygiene: <strong>{review.hygiene_rating}</strong></span>
                <span>🍽️ Food: <strong>{review.food_rating}</strong></span>
                <span>🔒 Safety: <strong>{review.safety_rating}</strong></span>
                <span>🛎️ Amenities: <strong>{review.amenities_rating}</strong></span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                {!review.is_approved ? (
                  // REMOVED → only Restore
                  <Button
                    size="sm"
                    className="h-8 gap-1"
                    disabled={actionLoading === review.id}
                    onClick={() => handleApprove(review.id)}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {actionLoading === review.id ? "Restoring..." : "Restore"}
                  </Button>
                ) : (
                  <>
                    {/* APPROVED + NOT FLAGGED → show Flag button */}
                    {!review.is_flagged && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1 text-yellow-600 hover:bg-yellow-50"
                        disabled={actionLoading === review.id}
                        onClick={() => handleFlag(review.id)}
                      >
                        <Flag className="h-3.5 w-3.5" />
                        {actionLoading === review.id ? "Flagging..." : "Flag"}
                      </Button>
                    )}
                    {/* FLAGGED → show Approve to clear the flag */}
                    {review.is_flagged && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1 text-green-600 hover:bg-green-50"
                        disabled={actionLoading === review.id}
                        onClick={() => handleApprove(review.id)}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        {actionLoading === review.id ? "Approving..." : "Approve"}
                      </Button>
                    )}
                    {/* Always show Remove for any approved review */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1 text-destructive hover:bg-destructive/10"
                      disabled={actionLoading === review.id}
                      onClick={() => handleRemove(review.id)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      {actionLoading === review.id ? "Removing..." : "Remove"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const AdminDashboard = () => (
  <DashboardLayout items={sidebarItems} title="Admin Panel">
    <Routes>
      <Route index element={<AdminHome />} />
      <Route path="approvals" element={<PGApprovals />} />
      <Route path="residents" element={<VerifyResidents />} />
      <Route path="moderation" element={<ReviewModeration />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  </DashboardLayout>
);

export default AdminDashboard;