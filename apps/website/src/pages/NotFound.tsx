import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-blue-100 p-4">
            <FileQuestion className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page not found</h2>

        <p className="text-gray-600 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>

        <Link to="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    </div>
  );
}
