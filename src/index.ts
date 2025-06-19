/**
 * React reCAPTCHA v2 - A lightweight TypeScript library for integrating 
 * Google reCAPTCHA v2 with React and Next.js applications
 * 
 * @packageDocumentation
 */

// Export the main component
export { default as ReCaptcha } from './ReCaptcha';
export { default } from './ReCaptcha';

// Export the hook
export { useReCaptcha } from './useReCaptcha';

// Export utility functions that might be useful for consumers
export { 
  isReCaptchaAvailable,
  loadReCaptchaScript,
  onReCaptchaLoad,
  generateUniqueId
} from './utils';

// Export all types
export type {
  ReCaptchaTheme,
  ReCaptchaSize,
  ReCaptchaBadgePosition,
  ReCaptchaOnVerifyCallback,
  ReCaptchaOnExpiredCallback,
  ReCaptchaOnErrorCallback,
  ReCaptchaOnLoadCallback,
  ReCaptchaProps,
  ReCaptchaInstance,
  WindowWithReCaptcha
} from './types';
