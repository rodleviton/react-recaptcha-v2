/**
 * Types for Google reCAPTCHA v2 integration with React
 */

/**
 * Available reCAPTCHA themes
 */
export type ReCaptchaTheme = 'light' | 'dark';

/**
 * Available reCAPTCHA sizes
 */
export type ReCaptchaSize = 'normal' | 'compact' | 'invisible';

/**
 * Available badge positions for invisible reCAPTCHA
 */
export type ReCaptchaBadgePosition = 'bottomright' | 'bottomleft' | 'inline';

/**
 * Type for reCAPTCHA callback function when the user completes the challenge
 * @param token The reCAPTCHA token string
 */
export type ReCaptchaOnVerifyCallback = (token: string) => void;

/**
 * Type for reCAPTCHA callback function when the token expires
 */
export type ReCaptchaOnExpiredCallback = () => void;

/**
 * Type for reCAPTCHA callback function when an error occurs
 * @param error Error message
 */
export type ReCaptchaOnErrorCallback = (error: string) => void;

/**
 * Type for reCAPTCHA callback function when the widget is loaded
 */
export type ReCaptchaOnLoadCallback = () => void;

/**
 * Props for the ReCaptcha component
 */
export interface ReCaptchaProps {
  /**
   * The site key provided by Google reCAPTCHA
   */
  siteKey: string;
  
  /**
   * The theme of the widget
   * @default 'light'
   */
  theme?: ReCaptchaTheme;
  
  /**
   * The size of the widget
   * @default 'normal'
   */
  size?: ReCaptchaSize;
  
  /**
   * The tabindex of the widget and challenge
   * @default 0
   */
  tabIndex?: number;
  
  /**
   * The language code for the widget
   * If unspecified, the user's browser language will be used
   */
  language?: string;
  
  /**
   * Badge position for invisible reCAPTCHA
   * @default 'bottomright'
   */
  badge?: ReCaptchaBadgePosition;
  
  /**
   * Callback function executed when the user successfully completes the challenge
   */
  onVerify?: ReCaptchaOnVerifyCallback;
  
  /**
   * Callback function executed when the token expires
   */
  onExpired?: ReCaptchaOnExpiredCallback;
  
  /**
   * Callback function executed when an error occurs
   */
  onError?: ReCaptchaOnErrorCallback;
  
  /**
   * Callback function executed when the reCAPTCHA widget is loaded
   */
  onLoad?: ReCaptchaOnLoadCallback;
  
  /**
   * ID for the reCAPTCHA container element
   * If not provided, a random ID will be generated
   */
  id?: string;
  
  /**
   * Additional CSS class name for the container
   */
  className?: string;
  
  /**
   * Whether to render the reCAPTCHA explicitly rather than automatically
   * @default false
   */
  explicit?: boolean;
  
  /**
   * Whether to hide the reCAPTCHA badge (for invisible reCAPTCHA only)
   * Note: According to Google's terms of service, you must inform users that
   * you are using reCAPTCHA even if the badge is hidden
   * @default false
   */
  hideBadge?: boolean;
}

/**
 * Interface for the reCAPTCHA instance methods
 */
export interface ReCaptchaInstance {
  /**
   * Programmatically invoke the reCAPTCHA check
   */
  execute: () => void;
  
  /**
   * Reset the reCAPTCHA widget
   */
  reset: () => void;
  
  /**
   * Get the response token
   */
  getResponse: () => string;
}

/**
 * Window with reCAPTCHA global object
 */
export interface WindowWithReCaptcha extends Window {
  grecaptcha?: {
    ready: (callback: () => void) => void;
    render: (
      container: string | HTMLElement,
      parameters: {
        sitekey: string;
        theme?: ReCaptchaTheme;
        size?: ReCaptchaSize;
        tabindex?: number;
        badge?: ReCaptchaBadgePosition;
        callback?: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: (error: string) => void;
      }
    ) => number;
    reset: (widgetId?: number) => void;
    execute: (widgetId?: number) => void;
    getResponse: (widgetId?: number) => string;
  };
}
