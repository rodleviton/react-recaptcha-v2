'use client';

import { FormEvent, useRef, useState } from 'react';
import { ReCaptcha, ReCaptchaInstance } from 'react-recaptcha-v2';

interface FormState {
  name: string;
  email: string;
  message: string;
}

export default function ContactForm() {
  // Form state
  const [formData, setFormData] = useState<FormState>({
    name: '',
    email: '',
    message: ''
  });
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});
  
  // reCAPTCHA reference for programmatic control
  const recaptchaRef = useRef<ReCaptchaInstance>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string>('');
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Reset states
    setIsSubmitting(true);
    setSubmitStatus({});
    
    // Validate form fields
    if (!formData.name || !formData.email || !formData.message) {
      setSubmitStatus({
        success: false,
        message: 'Please fill out all fields'
      });
      setIsSubmitting(false);
      return;
    }
    
    // If using invisible reCAPTCHA, execute it programmatically
    // For normal/compact size, the user will have already completed the challenge
    if (!recaptchaToken) {
      // For invisible reCAPTCHA
      if (recaptchaRef.current) {
        recaptchaRef.current.execute();
        // The submission will continue in the onVerify callback
        return;
      } else {
        setSubmitStatus({
          success: false,
          message: 'Please complete the reCAPTCHA challenge'
        });
        setIsSubmitting(false);
        return;
      }
    }
    
    // If we have a token, proceed with form submission
    try {
      // Example API call to your server endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          recaptchaToken
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      // Success! Reset the form
      setFormData({ name: '', email: '', message: '' });
      setRecaptchaToken('');
      recaptchaRef.current?.reset();
      
      setSubmitStatus({
        success: true,
        message: 'Thank you for your message! We will get back to you soon.'
      });
    } catch (error) {
      setSubmitStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit form'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle reCAPTCHA verification
  const handleRecaptchaVerify = (token: string) => {
    setRecaptchaToken(token);
    setRecaptchaError(null);
    
    // If the form was already submitted (invisible reCAPTCHA case),
    // automatically submit the form now that we have a token
    if (isSubmitting && token) {
      handleFormSubmitWithToken(token);
    }
  };
  
  // Handle form submission with token (for invisible reCAPTCHA)
  const handleFormSubmitWithToken = async (token: string) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          recaptchaToken: token
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      // Success! Reset the form
      setFormData({ name: '', email: '', message: '' });
      setRecaptchaToken('');
      recaptchaRef.current?.reset();
      
      setSubmitStatus({
        success: true,
        message: 'Thank you for your message! We will get back to you soon.'
      });
    } catch (error) {
      setSubmitStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit form'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Contact Us</h2>
      
      {submitStatus.message && (
        <div 
          className={`p-4 mb-6 rounded ${
            submitStatus.success 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}
        >
          {submitStatus.message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
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
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
            required
          />
        </div>
        
        <div className="mb-6">
          {/* Use normal size reCAPTCHA for this example */}
          <ReCaptcha
            ref={recaptchaRef}
            siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key'}
            theme="light"
            size="normal" // Use "invisible" for invisible reCAPTCHA
            onVerify={handleRecaptchaVerify}
            onExpired={() => {
              setRecaptchaToken('');
              setRecaptchaError('reCAPTCHA token expired. Please verify again.');
            }}
            onError={(error) => {
              setRecaptchaError(`reCAPTCHA error: ${error}`);
            }}
            onLoad={() => {
              console.log('reCAPTCHA loaded successfully');
            }}
          />
          
          {recaptchaError && (
            <p className="mt-2 text-sm text-red-600">{recaptchaError}</p>
          )}
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Send Message'}
        </button>
      </form>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        This site is protected by reCAPTCHA and the Google
        <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline"> Privacy Policy</a> and
        <a href="https://policies.google.com/terms" className="text-blue-600 hover:underline"> Terms of Service</a> apply.
      </div>
    </div>
  );
}
