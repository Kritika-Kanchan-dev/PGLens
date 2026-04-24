// src/pages/PGDetail.tsx
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, CheckCircle, Heart, Share2, Star, MessageSquare, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScoreBadge from "@/components/ScoreBadge";
import ScoreBar from "@/components/ScoreBar";
import { pgAPI, reviewAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PGDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pg, setPG] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [scorecard, setScorecard] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pgData, scorecardData] = await Promise.all([
          pgAPI.getById(id!),
          reviewAPI.getScorecard(parseInt(id!)).catch(() => null),
        ]);
        setPG(pgData.pg);
        setImages(pgData.images || []);
        setClaims(pgData.claims || []);
        setReviews(pgData.reviews || []);
        if (scorecardData) setScorecard(scorecardData.scorecard);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const handleSave = async () => {
    if (!user) { toast.error("Please login to save PGs"); return; }
    try {
      const data = await pgAPI.toggleSave(parseInt(id!));
      setIsSaved(data.saved);
      toast.success(data.saved ? "PG saved!" : "PG removed from saved list");
    } catch (err: any) {
      toast.error(err.message || "Failed to save PG");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="space-y-4">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-secondary/50" />
            <div className="h-96 animate-pulse rounded-2xl bg-secondary/50" />
          </div>
        </div>
      </div>
    );
  }

  if (!pg) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">PG not found</h1>
          <Button onClick={() => navigate("/explore")} className="mt-4">Back to Explore</Button>
        </div>
      </div>
    );
  }

  const priceDiff = pg.fair_price_estimate ? pg.monthly_rent - pg.fair_price_estimate : 0;
  const pricePct = pg.fair_price_estimate ? Math.abs(Math.round((priceDiff / pg.fair_price_estimate) * 100)) : 0;
  const amenitiesList = [
    pg.has_wifi && "WiFi", pg.has_ac && "AC", pg.has_meals && "Meals",
    pg.has_laundry && "Laundry", pg.has_parking && "Parking",
    pg.has_security && "Security", pg.has_gym && "Gym",
    pg.has_hot_water && "Hot Water", pg.has_tv && "TV",
  ].filter(Boolean);

  // ── Helper: sentiment colour classes ─────────────────────────────────────
  const sentimentStyle = (sentiment: string) => {
    if (sentiment === "positive") return "bg-green-100 text-green-800 border border-green-200";
    if (sentiment === "negative") return "bg-red-100 text-red-800 border border-red-200";
    return "bg-gray-100 text-gray-600 border border-gray-200";
  };

  const sentimentEmoji = (sentiment: string) => {
    if (sentiment === "positive") return "😊";
    if (sentiment === "negative") return "😞";
    return "😐";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        {/* Back button */}
        <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </motion.button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-foreground">{pg.name}</h1>
              {pg.status === 'approved' && (
                <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-sm font-medium text-success">
                  <CheckCircle className="h-4 w-4" /> Verified
                </span>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {pg.location}
            </p>
          </div>
          <ScoreBadge score={scorecard?.overall_score || pg.overall_score || 0} size="lg" />
        </motion.div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left column */}
          <div className="space-y-6">
            {/* Image gallery */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <div className="overflow-hidden rounded-lg">
                {images.length > 0 ? (
                  <motion.img key={selectedImage} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    src={images[selectedImage]?.image_url} alt={pg.name}
                    className="h-72 w-full object-cover md:h-96" />
                ) : (
                  <div className="h-72 w-full bg-secondary/50 flex items-center justify-center text-muted-foreground md:h-96">
                    No images uploaded yet
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex gap-2">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImage(i)}
                      className={`h-16 w-20 overflow-hidden rounded-md border-2 transition-all ${
                        i === selectedImage ? "border-primary" : "border-border opacity-60 hover:opacity-100"
                      }`}>
                      <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Transparency Scorecard */}
            {scorecard && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-xl font-bold text-foreground">Transparency Scorecard</h2>
                <div className="mt-4 space-y-4">
                  <ScoreBar label="Hygiene" value={scorecard.hygiene_score} />
                  <ScoreBar label="Food Quality" value={scorecard.food_score} />
                  <ScoreBar label="Safety" value={scorecard.safety_score} />
                  <ScoreBar label="Amenities" value={scorecard.amenities_score} />
                  <ScoreBar label="Pricing Fairness" value={scorecard.pricing_score} />
                </div>
              </motion.div>
            )}

            {/* Claim vs Reality */}
            {claims.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-xl font-bold text-foreground">Claim vs Reality</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="pb-3 text-left font-medium">Owner Claim</th>
                        <th className="pb-3 text-left font-medium">Avg Rating</th>
                        <th className="pb-3 text-right font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claims.map((c) => (
                        <tr key={c.id} className="border-b border-border last:border-0">
                          <td className="py-3 text-foreground">{c.claim_text}</td>
                          <td className="py-3">
                            <span className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 text-primary" /> {c.avg_rating || "N/A"}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                              c.match_status === "match"
                                ? "border border-success/30 bg-success/10 text-success"
                                : c.match_status === "mismatch"
                                ? "border border-destructive/30 bg-destructive/10 text-destructive"
                                : "border border-border bg-secondary/30 text-muted-foreground"
                            }`}>
                              {c.match_status === "match" ? <CheckCircle className="h-3 w-3" /> : null}
                              {c.match_status === "match" ? "Match" : c.match_status === "mismatch" ? "Mismatch" : "Unverified"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Reviews */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Reviews ({reviews.length})</h2>
                {user?.role === "student" && (
                  <Button size="sm" className="gap-2" onClick={() => navigate("/dashboard/review")}>
                    <MessageSquare className="h-4 w-4" /> Write Review
                  </Button>
                )}
              </div>
              {reviews.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="mt-4 divide-y divide-border">
                  {reviews.map((r) => (
                    <div key={r.id} className="py-4 first:pt-0 last:pb-0">
                      {/* Reviewer name + date */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{r.reviewer_name}</span>
                          <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">Verified</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>

                      {/* Star rating */}
                      <div className="mt-1 flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className={`h-4 w-4 ${j < (r.overall_rating || 0) ? "fill-primary text-primary" : "text-border"}`} />
                        ))}
                      </div>

                      {/* Review text */}
                      {r.review_text && (
                        <p className="mt-2 text-sm text-muted-foreground">{r.review_text}</p>
                      )}

                      {/* ── NLP: Sentiment badge + topic pills ── */}
                      {r.nlp_analysed && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {/* Sentiment pill */}
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${sentimentStyle(r.sentiment)}`}>
                            <span>{sentimentEmoji(r.sentiment)}</span>
                            <span>{r.sentiment ? r.sentiment.charAt(0).toUpperCase() + r.sentiment.slice(1) : "Neutral"}</span>
                            <span className="opacity-60">· {r.sentiment_score}/100</span>
                          </span>

                          {/* Topic pills */}
                          {r.nlp_topics?.slice(0, 3).map((topic: string) => (
                            <span key={topic}
                              className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                              {topic.charAt(0).toUpperCase() + topic.slice(1)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* ── NLP: Keywords ── */}
                      {r.nlp_analysed && r.nlp_keywords?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {r.nlp_keywords.slice(0, 6).map((kw: string) => (
                            <span key={kw}
                              className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                              #{kw}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Rating breakdown */}
                      <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                        <span>Hygiene: {r.hygiene_rating}/5</span>
                        <span>Food: {r.food_rating}/5</span>
                        <span>Safety: {r.safety_rating}/5</span>
                        <span>Amenities: {r.amenities_rating}/5</span>
                      </div>

                      {/* Owner reply */}
                      {r.owner_reply && (
                        <div className="mt-3 ml-4 rounded-md border-l-2 border-primary pl-4">
                          <span className="text-xs font-medium text-primary">Owner Reply</span>
                          <p className="mt-1 text-sm text-muted-foreground">{r.owner_reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="sticky top-24 space-y-4">
              {/* Pricing card */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="text-3xl font-bold text-foreground">
                  ₹{pg.monthly_rent?.toLocaleString()} <span className="text-base font-normal text-muted-foreground">/month</span>
                </div>
                {priceDiff !== 0 && pg.fair_price_estimate && (
                  <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    priceDiff > 0 ? "border border-warning/30 bg-warning/10 text-warning" : "border border-success/30 bg-success/10 text-success"
                  }`}>
                    {priceDiff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {pricePct}% {priceDiff > 0 ? "above" : "below"} fair price
                  </span>
                )}
                {pg.fair_price_estimate && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Fair Price Estimate: ₹{pg.fair_price_estimate?.toLocaleString()}
                  </p>
                )}

                <Button className="mt-4 w-full" size="lg" onClick={() => toast.info(`Contact: ${pg.owner_email}`)}>
                  Contact Owner
                </Button>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button variant="outline" className={`gap-2 ${isSaved ? "text-destructive border-destructive/30" : ""}`} onClick={handleSave}>
                    <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} /> {isSaved ? "Saved" : "Save"}
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={handleShare}>
                    <Share2 className="h-4 w-4" /> Share
                  </Button>
                </div>
              </div>

              {/* Amenities */}
              {amenitiesList.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-6">
                  <h3 className="font-semibold text-foreground">Key Amenities</h3>
                  <div className="mt-3 space-y-2">
                    {amenitiesList.map((a) => (
                      <div key={String(a)} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-success" /> {a}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Room info */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="font-semibold text-foreground">Room Details</h3>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Room Type</span>
                    <span className="capitalize font-medium text-foreground">{pg.room_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Rooms</span>
                    <span className="font-medium text-foreground">{pg.total_rooms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Reviews</span>
                    <span className="font-medium text-foreground">{pg.total_reviews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Views</span>
                    <span className="font-medium text-foreground">{pg.total_views}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PGDetail;