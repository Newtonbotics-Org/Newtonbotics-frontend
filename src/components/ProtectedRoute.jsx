"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null, requiredPermission = null }) => {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
      return;
    }

    // Check role requirement
    if (requiredRole && user && !hasRole(requiredRole)) {
      router.push('/DashBoard');
      return;
    }

    // Check permission requirement
    if (requiredPermission && user && !hasPermission(requiredPermission)) {
      router.push('/DashBoard');
      return;
    }
  }, [isAuthenticated, isLoading, user, requiredRole, requiredPermission, hasRole, hasPermission, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="nb-dark flex min-h-[60vh] items-center justify-center bg-paper text-ink" role="status">
        <div className="flex flex-col items-center gap-4">
          <span
            className="h-10 w-10 animate-spin rounded-full border-2 border-line-strong border-t-signal"
            aria-hidden="true"
          />
          <p className="m-0 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">Loading…</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    return null;
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
