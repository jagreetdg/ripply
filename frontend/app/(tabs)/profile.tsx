import React from "react";
import { Redirect } from "expo-router";

export default function ProfileTab() {
  // Redirect to the main profile page
  return <Redirect href="/profile" />;
}
