import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';

/**
 * Catch-all route handler for unmatched routes
 * Redirects to the centralized notfound page
 */
export default function UnmatchedRouteCatcher() {
  // Simply redirect to our centralized notfound page
  return <Redirect href="/notfound" />;
}


