'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReCaptchaInstance,
  ReCaptchaOnErrorCallback,
  ReCaptchaOnExpiredCallback,
  ReCaptchaOnVerifyCallback,
  ReCaptchaProps,
  WindowWithReCaptcha
} from './types';
import { generateUniqueId, getGrecaptcha, loadReCaptchaScript, onReCaptchaLoad } from './utils';

/**
 * Hook return type with reCAPTCHA instance and state
 */
interface UseReCaptchaReturn {
  /**
   * Reference to the reCAPTCHA container element
   */
  containerRef: React.RefObject<HTMLDivElement>;
  
  /**
   * Execute the reCAPTCHA challenge programmatically
   * Only works for invisible reCAPTCHA
   */
  execute: () => void;
  
  /**
   * Reset the reCAPTCHA widget
   */
  reset: () => void;
  
  /**
   * Get the current response token
   * @returns The reCAPTCHA response token or empty string if not available
   */
  getResponse: () => string;
  
  /**
   * Whether the reCAPTCHA script is loaded
   */
  isLoaded: boolean;
  
  /**
   * Whether the reCAPTCHA widget is ready to use
   */
  isReady: boolean;
  
  /**
   * Error message if the reCAPTCHA script failed to load
   */
  error: string | null;
}

/**
 * Hook options for useReCaptcha
 */
interface UseReCaptchaOptions extends Omit<ReCaptchaProps, 'id' | 'className'> {
  /**
   * Whether to render the reCAPTCHA widget automatically
   * @default true
   */
  autoLoad?: boolean;
}

/**
 * React hook to manage reCAPTCHA state and actions
 * 
 * @param options Configuration options for reCAPTCHA
 * @returns Object with methods to interact with reCAPTCHA and current state
 * 
 * @example
 * ```tsx
 * const { containerRef, execute, reset, getResponse, isReady } = useReCaptcha({
 *   siteKey: 'your-site-key',
 *   size: 'invisible',
 *   onVerify: (token) => {
 *     console.log('Verified with token:', token);
 *   }
 * });
 * 
 * // In your JSX:
 * return (
 *   <>
 *     <div ref={containerRef} />
 *     <button onClick={execute} disabled={!isReady}>
 *       Verify with reCAPTCHA
 *     </button>
 *   </>
 * );
 * ```
 */
export const useReCaptcha = ({
  siteKey,
  theme = 'light',
  size = 'normal',
  tabIndex = 0,
  badge = 'bottomright',
  language,
  onVerify,
  onExpired,
  onError,
  onLoad,
  explicit = false,
  autoLoad = true,
  hideBadge = false
}: UseReCaptchaOptions): UseReCaptchaReturn => {
  // Create refs for DOM element and widget ID
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const containerId = useRef<string>(generateUniqueId());
  
  // Track loading and ready state
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store callbacks in refs to avoid dependency changes
  const onVerifyRef = useRef<ReCaptchaOnVerifyCallback | undefined>(onVerify);
  const onExpiredRef = useRef<ReCaptchaOnExpiredCallback | undefined>(onExpired);
  const onErrorRef = useRef<ReCaptchaOnErrorCallback | undefined>(onError);
  const onLoadRef = useRef<(() => void) | undefined>(onLoad);
  
  // Update callback refs when props change
  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpiredRef.current = onExpired;
    onErrorRef.current = onError;
    onLoadRef.current = onLoad;
  }, [onVerify, onExpired, onError, onLoad]);
  
  // Add style to hide badge if requested
  useEffect(() => {
    if (hideBadge && typeof document !== 'undefined') {
      // Create a style element if it doesn't exist
      let style = document.getElementById('recaptcha-badge-style');
      
      if (!style) {
        style = document.createElement('style');
        style.id = 'recaptcha-badge-style';
        document.head.appendChild(style);
      }
      
      style.innerHTML = '.grecaptcha-badge { visibility: hidden !important; }';
      
      return () => {
        // Remove style when component unmounts
        if (style && style.parentNode) {
          style.parentNode.removeChild(style);
        }
      };
    }
  }, [hideBadge]);
  
  // Render the reCAPTCHA widget
  const renderReCaptcha = useCallback(() => {
    const grecaptcha = getGrecaptcha();
    if (!grecaptcha || !containerRef.current) return;
    
    try {
      // Reset widget ID if it already exists
      if (widgetIdRef.current !== null) {
        grecaptcha.reset(widgetIdRef.current);
      }
      
      // Render the widget
      widgetIdRef.current = grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size,
        tabindex: tabIndex,
        badge,
        callback: (token: string) => {
          onVerifyRef.current?.(token);
        },
        'expired-callback': () => {
          onExpiredRef.current?.();
        },
        'error-callback': (errorMsg: string) => {
          onErrorRef.current?.(errorMsg);
        }
      });
      
      setIsReady(true);
      onLoadRef.current?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
    }
  }, [siteKey, theme, size, tabIndex, badge]);
  
  // Load the reCAPTCHA script and render the widget
  useEffect(() => {
    if (!autoLoad || typeof window === 'undefined') return;
    
    loadReCaptchaScript(language)
      .then(() => {
        setIsLoaded(true);
        
        // If grecaptcha is available, render the widget
        onReCaptchaLoad(() => {
          if (containerRef.current) {
            renderReCaptcha();
          }
        });
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        onErrorRef.current?.(errorMessage);
      });
      
    return () => {
      // Clean up widget when component unmounts
      if (widgetIdRef.current !== null && getGrecaptcha()) {
        getGrecaptcha()?.reset(widgetIdRef.current);
      }
    };
  }, [autoLoad, language, renderReCaptcha]);
  
  // Execute the reCAPTCHA challenge programmatically
  const execute = useCallback(() => {
    const grecaptcha = getGrecaptcha();
    if (!grecaptcha || widgetIdRef.current === null) return;
    
    try {
      grecaptcha.execute(widgetIdRef.current);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
    }
  }, []);
  
  // Reset the reCAPTCHA widget
  const reset = useCallback(() => {
    const grecaptcha = getGrecaptcha();
    if (!grecaptcha || widgetIdRef.current === null) return;
    
    try {
      grecaptcha.reset(widgetIdRef.current);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
    }
  }, []);
  
  // Get the current response token
  const getResponse = useCallback(() => {
    const grecaptcha = getGrecaptcha();
    if (!grecaptcha || widgetIdRef.current === null) return '';
    
    try {
      return grecaptcha.getResponse(widgetIdRef.current) || '';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
      return '';
    }
  }, []);
  
  return {
    containerRef,
    execute,
    reset,
    getResponse,
    isLoaded,
    isReady,
    error
  };
};

export default useReCaptcha;
