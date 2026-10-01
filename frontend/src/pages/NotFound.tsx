import { Link } from 'react-router-dom';
import { useMeta } from '../hooks/useMeta';

export default function NotFound() {
  useMeta('Page not found');
  return (
    <div className="container-x py-24 text-center">
      <p className="font-display text-7xl font-extrabold text-ocean/20">404</p>
      <h1 className="mt-4 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-muted">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-8">Back to home</Link>
    </div>
  );
}
