import PGCard from "./PGCard";
import { pgData } from "../../data/pgData";

export default function Discover() {

    const pgData = [
    {
        id: 1,
        name: "Sunrise Women's PG",
        location: "Sector 62, Noida",
        price: 6500,
        priceTag: "Fair",
    },
    {
        id: 2,
        name: "Green Leaf Hostel",
        location: "Lal Kuan, Ghaziabad",
        price: 8200,
        priceTag: "Overpriced",
    },
    {
        id: 3,
        name: "Urban Nest PG",
        location: "Vijay Nagar, Meerut",
        price: 5800,
        priceTag: "Great Deal",
    },
    ];

  return (
    <section id="discover" className="py-24 px-6 max-w-7xl mx-auto">

      <div className="mb-12">
        <h2 className="font-heading text-4xl font-extrabold mb-4">
          Verified PGs,<br/>
          <span className="text-tealbrand-400">Real Reviews</span>
        </h2>
        <p className="text-tealbrand-300 max-w-xl">
          Every listing is scored across multiple dimensions using AI analysis of photos, reviews, and owner claims.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {pgData.map((pg, index) => (
          <PGCard key={index} pg={pg} />
        ))}
      </div>

    </section>
  );
}