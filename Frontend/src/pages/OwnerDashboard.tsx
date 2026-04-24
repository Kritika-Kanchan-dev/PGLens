// src/pages/OwnerDashboard.tsx
import { useState, useEffect } from "react";
import { Home, Building, BarChart3, MessageSquare, Plus, User, Star, Edit, Trash2, Eye, MapPin, Loader2, Navigation, HelpCircle, ChevronDown } from "lucide-react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import ImageUploadStep from "@/components/ImageUploader";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { pgAPI, reviewAPI } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { geocodeAddress } from "@/lib/useDistance";

const sidebarItems = [
  { label: "Dashboard", icon: Home, path: "/owner" },
  { label: "My Listings", icon: Building, path: "/owner/listings" },
  { label: "Add PG", icon: Plus, path: "/owner/add" },
  { label: "Analytics", icon: BarChart3, path: "/owner/analytics" },
  { label: "Reviews", icon: MessageSquare, path: "/owner/reviews" },
  { label: "Profile", icon: User, path: "/owner/profile" },
];

// ─── Owner Home ───────────────────────────────────────────────────────────────
const OwnerHome = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pgAPI.getOwnerListings()
      .then((data) => {
        const pgs = data.pgs || [];
        setListings(pgs);
        if (pgs.length > 0) {
          return reviewAPI.getByPG(pgs[0].id);
        }
      })
      .then((data) => { if (data) setReviews(data.reviews?.slice(0, 3) || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalViews = listings.reduce((sum, pg) => sum + (pg.total_views || 0), 0);
  const totalReviews = listings.reduce((sum, pg) => sum + (pg.total_reviews || 0), 0);
  const avgRating = listings.length > 0
    ? (listings.reduce((sum, pg) => sum + (pg.overall_score || 0), 0) / listings.length / 20).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Listings" value={listings.length} icon={Building} subtitle={`${listings.filter(p => p.status === 'approved').length} approved`} />
        <StatCard title="Avg Rating" value={avgRating} icon={Star} subtitle="Across all PGs" />
        <StatCard title="Total Views" value={totalViews} icon={Eye} subtitle="All time views" />
        <StatCard title="Reviews" value={totalReviews} icon={MessageSquare} subtitle="Total reviews received" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Listing Performance</h2>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary/50" />)}</div>
          ) : listings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No listings yet. Add your first PG!</p>
          ) : (
            <div className="space-y-4">
              {listings.map((pg) => (
                <div key={pg.id} className="flex items-center justify-between rounded-xl bg-secondary/30 p-3">
                  <div className="flex items-center gap-3">
                    {pg.primary_image ? (
                      <img src={pg.primary_image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">PG</div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-foreground">{pg.name}</p>
                      <p className="text-xs text-muted-foreground">Score: {pg.overall_score || 0}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    pg.status === 'approved' ? 'bg-success/10 text-success' :
                    pg.status === 'pending' ? 'bg-warning/10 text-warning' :
                    'bg-destructive/10 text-destructive'
                  }`}>{pg.status?.charAt(0).toUpperCase() + pg.status?.slice(1)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Recent Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r, i) => (
                <div key={i} className="rounded-xl bg-secondary/30 p-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={`h-3 w-3 ${j < (r.overall_rating || 0) ? "fill-primary text-primary" : "text-border"}`} />
                    ))}
                    <span className="ml-auto text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{r.review_text || "No text provided"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── My Listings ──────────────────────────────────────────────────────────────
const MyListings = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    pgAPI.getOwnerListings()
      .then((data) => setListings(data.pgs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this PG?")) return;
    try {
      await pgAPI.delete(id);
      setListings((prev) => prev.filter((pg) => pg.id !== id));
      toast.success("PG deleted successfully");
    } catch {
      toast.error("Failed to delete PG");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">My PG Listings</h2>
        <Button size="sm" className="gap-2" onClick={() => navigate("/owner/add")}>
          <Plus className="h-4 w-4" /> Add New PG
        </Button>
      </div>
      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-secondary/50" />
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Building className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-muted-foreground">No listings yet.</p>
          <Button className="mt-4" size="sm" onClick={() => navigate("/owner/add")}>Add Your First PG</Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left font-semibold text-foreground">PG Name</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Score</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Price</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((pg) => (
                <tr key={pg.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {pg.primary_image ? (
                        <img src={pg.primary_image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">PG</div>
                      )}
                      <div>
                        <span className="font-medium text-foreground">{pg.name}</span>
                        {pg.latitude && pg.longitude && (
                          <p className="flex items-center gap-1 text-xs text-success mt-0.5">
                            <Navigation className="h-3 w-3" /> Location mapped
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      pg.status === 'approved' ? 'bg-success/10 text-success' :
                      pg.status === 'pending' ? 'bg-warning/10 text-warning' :
                      'bg-destructive/10 text-destructive'
                    }`}>{pg.status?.charAt(0).toUpperCase() + pg.status?.slice(1)}</span>
                  </td>
                  <td className="px-4 py-3 text-foreground">{pg.overall_score || 0}/100</td>
                  <td className="px-4 py-3 text-foreground">₹{pg.monthly_rent?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate(`/pg/${pg.id}`)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" onClick={() => handleDelete(pg.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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

// ─── Add PG ───────────────────────────────────────────────────────────────────
const AddPG = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showCoordHelp, setShowCoordHelp] = useState(false);
  const [step, setStep] = useState<"details" | "images">("details");
  const [createdPgId, setCreatedPgId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "", location: "", city: "", monthly_rent: "",
    room_type: "single", total_rooms: "1",
    latitude: "", longitude: "",
    has_wifi: false, has_ac: false, has_meals: false,
    has_laundry: false, has_parking: false, has_security: false,
    has_gym: false, has_hot_water: false, has_tv: false,
  });

  // Auto-detect coordinates from location + city
  const handleAutoDetect = async () => {
    const address = [form.location, form.city].filter(Boolean).join(", ");
    if (!address.trim()) {
      toast.error("Please enter a location and city first");
      return;
    }
    setGeoLoading(true);
    try {
      const coords = await geocodeAddress(`${address} India`);
      if (!coords) {
        toast.error("Could not detect location. Try entering a more specific address.");
        return;
      }
      setForm((prev) => ({
        ...prev,
        latitude: coords[0].toFixed(6),
        longitude: coords[1].toFixed(6),
      }));
      toast.success("Location detected successfully!");
    } catch {
      toast.error("Failed to detect location");
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.location || !form.city || !form.monthly_rent || !form.latitude || !form.longitude || !form.room_type) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      const data = await pgAPI.create({
        ...form,
        monthly_rent: parseInt(form.monthly_rent),
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      });
      setCreatedPgId(data.pg.id);
      toast.success("PG details saved! Upload photos by category. Bedroom & Washroom are required.");
      setStep("images");
    } catch (err: any) {
      toast.error(err.message || "Failed to create PG");
    } finally {
      setLoading(false);
    }
  };

  const amenities = [
    { key: "has_wifi", label: "WiFi" }, { key: "has_ac", label: "AC" },
    { key: "has_meals", label: "Meals" }, { key: "has_laundry", label: "Laundry" },
    { key: "has_parking", label: "Parking" }, { key: "has_security", label: "Security" },
    { key: "has_gym", label: "Gym" }, { key: "has_hot_water", label: "Hot Water" },
    { key: "has_tv", label: "TV" },
  ];

  const StepIndicator = () => (
    <div className="flex items-center gap-3 mb-6">
      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step === "details" ? "bg-primary text-white" : "bg-success text-white"}`}>
        {step === "details" ? "1" : "✓"}
      </div>
      <span className={`text-sm font-medium ${step === "details" ? "text-foreground" : "text-success"}`}>PG Details</span>
      <div className="h-px flex-1 bg-border" />
      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step === "images" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
        2
      </div>
      <span className={`text-sm font-medium ${step === "images" ? "text-foreground" : "text-muted-foreground"}`}>Upload Images</span>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">Add New PG</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === "details" ? "Fill in your PG details." : "Upload at least 4 photos of your PG (max 10)."}
        </p>
        <div className="mt-6">
          <StepIndicator />
          {step === "details" && (
            <form className="space-y-5" onSubmit={handleSubmitDetails}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">PG Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-secondary/50 p-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Enter PG name" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Location *</label>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full rounded-xl border border-border bg-secondary/50 p-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Area, City" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">City *</label>
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full rounded-xl border border-border bg-secondary/50 p-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Lucknow" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Monthly Rent (Rs) *</label>
                  <input type="number" value={form.monthly_rent} onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })}
                    className="w-full rounded-xl border border-border bg-secondary/50 p-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="8000" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Room Type *</label>
                  <select value={form.room_type} onChange={(e) => setForm({ ...form, room_type: e.target.value })}
                    className="w-full rounded-xl border border-border bg-secondary/50 p-2.5 text-sm text-foreground focus:border-primary focus:outline-none">
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="triple">Triple</option>
                  </select>
                </div>
              </div>

              {/* ── Location / Coordinates ── */}
              <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Navigation className="h-4 w-4 text-primary" />
                      PG Coordinates *
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Required for distance calculation on Explore page
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoDetect}
                    disabled={geoLoading}
                    className="gap-1.5 shrink-0"
                  >
                    {geoLoading
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Detecting...</>
                      : <><MapPin className="h-3.5 w-3.5" /> Auto-detect</>
                    }
                  </Button>
                </div>

                {form.latitude && form.longitude ? (
                  <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 px-3 py-2">
                    <Navigation className="h-4 w-4 text-success shrink-0" />
                    <span className="text-xs text-success font-medium">
                      Location detected: {form.latitude}, {form.longitude}
                    </span>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, latitude: "", longitude: "" })}
                      className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Latitude (optional)</label>
                      <input
                        type="number"
                        step="any"
                        value={form.latitude}
                        onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                        placeholder="e.g. 27.6058"
                        className="w-full rounded-xl border border-border bg-secondary/50 p-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Longitude (optional)</label>
                      <input
                        type="number"
                        step="any"
                        value={form.longitude}
                        onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                        placeholder="e.g. 77.5945"
                        className="w-full rounded-xl border border-border bg-secondary/50 p-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                )}

                {/* ── Help finding coordinates ── */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowCoordHelp((v) => !v)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5" />
                      Need help finding latitude &amp; longitude?
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showCoordHelp ? "rotate-180" : ""}`} />
                  </button>

                  {showCoordHelp && (
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border bg-secondary/10">
                      <p className="text-xs font-medium text-foreground mt-2">3 easy ways to find coordinates:</p>

                      {/* Method 1 */}
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-primary">Method 1 — Auto-detect (Recommended)</p>
                        <ol className="text-xs text-muted-foreground space-y-1 list-none">
                          <li className="flex items-start gap-2"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[10px]">1</span>Fill in Location and City fields above</li>
                          <li className="flex items-start gap-2"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[10px]">2</span>Click the "Auto-detect" button</li>
                          <li className="flex items-start gap-2"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[10px]">3</span>Coordinates are filled automatically!</li>
                        </ol>
                      </div>

                      <div className="h-px bg-border" />

                      {/* Method 2 */}
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-foreground">Method 2 — Google Maps (Desktop)</p>
                        <ol className="text-xs text-muted-foreground space-y-1 list-none">
                          <li className="flex items-start gap-2"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground font-bold text-[10px]">1</span>Open <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">maps.google.com</a></li>
                          <li className="flex items-start gap-2"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground font-bold text-[10px]">2</span>Search your PG's address</li>
                          <li className="flex items-start gap-2"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground font-bold text-[10px]">3</span>Right-click on the exact location on the map</li>
                          <li className="flex items-start gap-2"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground font-bold text-[10px]">4</span>Click the coordinates shown at the top (e.g. 27.6058, 77.5945)</li>
                          <li className="flex items-start gap-2"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground font-bold text-[10px]">5</span>First number = Latitude · Second number = Longitude</li>
                        </ol>
                      </div>

                      <div className="h-px bg-border" />

                      {/* Method 3 */}
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-foreground">Method 3 — Google Maps App (Mobile)</p>
                        <ol className="text-xs text-muted-foreground space-y-1 list-none">
                          <li className="flex items-start gap-2"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground font-bold text-[10px]">1</span>Open Google Maps on your phone</li>
                          <li className="flex items-start gap-2"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground font-bold text-[10px]">2</span>Long press on your PG's location on the map</li>
                          <li className="flex items-start gap-2"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground font-bold text-[10px]">3</span>Coordinates appear at the top of the screen</li>
                          <li className="flex items-start gap-2"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground font-bold text-[10px]">4</span>Tap them to copy, then paste here</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Amenities</label>
                <div className="grid grid-cols-3 gap-2">
                  {amenities.map((a) => (
                    <label key={a.key} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm hover:bg-secondary/30 cursor-pointer transition-colors">
                      <input type="checkbox" className="accent-primary"
                        checked={(form as any)[a.key]}
                        onChange={(e) => setForm({ ...form, [a.key]: e.target.checked })} />
                      {a.label}
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save Details & Continue"}
              </Button>
            </form>
          )}
          {step === "images" && createdPgId && (
            <ImageUploadStep
              pgId={createdPgId}
              onComplete={() => {
                toast.success("PG submitted for approval!");
                navigate("/owner/listings");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Owner Analytics ──────────────────────────────────────────────────────────
const OwnerAnalytics = () => {
  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    pgAPI.getOwnerListings().then((data) => setListings(data.pgs || [])).catch(console.error);
  }, []);

  const avgScores = listings.length > 0 ? {
    hygiene: Math.round(listings.reduce((s, p) => s + (p.hygiene_score || 0), 0) / listings.length),
    food: Math.round(listings.reduce((s, p) => s + (p.food_score || 0), 0) / listings.length),
    safety: Math.round(listings.reduce((s, p) => s + (p.safety_score || 0), 0) / listings.length),
    amenities: Math.round(listings.reduce((s, p) => s + (p.amenities_score || 0), 0) / listings.length),
    pricing: Math.round(listings.reduce((s, p) => s + (p.pricing_score || 0), 0) / listings.length),
  } : { hygiene: 0, food: 0, safety: 0, amenities: 0, pricing: 0 };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Hygiene Score" value={`${avgScores.hygiene}%`} icon={BarChart3} subtitle="Average across listings" />
        <StatCard title="Safety Score" value={`${avgScores.safety}%`} icon={Building} subtitle="Average across listings" />
        <StatCard title="Food Score" value={`${avgScores.food}%`} icon={MessageSquare} subtitle="Average across listings" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Rating Breakdown</h2>
        <div className="space-y-3">
          {[
            { label: "Hygiene", value: avgScores.hygiene },
            { label: "Food Quality", value: avgScores.food },
            { label: "Safety", value: avgScores.safety },
            { label: "Amenities", value: avgScores.amenities },
            { label: "Pricing Fairness", value: avgScores.pricing },
          ].map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-foreground">{item.label}</span>
                <span className="font-semibold text-foreground">{item.value}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 0.8 }}
                  className="h-full rounded-full bg-success" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Owner Reviews ────────────────────────────────────────────────────────────
const OwnerReviews = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [replies, setReplies] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pgAPI.getOwnerListings().then(async (data) => {
      const pgs = data.pgs || [];
      setListings(pgs);
      if (pgs.length > 0) {
        const allReviews: any[] = [];
        for (const pg of pgs) {
          const r = await reviewAPI.getByPG(pg.id);
          allReviews.push(...(r.reviews || []).map((rev: any) => ({ ...rev, pg_name: pg.name })));
        }
        setReviews(allReviews);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleReply = async (reviewId: number) => {
    const reply = replies[reviewId];
    if (!reply?.trim()) { toast.error("Please enter a reply"); return; }
    try {
      await reviewAPI.reply(reviewId, reply);
      toast.success("Reply posted!");
      setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, owner_reply: reply } : r));
    } catch (err: any) {
      toast.error(err.message || "Failed to post reply");
    }
  };

  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-secondary/50" />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Resident Reviews</h2>
      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-muted-foreground">No reviews yet.</p>
        </div>
      ) : reviews.map((r) => (
        <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{r.reviewer_name}</span>
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">Verified</span>
              <span className="text-xs text-muted-foreground">• {r.pg_name}</span>
            </div>
            <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
          </div>
          <div className="mt-1 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, j) => (
              <Star key={j} className={`h-4 w-4 ${j < (r.overall_rating || 0) ? "fill-primary text-primary" : "text-border"}`} />
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{r.review_text || "No text provided"}</p>
          {r.owner_reply ? (
            <div className="mt-3 ml-4 rounded-lg border-l-2 border-primary bg-primary/5 p-3">
              <span className="text-xs font-medium text-primary">Your Reply</span>
              <p className="mt-1 text-sm text-muted-foreground">{r.owner_reply}</p>
            </div>
          ) : (
            <div className="mt-3">
              <textarea
                placeholder="Write a reply..."
                rows={2}
                value={replies[r.id] || ""}
                onChange={(e) => setReplies({ ...replies, [r.id]: e.target.value })}
                className="w-full rounded-xl border border-border bg-secondary/50 p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
              <Button size="sm" className="mt-2" onClick={() => handleReply(r.id)}>Reply</Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Owner Profile ────────────────────────────────────────────────────────────
const OwnerProfile = () => {
  const { user } = useAuth();
  return (
    <div className="max-w-lg">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {user?.name?.[0]?.toUpperCase() || "O"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{user?.name}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">PG Owner</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const OwnerDashboard = () => (
  <DashboardLayout items={sidebarItems} title="Owner Dashboard">
    <Routes>
      <Route index element={<OwnerHome />} />
      <Route path="listings" element={<MyListings />} />
      <Route path="add" element={<AddPG />} />
      <Route path="analytics" element={<OwnerAnalytics />} />
      <Route path="reviews" element={<OwnerReviews />} />
      <Route path="profile" element={<OwnerProfile />} />
      <Route path="*" element={<Navigate to="/owner" replace />} />
    </Routes>
  </DashboardLayout>
);

export default OwnerDashboard;