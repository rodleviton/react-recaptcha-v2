"use client";

import { WindowWithReCaptcha } from "./types";

/**
 * Default URL for loading the Google reCAPTCHA script
 */
const RECAPTCHA_SCRIPT_URL = "https://www.google.com/recaptcha/api.js";

/**
 * Script loading states
 */
type ScriptLoadingState = "unloaded" | "loading" | "loaded" | "error";

/**
 * Global state to track reCAPTCHA script loading
 */
let scriptLoadingState: ScriptLoadingState = "unloaded";
let scriptLoadPromise: Promise<void> | null = null;
let callbacks: Array<() => void> = [];

/**
 * Generate a unique ID for reCAPTCHA container
 * @returns A unique string ID
 */
export const generateUniqueId = (): string => {
  return `recaptcha-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Check if the reCAPTCHA script is already loaded
 * @returns True if the script is loaded and grecaptcha is available
 */
export const isReCaptchaAvailable = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!(window as WindowWithReCaptcha).grecaptcha;
};

/**
 * Attach a single global `unhandledrejection` handler to swallow
 * reCAPTCHA-specific promise rejections (e.g. sporadic \"Timeout\"
 * errors coming from Google's `recaptcha__*.js`).  These errors are
 * noise for most apps and cannot be handled at the library level, so
 * we prevent them from surfacing in the console.
 */
let globalRejectionHandlerAttached = false;
const attachUnhandledRejectionHandler = () => {
  if (typeof window === "undefined" || globalRejectionHandlerAttached) return;

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;

    // Convert reason to string for inspection
    const message =
      typeof reason === "string"
        ? reason
        : reason instanceof Error
        ? reason.message || ""
        : "";

    // Also look at the stack trace if it's available
    const stack =
      reason instanceof Error && typeof reason.stack === "string"
        ? reason.stack
        : "";

    const haystacks = `${message}\n${stack}`.toLowerCase();

    // Silently consume errors that look like they're coming from
    // Google's reCAPTCHA bundle.
    if (
      haystacks.includes("recaptcha") ||
      haystacks.includes("gstatic") ||
      haystacks.includes("google.com/recaptcha")
    ) {
      event.preventDefault();
    }
  });

  globalRejectionHandlerAttached = true;
};

/**
 * Load the reCAPTCHA script with the specified language
 * @param language Optional language code for reCAPTCHA localization
 * @returns A promise that resolves when the script is loaded
 */
export const loadReCaptchaScript = (language?: string): Promise<void> => {
  // Return early if we're in a server environment
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  // Ensure global handler is attached exactly once
  attachUnhandledRejectionHandler();

  // If the script is already loaded, resolve immediately
  if (isReCaptchaAvailable() && scriptLoadingState === "loaded") {
    return Promise.resolve();
  }

  // If the script is currently loading, return the existing promise
  if (scriptLoadPromise && scriptLoadingState === "loading") {
    return scriptLoadPromise;
  }

  // Create a new promise to load the script
  scriptLoadingState = "loading";
  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    try {
      // Create script element
      const script = document.createElement("script");
      script.async = true;
      script.defer = true;

      // Build the script URL with language parameter if provided
      let scriptUrl = RECAPTCHA_SCRIPT_URL;
      if (language) {
        scriptUrl += `?hl=${language}`;
      }

      script.src = scriptUrl;

      // Set up event handlers
      script.onload = () => {
        // Ensure grecaptcha exists; if not, reject immediately
        if (!(window as WindowWithReCaptcha).grecaptcha) {
          scriptLoadingState = "error";
          reject(
            new Error(
              "reCAPTCHA script loaded, but grecaptcha object is not available."
            )
          );
          return;
        }

        scriptLoadingState = "loaded";

        // Wait for grecaptcha to be fully initialized
        const checkGrecaptcha = () => {
          if ((window as WindowWithReCaptcha).grecaptcha) {
            (window as WindowWithReCaptcha).grecaptcha?.ready(() => {
              // Execute all callbacks
              callbacks.forEach((callback) => callback());
              callbacks = [];
              resolve();
            });
          } else {
            setTimeout(checkGrecaptcha, 100);
          }
        };

        checkGrecaptcha();
      };

      script.onerror = (error) => {
        scriptLoadingState = "error";
        reject(new Error("Failed to load reCAPTCHA script from Google."));
      };

      // Append the script to the document head
      document.head.appendChild(script);
    } catch (error) {
      scriptLoadingState = "error";
      reject(error);
    }
  });

  return scriptLoadPromise;
};

/**
 * Register a callback to be executed when reCAPTCHA is loaded
 * @param callback Function to execute when reCAPTCHA is ready
 */
export const onReCaptchaLoad = (callback: () => void): void => {
  if (typeof window === "undefined") return;

  if (isReCaptchaAvailable() && scriptLoadingState === "loaded") {
    // If already loaded, execute immediately
    callback();
  } else {
    // Otherwise, add to the queue
    callbacks.push(callback);
  }
};

/**
 * Get the current script loading state
 * @returns The current loading state of the reCAPTCHA script
 */
export const getScriptLoadingState = (): ScriptLoadingState => {
  return scriptLoadingState;
};

/**
 * Safely access the grecaptcha object
 * @returns The grecaptcha object or null if not available
 */
export const getGrecaptcha = () => {
  if (typeof window === "undefined") return null;
  return (window as WindowWithReCaptcha).grecaptcha || null;
};
