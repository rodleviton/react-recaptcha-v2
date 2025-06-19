'use client';

import React, { forwardRef, useImperativeHandle } from 'react';
import { ReCaptchaInstance, ReCaptchaProps } from './types';
import useReCaptcha from './useReCaptcha';

/**
 * React component that renders Google reCAPTCHA v2
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <ReCaptcha
 *   siteKey="your-site-key"
 *   onVerify={(token) => console.log('Verified with token:', token)}
 * />
 * 
 * // Invisible reCAPTCHA with ref
 * const recaptchaRef = useRef<ReCaptchaInstance>(null);
 * 
 * const handleSubmit = () => {
 *   recaptchaRef.current?.execute();
 * };
 * 
 * <ReCaptcha
 *   ref={recaptchaRef}
 *   siteKey="your-site-key"
 *   size="invisible"
 *   onVerify={handleVerification}
 * />
 * <button onClick={handleSubmit}>Submit Form</button>
 * 
 * // Using async/await with executeAsync
 * const handleSubmitAsync = async () => {
 *   try {
 *     const token = await recaptchaRef.current?.executeAsync();
 *     console.log('Got token:', token);
 *     // Submit form with token
 *   } catch (error) {
 *     console.error('ReCaptcha error:', error);
 *   }
 * };
 * ```
 */
const ReCaptcha = forwardRef<ReCaptchaInstance, ReCaptchaProps>((props, ref) => {
  const {
    siteKey,
    theme = 'light',
    size = 'normal',
    tabIndex = 0,
    language,
    badge = 'bottomright',
    onVerify,
    onExpired,
    onError,
    onLoad,
    id,
    className,
    explicit = false,
    hideBadge = false
  } = props;

  // Use the reCAPTCHA hook
  const {
    containerRef,
    execute,
    executeAsync,
    reset,
    getResponse,
    isLoaded,
    isReady,
    error
  } = useReCaptcha({
    siteKey,
    theme,
    size,
    tabIndex,
    badge,
    language,
    onVerify,
    onExpired,
    onError,
    onLoad,
    explicit,
    autoLoad: !explicit,
    hideBadge
  });

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    execute,
    executeAsync,
    reset,
    getResponse
  }), [execute, executeAsync, reset, getResponse]);

  // Render the container for reCAPTCHA
  return (
    <div
      id={id}
      className={className}
      ref={containerRef}
      data-recaptcha-loaded={isLoaded}
      data-recaptcha-ready={isReady}
      data-recaptcha-error={error ? 'true' : 'false'}
    />
  );
});

// Set display name for better debugging
ReCaptcha.displayName = 'ReCaptcha';

export default ReCaptcha;
