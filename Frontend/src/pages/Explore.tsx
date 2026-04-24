// src/pages/Explore.tsx
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, SlidersHorizontal, MapPin, Navigation, Loader2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScoreBadge from "@/components/ScoreBadge";
import { pgAPI } from "@/lib/api";
import { useDistance } from "@/lib/useDistance";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PRESET_COLLEGES = [
  "BBAU Lucknow",
  "Lucknow University",
  "IIM Lucknow",
  "GLA University Chaumuhan Mathura",
  "Shivaji University Kolhapur",
  "Pune University",
  "Symbiosis Pune",
  "Fergusson College Pune",
];

const Explore = () => {
  const [searchParams] = useSearchParams();
  const [pgs, setPGs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [budget, setBudget] = useState([3000, 20000]);
  const [roomType, setRoomType] = useState("all");
  const [sort, setSort] = useState("best_rated");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [acRequired, setAcRequired] = useState(false);
  const [foodIncluded, setFoodIncluded] = useState(false);
  const [search, setSearch] = useState(searchParams.get("search") || "");

  // Distance
  const { distances, loading: distLoading, error: distError, calculateDistances, clearDistances } = useDistance();
  const [collegeInput, setCollegeInput] = useState("");
  const [collegeQuery, setCollegeQuery] = useState("");

  const fetchPGs = useCallback(async () => {
    setLoading(true);
    try {
      const filters: Record<string, string> = {
        min_rent: String(budget[0]),
        max_rent: String(budget[1]),
        sort,
        limit: "20",
      };
      if (roomType !== "all") filters.room_type = roomType;
      if (acRequired) filters.has_ac = "true";
      if (foodIncluded) filters.has_meals = "true";
      if (search) filters.search = search;

      const data = await pgAPI.getAll(filters);
      setPGs(data.pgs || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [budget, roomType, sort, acRequired, foodIncluded, search]);

  useEffect(() => {
    fetchPGs();
  }, [fetchPGs]);

  // Re-calculate distances whenever PGs list changes and a college is already set
  useEffect(() => {
    if (collegeQuery && pgs.length > 0) {
      calculateDistances(collegeQuery, pgs);
    }
  }, [pgs]);

  const resetFilters = useCallback(() => {
    setBudget([3000, 20000]);
    setRoomType("all");
    setVerifiedOnly(false);
    setAcRequired(false);
    setFoodIncluded(false);
    setSearch("");
  }, []);

  const getPriceLabel = (pg: any) => {
    if (pg.price_label === "underpriced") return { text: "Underpriced", cls: "bg-success text-white" };
    if (pg.price_label === "overpriced") return { text: "Overpriced", cls: "bg-warning text-white" };
    return { text: "Fair Price", cls: "bg-primary text-white" };
  };

  const handleDistanceSearch = async () => {
    if (!collegeInput.trim()) return;
    setCollegeQuery(collegeInput.trim());
    await calculateDistances(collegeInput.trim(), pgs);
  };

  const handlePreset = async (college: string) => {
    setCollegeInput(college);
    setCollegeQuery(college);
    await calculateDistances(college, pgs);
  };

  const handleClearDistance = () => {
    clearDistances();
    setCollegeInput("");
    setCollegeQuery("");
  };

  const filterContent = (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Filters</h3>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Budget Range</label>
        <div className="flex items-center justify-between text-xs font-semibold text-primary">
          <span>₹{budget[0].toLocaleString()}</span>
          <span>₹{budget[1].toLocaleString()}</span>
        </div>
        <Slider min={3000} max={20000} step={500} value={budget} onValueChange={setBudget} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>₹3,000</span><span>₹20,000</span>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Room Type</label>
        <Select value={roomType} onValueChange={setRoomType}>
          <SelectTrigger className="border-border bg-secondary/50 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="single">Single</SelectItem>
            <SelectItem value="double">Double</SelectItem>
            <SelectItem value="triple">Triple</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm text-foreground">AC Required</label>
          <Switch checked={acRequired} onCheckedChange={setAcRequired} />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-foreground">Food Included</label>
          <Switch checked={foodIncluded} onCheckedChange={setFoodIncluded} />
        </div>
      </div>

      <Button variant="outline" onClick={resetFilters} className="w-full">
        Reset Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">Find Your Perfect PG</h1>
          <button onClick={() => setShowFilters(true)}
            className="lg:hidden flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-primary/30 transition-colors">
            <Filter className="h-4 w-4 text-primary" /> Filters
          </button>
        </motion.div>

        {/* Search bar */}
        <div className="mt-4">
          <input
            placeholder="Search by PG name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* ── Distance from college ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Navigation className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Distance from college / workplace</span>
            {collegeQuery && (
              <button
                onClick={handleClearDistance}
                className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>

          {/* Preset quick-select buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_COLLEGES.map((c) => (
              <button
                key={c}
                onClick={() => handlePreset(c)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  collegeQuery === c
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Custom address input */}
          <div className="flex gap-2">
            <input
              placeholder="Enter your college or workplace address..."
              value={collegeInput}
              onChange={(e) => setCollegeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDistanceSearch()}
              className="flex-1 rounded-xl border border-border bg-secondary/50 py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button
              onClick={handleDistanceSearch}
              disabled={distLoading || !collegeInput.trim()}
              size="sm"
            >
              {distLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>

          {distError && (
            <p className="mt-2 text-xs text-destructive">{distError}</p>
          )}
          {collegeQuery && !distLoading && !distError && (
            <p className="mt-2 text-xs text-muted-foreground">
              Showing road distances from{" "}
              <span className="font-medium text-foreground">{collegeQuery}</span>
            </p>
          )}
        </motion.div>

        <div className="mt-6 flex gap-8">
          {/* Desktop filters */}
          <aside className="hidden lg:block w-72 shrink-0">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-sm">
              {filterContent}
            </motion.div>
          </aside>

          {/* Mobile filter drawer */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
                onClick={() => setShowFilters(false)}>
                <motion.div initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-full w-80 max-w-[85vw] overflow-y-auto bg-card p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-bold text-foreground">Filters</h3>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)} className="rounded-xl">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  {filterContent}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center justify-between mb-5">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{total}</span> PGs found
              </p>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-48 border-border bg-card rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best_rated">Best Rated</SelectItem>
                  <SelectItem value="price_low">Price Low to High</SelectItem>
                  <SelectItem value="price_high">Price High to Low</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="most_reviewed">Most Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 animate-pulse rounded-2xl bg-secondary/50" />
                ))}
              </div>
            ) : pgs.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="py-20 text-center">
                <Filter className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 text-lg font-medium text-muted-foreground">No PGs found</p>
                <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters.</p>
                <Button variant="outline" size="sm" onClick={resetFilters} className="mt-4">Reset Filters</Button>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {pgs.map((pg, i) => {
                  const priceLabel = getPriceLabel(pg);
                  const distInfo = distances[pg.id];
                  return (
                    <motion.div key={pg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-4 rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-all">
                      {/* Image */}
                      <div className="relative h-36 w-48 shrink-0 overflow-hidden rounded-xl">
                        {pg.primary_image ? (
                          <img src={pg.primary_image} alt={pg.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-secondary/50 flex items-center justify-center text-xs text-muted-foreground">No Image</div>
                        )}
                        <span className={`absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-xs font-semibold ${priceLabel.cls}`}>
                          {priceLabel.text}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-foreground">{pg.name}</h3>
                            {pg.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" /> {pg.location}
                          </p>

                          {/* ── Distance badge ── */}
                          {distInfo && distInfo.distance_km !== null ? (
                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-primary">
                              <Navigation className="h-3 w-3" />
                              {distInfo.distance_km} km by road · ~{distInfo.duration_min} min
                            </p>
                          ) : distLoading && collegeQuery && !distInfo ? (
                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" /> Calculating distance...
                            </p>
                          ) : null}

                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {pg.hygiene_score > 0 && <span>Hygiene: {pg.hygiene_score}/100</span>}
                            <span className="capitalize">{pg.room_type}</span>
                            {pg.has_ac && <span>AC</span>}
                            {pg.has_meals && <span>Meals</span>}
                            {pg.has_wifi && <span>WiFi</span>}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div>
                            <span className="text-xl font-extrabold text-foreground">₹{pg.monthly_rent?.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground"> /month</span>
                          </div>
                          <Link to={`/pg/${pg.id}`}>
                            <Button size="sm">View Details</Button>
                          </Link>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="hidden sm:flex flex-col items-center justify-center">
                        <ScoreBadge score={pg.overall_score || 0} size="sm" />
                        <span className="mt-1 text-xs text-muted-foreground">Overall</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Explore;