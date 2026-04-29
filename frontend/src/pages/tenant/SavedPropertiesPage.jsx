import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import PropertyCard from "../../components/ui/PropertyCard";

export default function SavedPropertiesPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("saved_properties").select("property_id, properties(*)").eq("tenant_id", user.id)
      .then(({ data }) => { setSaved(data?.map(s => s.properties) || []); setLoading(false); });
  }, []);

  async function unsave(propertyId) {
    await supabase.from("saved_properties").delete().match({ tenant_id: user.id, property_id: propertyId });
    setSaved(s => s.filter(p => p.id !== propertyId));
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">Saved Properties</h1>
      {loading ? <div className="skeleton h-48 rounded-2xl" /> : saved.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">
          <div className="text-5xl mb-4">❤️</div>
          <p>No saved properties yet. Browse listings and tap the heart!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {saved.map(p => (
            <PropertyCard key={p.id} property={p} saved onSaveToggle={(id) => unsave(id)} />
          ))}
        </div>
      )}
    </div>
  );
}