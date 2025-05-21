import { ScrollViewStyleReset } from "expo-router/html";
import React from "react";
import Colors from "../constants/Colors"; // Assuming Colors.ts is in frontend/constants/

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta httpEquiv="X-UA-Compatible" content="IE=edge" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, shrink-to-fit=no"
				/>

				{/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
				<ScrollViewStyleReset />

				{/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
				<style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
				{/* Add any additional <head> elements that you want globally available on web... */}
			</head>
			<body>{children}</body>
		</html>
	);
}

const responsiveBackground = `
body {
  background-color: ${Colors.light.background};
}

/* Attempt to hide any default scroll-to-top buttons injected by frameworks on web */
div[role="button"][aria-label*="scroll" i],
div[role="button"][aria-label*="top" i],
button[aria-label*="scroll" i],
button[aria-label*="top" i],
div[class*="scroll-to-top" i],
div[class*="back-to-top" i],
div[style*="position"][style*="fixed"][style*="bottom"][style*="left"]:not([class]) > button, /* Unclassed fixed buttons */
div[style*="position"][style*="fixed"][style*="bottom"][style*="left"]:not([id]) > button,
div[style*="z-index"][style*="opacity"][style*="bottom"][style*="left"][style*="cursor: pointer"] /* Style combination often used */
{
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  width: 0 !important; /* Also try to collapse its size */
  height: 0 !important;
  overflow: hidden !important;
  pointer-events: none !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
}

@media (prefers-color-scheme: dark) {
  body {
    background-color: ${Colors.dark.background};
  }
}`;
