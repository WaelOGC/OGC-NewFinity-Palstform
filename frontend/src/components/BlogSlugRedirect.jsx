/**
 * Blog Slug Redirect Component
 * 
 * Handles legacy /blog/:slug routes by redirecting to /internal/blog/:slug
 * with the required internal route key query parameter.
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const BlogSlugRedirect = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Get the internal route key from environment or use default
    const INTERNAL_KEY = import.meta.env.VITE_INTERNAL_ROUTE_KEY || 'DEV1234';

    if (slug) {
      // Redirect to internal blog with slug and key query parameter
      navigate(`/internal/blog/${slug}?key=${encodeURIComponent(INTERNAL_KEY)}`, { replace: true });
    } else {
      // No slug provided, redirect to internal blog index
      navigate(`/internal/blog?key=${encodeURIComponent(INTERNAL_KEY)}`, { replace: true });
    }
  }, [slug, navigate]);

  // Return null while redirecting
  return null;
};

export default BlogSlugRedirect;

