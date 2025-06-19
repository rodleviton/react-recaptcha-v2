'use client';

import { FormEvent, useRef, useState } from 'react';
import { ReCaptcha, ReCaptchaInstance } from 'react-recaptcha-v2';

export default function AsyncExample() {
  // Form state
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    token?: string;
  }>({});
  
  // Create a ref to the reCAPTCHA component
  const recaptchaRef = useRef<ReCaptchaInstance>(null);
  
  /**
   * Handle form submission using async/await with executeAsync
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Reset previous results
    setResult({});
    
    // Validate form
    if (!email || !message) {
      setResult({
        success: false,
        message: 'Please fill out all fields'
      });
      return;
    }
    
    try {
      // Start submission process
      setIsSubmitting(true);
      
      // This is the key part - using await with executeAsync to get the token directly
      const token = await recaptchaRef.current?.executeAsync();
      
      if (!token) {
        throw new Error('Failed to get reCAPTCHA token');
      }
      
      // Show the token in our example (in a real app, you'd send this to your server)
      setResult({
        success: true,
        message: 'Form validated successfully!',
        token
      });
      
      // In a real application, you would send the token to your server:
      // const response = await fetch('/api/submit-form', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, message, recaptchaToken: token })
      // });
      // const data = await response.json();
      
      // Reset form after successful submission
      setEmail('');
      setMessage('');
      
      // Reset reCAPTCHA for next submission
      recaptchaRef.current?.reset();
      
    } catch (error) {
      // Handle errors from executeAsync
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred during verification'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-2 text-center">Async reCAPTCHA Example</h2>
      <p className="text-gray-600 mb-6 text-center text-sm">
        Demonstrates using <code>executeAsync()</code> with async/await
      </p>
      
      {/* Result display */}
      {result.message && (
        <div 
          className={`p-4 mb-6 rounded ${
            result.success 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}
        >
          <p className="font-medium">{result.message}</p>
          
          {/* Display the token if available */}
          {result.token && (
            <div className="mt-2">
              <p className="text-sm font-medium">Token received:</p>
              <p className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-x-auto whitespace-nowrap">
                {result.token.substring(0, 20)}...
                {result.token.substring(result.token.length - 20)}
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
            required
          />
        </div>
        
        {/* Invisible reCAPTCHA */}
        <ReCaptcha
          ref={recaptchaRef}
          siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key'}
          size="invisible"
          onError={(error) => {
            setResult({
              success: false,
              message: `reCAPTCHA error: ${error}`
            });
          }}
        />
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Verifying...' : 'Submit with reCAPTCHA'}
        </button>
      </form>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">How it works:</h3>
        <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`// Inside your submit handler:
try {
  // Get token directly with await
  const token = await recaptchaRef.current?.executeAsync();
  
  // Use token in your API request
  await submitToApi({ data, recaptchaToken: token });
} catch (error) {
  // Handle verification errors
}`}
        </pre>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        This site is protected by reCAPTCHA and the Google
        <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline"> Privacy Policy</a> and
        <a href="https://policies.google.com/terms" className="text-blue-600 hover:underline"> Terms of Service</a> apply.
      </div>
    </div>
  );
}
