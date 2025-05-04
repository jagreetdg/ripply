import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useUser } from '../../context/UserContext';

type RequireAuthProps = {
  children: React.ReactNode;
};

/**
 * A component that protects routes by requiring authentication.
 * If the user is not authenticated, they will be redirected to the landing page.
 */
export default function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/login', '/auth/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    // If not loading and user is not authenticated and not on a public route
    if (!loading && !user && !isPublicRoute) {
      console.log('User not authenticated, redirecting to landing page');
      router.replace('/');
    }
  }, [user, loading, router, pathname, isPublicRoute]);

  // If on a protected route and still loading, show loading indicator
  if (loading && !isPublicRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8A4FD6" />
      </View>
    );
  }

  // If on a public route or authenticated, render children
  return <>{children}</>;
}
