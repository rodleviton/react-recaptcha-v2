'use client';

import { WindowWithReCaptcha } from './types';

/**
 * Default URL for loading the Google reCAPTCHA script
 */
const RECAPTCHA_SCRIPT_URL = 'https://www.google.com/recaptcha/api.js';

/**
 * Script loading states
 */
type ScriptLoadingState = 'unloaded' | 'loading' | 'loaded' | 'error';

/**
 * Global state to track reCAPTCHA script loading
 */
let scriptLoadingState: ScriptLoadingState = 'unloaded';
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
  if (typeof window === 'undefined') return false;
  return !!(window as WindowWithReCaptcha).grecaptcha;
};

/**
 * Load the reCAPTCHA script with the specified language
 * @param language Optional language code for reCAPTCHA localization
 * @returns A promise that resolves when the script is loaded
 */
export const loadReCaptchaScript = (language?: string): Promise<void> => {
  // Return early if we're in a server environment
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  // If the script is already loaded, resolve immediately
  if (isReCaptchaAvailable() && scriptLoadingState === 'loaded') {
    return Promise.resolve();
  }

  // If the script is currently loading, return the existing promise
  if (scriptLoadPromise && scriptLoadingState === 'loading') {
    return scriptLoadPromise;
  }

  // Create a new promise to load the script
  scriptLoadingState = 'loading';
  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    try {
      // Create script element
      const script = document.createElement('script');
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
        scriptLoadingState = 'loaded';
        
        // Wait for grecaptcha to be fully initialized
        const checkGrecaptcha = () => {
          if ((window as WindowWithReCaptcha).grecaptcha) {
            (window as WindowWithReCaptcha).grecaptcha?.ready(() => {
              // Execute all callbacks
              callbacks.forEach(callback => callback());
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
        scriptLoadingState = 'error';
        reject(new Error(`Failed to load reCAPTCHA script: ${error}`));
      };
      
      // Append the script to the document head
      document.head.appendChild(script);
    } catch (error) {
      scriptLoadingState = 'error';
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
  if (typeof window === 'undefined') return;
  
  if (isReCaptchaAvailable() && scriptLoadingState === 'loaded') {
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
  if (typeof window === 'undefined') return null;
  return (window as WindowWithReCaptcha).grecaptcha || null;
};
