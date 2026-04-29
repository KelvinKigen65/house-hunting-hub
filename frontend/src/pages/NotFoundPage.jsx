import { Link } from "react-router-dom";
export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-center px-4">
      <div>
        <div className="text-8xl mb-4">🏚️</div>
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-6">This page doesn't exist. Let's get you back home.</p>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </div>
    </div>
  );
}