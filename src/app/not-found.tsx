import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-brand-onyx flex flex-col items-center justify-center text-white px-4">
            <h1 className="text-6xl font-bold text-brand-orange mb-4">404</h1>
            <p className="text-xl text-gray-300 mb-8">Page not found</p>
            <Link
                href="/"
                className="px-6 py-3 bg-brand-orange text-white rounded-lg font-semibold hover:bg-brand-dark-orange transition-colors"
            >
                Back to Tracker
            </Link>
        </div>
    );
}
