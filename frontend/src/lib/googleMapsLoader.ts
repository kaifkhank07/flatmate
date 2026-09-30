"use client";

declare global {
  interface Window {
    google?: any;
  }
}

let googleMapsPromise: Promise<any> | null = null;

/**
 * Singleton Google Maps JavaScript API script loader for Next.js frontend
 */
export function loadGoogleMapsScript(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps script can only be loaded in browser environment"));
  }

  // Already loaded in window
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google);
  }

  // Promise currently loading
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if script element already exists
    const existingScript = document.getElementById("google-maps-js-sdk");
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.google && window.google.maps) {
          resolve(window.google);
        } else {
          reject(new Error("Google Maps SDK load error"));
        }
      });
      existingScript.addEventListener("error", () => {
        reject(new Error("Failed to load Google Maps SDK script"));
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-js-sdk";
    script.type = "text/javascript";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve(window.google);
      } else {
        reject(new Error("Google Maps object not available after script load"));
      }
    };

    script.onerror = () => {
      googleMapsPromise = null;
      reject(new Error("Unable to load Google Maps script. Check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY."));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}
