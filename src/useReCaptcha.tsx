'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject
} from 'react';
import {
  ReCaptchaOnErrorCallback,
  ReCaptchaOnExpiredCallback,
  ReCaptchaOnVerifyCallback,
  ReCaptchaProps,
} from './types';
import { getGrecaptcha, loadReCaptchaScript, onReCaptchaLoad } from './utils';

/**
 * Hook return type with reCAPTCHA instance and state
 */
interface UseReCaptchaReturn {
  /**
   * Reference to the reCAPTCHA container element
   */
  containerRef: RefObject<HTMLDivElement | null>;
  
  /**
   * Execute the reCAPTCHA challenge programmatically
   * Only works for invisible reCAPTCHA
   */
  execute: () => void;

  /**
   * Execute the reCAPTCHA challenge and return a Promise that
   * resolves with the verification token. Useful for:
   *
   * ```ts
   * const token = await executeAsync();
   * ```
   *
   * Only works for invisible reCAPTCHA.
   */
  executeAsync: () => Promise<string>;
  
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
  autoLoad = true,
  hideBadge = false
}: UseReCaptchaOptions): UseReCaptchaReturn => {
  // Create refs for DOM element and widget ID
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  
  // Track loading and ready state
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store callbacks in refs to avoid dependency changes
  const onVerifyRef = useRef<ReCaptchaOnVerifyCallback | undefined>(onVerify);
  const onExpiredRef = useRef<ReCaptchaOnExpiredCallback | undefined>(onExpired);
  const onErrorRef = useRef<ReCaptchaOnErrorCallback | undefined>(onError);
  const onLoadRef = useRef<(() => void) | undefined>(onLoad);

  // Store resolve/reject for executeAsync
  const pendingPromiseRef = useRef<{
    resolve: (token: string) => void;
    reject: (error: string) => void;
  } | null>(null);

  /**
   * When `executeAsync` is used we start a timeout so callers are not left with
   * a Promise that hangs forever if Google's script never responds.  The timer
   * id is stored in a ref so we can cancel it once the widget actually returns
   * a result (verify, expired, or error).
   */
  const executeTimeoutRef = useRef<number | null>(null);

  /** Clears the pending timeout, if any. */
  const clearExecuteTimeout = useCallback(() => {
    if (executeTimeoutRef.current !== null) {
      clearTimeout(executeTimeoutRef.current);
      executeTimeoutRef.current = null;
    }
  }, []);
  
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
        if (widgetIdRef.current !== null && getGrecaptcha()) {
          getGrecaptcha()?.reset(widgetIdRef.current);
        }
        // Also clear any pending executeAsync timeout
        clearExecuteTimeout();
      };
    }
  }, [hideBadge, clearExecuteTimeout]);
  
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

          // Resolve pending promise if executeAsync was used
          if (pendingPromiseRef.current) {
            pendingPromiseRef.current.resolve(token);
            pendingPromiseRef.current = null;
          }
          clearExecuteTimeout();
        },
        'expired-callback': () => {
          onExpiredRef.current?.();

          // Reject pending promise on expiration
          if (pendingPromiseRef.current) {
            pendingPromiseRef.current.reject('expired');
            pendingPromiseRef.current = null;
          }
          clearExecuteTimeout();
        },
        'error-callback': (errorMsg: string) => {
          onErrorRef.current?.(errorMsg);

          // Reject pending promise on error
          if (pendingPromiseRef.current) {
            pendingPromiseRef.current.reject(errorMsg);
            pendingPromiseRef.current = null;
          }
          clearExecuteTimeout();
        }
      });
      
      setIsReady(true);
      onLoadRef.current?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
    }
  }, [siteKey, theme, size, tabIndex, badge, clearExecuteTimeout]); // Added clearExecuteTimeout to dependency array
  
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
        // Swallow intermittent reCAPTCHA internal **timeout** noise so it
        // doesn’t surface as an error in the host app.  All other errors
        // (network, ad-blocker, etc.) are still bubbled up.
        const lower = errorMessage.toLowerCase();
        const isInternalTimeout =
          lower.includes('recaptcha') && lower.includes('timeout');

        if (isInternalTimeout) {
          return; // ignore this specific noise
        }

        setError(errorMessage);
        onErrorRef.current?.(errorMessage);
      });
      
    return () => {
      // Clean up widget when component unmounts
      // 1️⃣ Clear any DOM that reCAPTCHA injected to avoid later
      //    access attempts inside Google’s script.
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      // 2️⃣ Reject any pending executeAsync promise so caller
      //    is not left hanging after unmount.
      if (pendingPromiseRef.current) {
        pendingPromiseRef.current.reject('ReCaptcha component unmounted');
        pendingPromiseRef.current = null;
      }
      clearExecuteTimeout();

      // 3️⃣ Finally, ask grecaptcha to reset the widget (safe-guard).
      if (widgetIdRef.current !== null && getGrecaptcha()) {
        getGrecaptcha()?.reset(widgetIdRef.current);
      }
    };
  }, [autoLoad, language, renderReCaptcha, clearExecuteTimeout]);
  
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
  
  // Execute the challenge and return a Promise that resolves with the token
  const executeAsync = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      const grecaptcha = getGrecaptcha();
      if (!grecaptcha || widgetIdRef.current === null) {
        reject('reCAPTCHA not ready');
        clearExecuteTimeout();
        return;
      }

      pendingPromiseRef.current = { resolve, reject };
      /* ------------------------------------------------------------------
       * Start a 10-second timeout.  If Google's script never responds,
       * reject the promise so callers aren't left hanging forever.
       * ------------------------------------------------------------------ */
      clearExecuteTimeout(); // just in case
      executeTimeoutRef.current = window.setTimeout(() => {
        if (pendingPromiseRef.current) {
          pendingPromiseRef.current.reject('timeout');
          pendingPromiseRef.current = null;
        }
        clearExecuteTimeout();
      }, 120_000); // 2 min

      try {
        grecaptcha.execute(widgetIdRef.current);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        pendingPromiseRef.current = null;
        setError(errorMessage);
        onErrorRef.current?.(errorMessage);
        reject(errorMessage);
        clearExecuteTimeout();
      }
    });
  }, [clearExecuteTimeout]); // Added clearExecuteTimeout to dependency array

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
    executeAsync,
    getResponse,
    isLoaded,
    isReady,
    error
  };
};

export default useReCaptcha;
