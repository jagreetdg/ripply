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

				{/* Add a script to remove fixed position elements */}
				<script
					dangerouslySetInnerHTML={{ __html: removeFixedElementsScript }}
				/>
				{/* Add any additional <head> elements that you want globally available on web... */}
			</head>
			<body>{children}</body>
		</html>
	);
}

const removeFixedElementsScript = `
(function() {
  // Identify common selectors for back-to-top buttons based on the commit history
  const SELECTORS = [
    'div[style*="position: fixed"][style*="bottom"][style*="right"]',
    'div[role="button"][style*="position: fixed"]',
    'div:not([class]):not([id])[style*="position: fixed"]',
    'svg[style*="transform: rotate"]',
    'div.expo-back-to-top',
    'div.expo-scroll-button',
    'div[data-testid="back-to-top"]',
    'div[data-testid="scroll-to-top"]',
    // Especially target elements with no class or id (often added by frameworks)
    'body > div:not([class]):not([id])',
    'div > div:not([class]):not([id]) > svg'
  ];

  function removeFixedButtons() {
    // Most direct and aggressive approach - find any fixed position element in the bottom-right corner
    document.querySelectorAll('*').forEach(el => {
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'HEAD') {
        return; // Skip script and style tags
      }
      
      const style = window.getComputedStyle(el);
      
      // If it's a fixed position element at the bottom-right
      if (style.position === 'fixed' && 
          style.bottom && parseInt(style.bottom) < 100 &&
          style.right && parseInt(style.right) < 100) {
        
        console.log('Removing fixed position element:', el);
        
        // Try the most aggressive approach - completely remove it
        try {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        } catch (e) {
          // If removing fails, hide it completely
          el.style.display = 'none';
          el.style.visibility = 'hidden';
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          el.style.width = '0';
          el.style.height = '0';
        }
      }
    });
    
    // Also check our specific selectors
    SELECTORS.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          console.log('Removing element matching selector:', selector);
          
          // First try to completely remove the element
          if (el.parentNode) {
            try {
              el.parentNode.removeChild(el);
              return;
            } catch (e) {
              console.log('Could not remove element, hiding instead');
            }
          }
          
          // If removal fails, make it invisible and non-interactive
          el.style.display = 'none';
          el.style.visibility = 'hidden';
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          el.style.position = 'absolute';
          el.style.left = '-9999px';
          el.style.top = '-9999px';
          el.style.width = '0';
          el.style.height = '0';
          el.style.zIndex = '-9999';
        });
      } catch (e) {
        console.log('Error processing selector:', selector, e);
      }
    });
    
    // Special case: Target any SVG with arrow-like content
    document.querySelectorAll('svg').forEach(svg => {
      const svgContent = svg.innerHTML.toLowerCase();
      if (svgContent.includes('arrow') || 
          svgContent.includes('chevron') || 
          svgContent.includes('up') ||
          svgContent.includes('top')) {
        
        const parent = svg.parentElement;
        const grandparent = parent ? parent.parentElement : null;
        
        // Check if this SVG or parents are fixed position
        const parentStyle = parent ? window.getComputedStyle(parent) : null;
        const grandparentStyle = grandparent ? window.getComputedStyle(grandparent) : null;
        
        if ((parentStyle && parentStyle.position === 'fixed') || 
            (grandparentStyle && grandparentStyle.position === 'fixed')) {
          
          console.log('Removing SVG with arrow content');
          
          // Remove the entire parent structure
          if (grandparent && grandparent.parentNode) {
            grandparent.parentNode.removeChild(grandparent);
          } else if (parent && parent.parentNode) {
            parent.parentNode.removeChild(parent);
          } else if (svg.parentNode) {
            svg.parentNode.removeChild(svg);
          }
        }
      }
    });
  }
  
  // Run on load and repeatedly to catch any dynamically added elements
  window.addEventListener('load', function() {
    // Run immediately on load
    removeFixedButtons();
    
    // Run several times with delays to catch dynamically added elements
    setTimeout(removeFixedButtons, 100);
    setTimeout(removeFixedButtons, 500);
    setTimeout(removeFixedButtons, 1000);
    setTimeout(removeFixedButtons, 2000);
    
    // Run periodically every second
    setInterval(removeFixedButtons, 1000);
  });
  
  // Also run immediately in case DOM is already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    removeFixedButtons();
  }
})();
`;

const responsiveBackground = `
body {
  background-color: ${Colors.light.background};
}

/* Remove the floating circular arrow button (likely from a framework/library) */
div[class*="floating"], 
div[style*="position: fixed"][style*="border-radius: 50%"],
div[style*="position:fixed"][style*="border-radius:50%"],
div[style*="position: fixed"][style*="width: 40px"],
div[style*="position:fixed"][style*="width:40px"],
div[style*="position: fixed"][style*="transform: rotate"],
div[style*="position:fixed"][style*="transform:rotate"],
div[role="button"][style*="position: fixed"],
div[role="button"][style*="position:fixed"],
div[data-testid*="scroll"],
div[data-testid*="back-to-top"],
div[id*="back-to-top"],
div[id*="scroll-to-top"],
button[id*="back-to-top"],
button[id*="scroll-to-top"],
button[aria-label*="back to top" i],
button[aria-label*="scroll to top" i],
button[aria-label*="go to top" i],
a[href="#top"],
/* Target ExpoWeb specific circular button (if it's from Expo Web) */
div[style*="position: fixed"][style*="bottom: 20px"][style*="right: 20px"],
div[style*="position:fixed"][style*="bottom:20px"][style*="right:20px"],
div:not([class]):not([id])[style*="position: fixed"][style*="bottom"],
div:not([class]):not([id])[style*="position:fixed"][style*="bottom"]
{
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  width: 0 !important;
  height: 0 !important;
  overflow: hidden !important;
  pointer-events: none !important;
  position: absolute !important;
  left: -9999px !important;
  z-index: -9999 !important;
  max-width: 0 !important;
  max-height: 0 !important;
}

/* Target the specific SVG inside the button */
svg[viewBox][style*="transform: rotate"],
svg[viewBox][style*="transform:rotate"],
svg[xmlns="http://www.w3.org/2000/svg"][style*="transform: rotate"],
svg[xmlns="http://www.w3.org/2000/svg"][style*="transform:rotate"] {
  display: none !important;
}

/* Also remove any styles that might be causing scrolling issues */
html, body {
  overflow-x: hidden !important;
  max-width: 100vw !important;
}

@media (prefers-color-scheme: dark) {
  body {
    background-color: ${Colors.dark.background};
  }
}`;
