// src/components/PGCard.tsx
import { Link } from "react-router-dom";
import { MapPin, Star, CheckCircle, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ScoreBadge from "./ScoreBadge";
import type { PGListing } from "@/lib/pgData";

interface PGCardProps {
  pg: PGListing;
  index?: number;
  distanceKm?: number | null;
  durationMin?: number | null;
}

const PGCard = ({ pg, index = 0, distanceKm, durationMin }: PGCardProps) => {
  const priceColor = pg.priceStatus === "Underpriced"
    ? "text-success"
    : pg.priceStatus === "Overpriced"
    ? "text-destructive"
    : "text-success";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="flex flex-col md:flex-row gap-4 rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative h-48 w-full md:h-auto md:w-56 shrink-0 overflow-hidden rounded-lg">
        <img src={pg.images[0]} alt={pg.name} className="h-full w-full object-cover" />
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-foreground">{pg.name}</h3>
            {pg.verified && (
              <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                <CheckCircle className="h-3 w-3" /> Verified
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {pg.location} • {pg.distance} km away
          </div>

          {/* ── Road distance from college/workplace ── */}
          {distanceKm !== undefined && distanceKm !== null && (
            <div className="mt-1 flex items-center gap-1 text-xs font-medium text-primary">
              <Navigation className="h-3 w-3" />
              {distanceKm} km by road · ~{durationMin} min
            </div>
          )}

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-3.5 w-3.5 text-primary" /> Hygiene: {pg.hygiene}/100
            </span>
            <span className="rounded-md border border-border px-2 py-0.5 text-xs text-foreground">{pg.roomType}</span>
            {pg.hasAC && <span className="rounded-md border border-border px-2 py-0.5 text-xs text-foreground">AC</span>}
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <span className="text-2xl font-bold text-foreground">₹{pg.price.toLocaleString()}</span>
            <p className="text-sm text-muted-foreground">
              per month <span className={`font-medium ${priceColor}`}>⊘ {pg.priceStatus}</span>
            </p>
          </div>
          <Link to={`/pg/${pg.id}`}>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              View Details
            </Button>
          </Link>
        </div>
      </div>

      <div className="hidden md:flex flex-col items-center justify-start pt-2">
        <ScoreBadge score={pg.overallScore} />
        <span className="mt-1 text-xs text-muted-foreground">Overall Score</span>
      </div>
    </motion.div>
  );
};

export default PGCard;