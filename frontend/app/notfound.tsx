import React from "react";
import { Redirect } from "expo-router";

/**
 * Redirector from old notfound location to new location
 */
export default function NotFoundRedirector() {
	return <Redirect href="/(with-tabs)/notfound" />;
}
