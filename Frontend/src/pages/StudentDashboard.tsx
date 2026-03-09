// src/pages/StudentDashboard.tsx
import { useState, useEffect } from "react";
import { Home, Heart, CheckCircle, MessageSquare, Search, User, MapPin, Star } from "lucide-react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { pgAPI, reviewAPI } from "@/lib/api";
import { toast } from "sonner";

const sidebarItems = [
  { label: "Dashboard", icon: Home, path: "/dashboard" },
  { label: "Saved PGs", icon: Heart, path: "/dashboard/saved" },
  { label: "Verify Residency", icon: CheckCircle, path: "/dashboard/verify" },
  { label: "Write Review", icon: MessageSquare, path: "/dashboard/review" },
  { label: "Profile", icon: User, path: "/dashboard/profile" },
];

// ─── Student Home ─────────────────────────────────────────────────────────────
const StudentHome = () => {
  const { user } = useAuth();
  const [recentPGs, setRecentPGs] = useState<any[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pgsData, savedData] = await Promise.all([
          pgAPI.getAll({ limit: "3" }),
          pgAPI.getSaved(),
        ]);
        setRecentPGs(pgsData.pgs || []);
        setSavedCount(savedData.saved_pgs?.length || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Saved PGs" value={savedCount} icon={Heart} subtitle="Your saved listings" />
        <StatCard title="Residency Status" value={user?.is_verified ? "Verified" : "Unverified"} icon={CheckCircle} subtitle={user?.is_verified ? "Verified resident" : "Submit proof to verify"} />
        <StatCard title="PGs Explored" value={recentPGs.length} icon={Search} subtitle="Available near you" />
        <StatCard title="Account" value={user?.role === "student" ? "Student" : "Professional"} icon={User} subtitle={user?.email || ""} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Quick Search</h2>
          <Link to="/explore">
            <Button size="sm" variant="default">Explore All</Button>
          </Link>
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search PGs near you..."
            className="w-full rounded-xl border border-border bg-secondary/50 py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            onKeyDown={(e) => {
              if (e.key === "Enter") window.location.href = `/explore?search=${(e.target as HTMLInputElement).value}`;
            }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Top PGs Near You</h2>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-secondary/50" />
            ))}
          </div>
        ) : recentPGs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No PGs available yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentPGs.map((pg) => (
              <motion.div key={pg.id} whileHover={{ y: -4 }} className="rounded-xl border border-border overflow-hidden transition-shadow hover:shadow-md">
                {pg.primary_image ? (
                  <img src={pg.primary_image} alt={pg.name} className="h-32 w-full object-cover" />
                ) : (
                  <div className="h-32 w-full bg-secondary/50 flex items-center justify-center text-muted-foreground text-xs">No Image</div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground">{pg.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {pg.location}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold text-foreground">₹{pg.monthly_rent?.toLocaleString()}</span>
                    <Link to={`/pg/${pg.id}`}>
                      <Button size="sm" variant="default">View</Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Saved PGs ────────────────────────────────────────────────────────────────
const SavedPGs = () => {
  const [savedPGs, setSavedPGs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pgAPI.getSaved()
      .then((data) => setSavedPGs(data.saved_pgs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUnsave = async (pgId: number) => {
    try {
      await pgAPI.toggleSave(pgId);
      setSavedPGs((prev) => prev.filter((pg) => pg.id !== pgId));
      toast.success("PG removed from saved list");
    } catch {
      toast.error("Failed to unsave PG");
    }
  };

  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-secondary/50" />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Your Saved PGs</h2>
      {savedPGs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Heart className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-muted-foreground">No saved PGs yet.</p>
          <Link to="/explore"><Button className="mt-4" size="sm">Explore PGs</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savedPGs.map((pg) => (
            <motion.div key={pg.id} whileHover={{ y: -4 }} className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all">
              <div className="relative">
                {pg.primary_image ? (
                  <img src={pg.primary_image} alt={pg.name} className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 w-full bg-secondary/50 flex items-center justify-center text-muted-foreground text-xs">No Image</div>
                )}
                <button
                  onClick={() => handleUnsave(pg.id)}
                  className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm text-destructive"
                >
                  <Heart className="h-4 w-4 fill-current" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-foreground">{pg.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {pg.location}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-extrabold text-foreground">₹{pg.monthly_rent?.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                  <Link to={`/pg/${pg.id}`}><Button size="sm">View</Button></Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Verify Residency ─────────────────────────────────────────────────────────
const VerifyResidency = () => {
  const [pgId, setPgId] = useState("");
  const [availablePGs, setAvailablePGs] = useState<any[]>([]);
  const [loadingPGs, setLoadingPGs] = useState(true);
  const [proofUrl, setProofUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    pgAPI.getAll({ limit: "50" })
      .then((data) => setAvailablePGs(data.pgs || []))
      .catch(console.error)
      .finally(() => setLoadingPGs(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pgId || !proofUrl) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await reviewAPI.submitResidency(parseInt(pgId), proofUrl);
      toast.success("Verification submitted! Pending admin approval.");
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">Residency Verification</h2>
        <p className="mt-1 text-sm text-muted-foreground">Submit proof of your current residency to unlock review features.</p>
        {submitted ? (
          <div className="mt-6 rounded-xl bg-success/10 p-4 text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-success" />
            <p className="mt-2 font-medium text-success">Submitted successfully!</p>
            <p className="text-sm text-muted-foreground mt-1">Admin will verify within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Select Your PG</label>
              <select
                value={pgId}
                onChange={(e) => setPgId(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/50 p-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={loadingPGs}
              >
                <option value="">{loadingPGs ? "Loading PGs..." : "Select the PG you currently live in"}</option>
                {availablePGs.map((pg) => (
                  <option key={pg.id} value={pg.id}>{pg.name} — {pg.location}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Proof Document URL</label>
              <input
                type="url"
                placeholder="Link to your rent receipt / agreement"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/50 p-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">Upload your document to Google Drive and paste the shareable link</p>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Verification"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Write Review ─────────────────────────────────────────────────────────────
const WriteReview = () => {
  const [pgId, setPgId] = useState("");
  const [availablePGs, setAvailablePGs] = useState<any[]>([]);
  const [loadingPGs, setLoadingPGs] = useState(true);
  const [ratings, setRatings] = useState({ hygiene: 0, food: 0, safety: 0, amenities: 0, overall: 0 });
  const [reviewText, setReviewText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch all approved PGs for the dropdown
    pgAPI.getAll({ limit: "50" })
      .then((data) => setAvailablePGs(data.pgs || []))
      .catch(console.error)
      .finally(() => setLoadingPGs(false));
  }, []);

  const handleRating = (category: string, value: number) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pgId) { toast.error("Please select a PG"); return; }
    if (Object.values(ratings).some((r) => r === 0)) { toast.error("Please rate all categories"); return; }

    setLoading(true);
    try {
      await reviewAPI.submit({
        pg_id: parseInt(pgId),
        hygiene_rating: ratings.hygiene,
        food_rating: ratings.food,
        safety_rating: ratings.safety,
        amenities_rating: ratings.amenities,
        overall_rating: ratings.overall,
        review_text: reviewText,
        is_anonymous: isAnonymous,
      });
      toast.success("Review submitted successfully!");
      setPgId(""); setReviewText(""); setRatings({ hygiene: 0, food: 0, safety: 0, amenities: 0, overall: 0 });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const RatingStars = ({ category, label }: { category: string; label: string }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label} Rating</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => handleRating(category, n)}>
            <Star className={`h-6 w-6 transition-colors ${n <= (ratings as any)[category] ? "fill-primary text-primary" : "text-border hover:text-primary"}`} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">Write a Review</h2>
        <p className="mt-1 text-sm text-muted-foreground">Share your honest experience to help others. Only verified residents can submit reviews.</p>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Select PG</label>
            <select
              value={pgId}
              onChange={(e) => setPgId(e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/50 p-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={loadingPGs}
            >
              <option value="">{loadingPGs ? "Loading PGs..." : "Select a PG you lived in"}</option>
              {availablePGs.map((pg) => (
                <option key={pg.id} value={pg.id}>
                  {pg.name} — {pg.location}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Your Review</label>
            <textarea
              rows={4}
              placeholder="Describe your experience..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/50 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <RatingStars category="hygiene" label="Hygiene" />
            <RatingStars category="food" label="Food" />
            <RatingStars category="safety" label="Safety" />
            <RatingStars category="amenities" label="Amenities" />
            <RatingStars category="overall" label="Overall" />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} id="anon" className="accent-primary" />
            <label htmlFor="anon" className="text-sm text-foreground">Post anonymously</label>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </div>
    </div>
  );
};

// ─── Profile ──────────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { user } = useAuth();
  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {user?.name?.[0]?.toUpperCase() || "S"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{user?.name}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Student / Professional</span>
            {user?.is_verified && (
              <span className="ml-2 mt-1 inline-block rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">✓ Verified Resident</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const StudentDashboard = () => (
  <DashboardLayout items={sidebarItems} title="Student Dashboard">
    <Routes>
      <Route index element={<StudentHome />} />
      <Route path="saved" element={<SavedPGs />} />
      <Route path="verify" element={<VerifyResidency />} />
      <Route path="review" element={<WriteReview />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </DashboardLayout>
);

export default StudentDashboard;