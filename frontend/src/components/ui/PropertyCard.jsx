import { Link } from "react-router-dom";
import { getStorageUrl } from "../../lib/supabase";

const PLACEHOLDER = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80";

const TYPE_LABELS = {
  apartment: "Apartment",
  house: "House",
  bedsitter: "Bedsitter",
  single_room: "Single Room",
  studio: "Studio",
};

export default function PropertyCard({ property, saved, onSaveToggle }) {
  const imageUrl = property.images?.[0]
    ? getStorageUrl(property.images[0])
    : PLACEHOLDER;

  const price = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(property.price);

  return (
    <div className="card group hover:shadow-hover transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = PLACEHOLDER; }}
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {property.status === "verified" && (
            <span className="badge-verified">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Verified
            </span>
          )}
          {property.status === "pending" && (
            <span className="badge-pending">Pending</span>
          )}
        </div>
        {/* Save button */}
        {onSaveToggle && (
          <button
            onClick={(e) => { e.preventDefault(); onSaveToggle(property.id, saved); }}
            className="absolute top-3 right-3 w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-sm hover:bg-opacity-100 transition-all"
          >
            <svg
              className={`w-4 h-4 ${saved ? "text-red-500 fill-current" : "text-gray-400"}`}
              fill={saved ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}
        {/* Type badge */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-black bg-opacity-60 text-white text-xs font-medium px-2 py-1 rounded-lg">
            {TYPE_LABELS[property.property_type] || property.property_type}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-semibold text-gray-900 text-base leading-snug line-clamp-1 flex-1">
            {property.title}
          </h3>
          <span className="text-brand-600 font-bold text-sm whitespace-nowrap">{price}<span className="text-gray-400 font-normal">/mo</span></span>
        </div>

        <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="truncate">{property.location}</span>
        </p>

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            {property.bedrooms} bed
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
            {property.bathrooms} bath
          </span>
          {property.area && (
            <>
              <span>·</span>
              <span>{property.area}</span>
            </>
          )}
        </div>

        <Link
          to={`/listings/${property.id}`}
          className="btn-primary w-full text-center text-sm block"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}