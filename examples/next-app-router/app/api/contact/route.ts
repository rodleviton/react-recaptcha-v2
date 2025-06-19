import { NextRequest, NextResponse } from 'next/server';

// Define the expected request body structure
interface ContactFormData {
  name: string;
  email: string;
  message: string;
  recaptchaToken: string;
}

/**
 * API route handler for contact form submissions
 * Verifies reCAPTCHA token and processes form data
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json() as ContactFormData;
    
    // Extract the reCAPTCHA token
    const { recaptchaToken, name, email, message } = body;
    
    // Validate required fields
    if (!recaptchaToken) {
      return NextResponse.json(
        { success: false, message: 'reCAPTCHA token is required' },
        { status: 400 }
      );
    }
    
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: 'All form fields are required' },
        { status: 400 }
      );
    }

    // Verify the reCAPTCHA token with Google's API
    const recaptchaResponse = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY || '',
          response: recaptchaToken,
        }),
      }
    );

    const recaptchaData = await recaptchaResponse.json();

    // Check if the verification was successful
    if (!recaptchaData.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'reCAPTCHA verification failed',
          errors: recaptchaData['error-codes'] || []
        },
        { status: 400 }
      );
    }

    // If the score is too low (for v3 reCAPTCHA), reject the submission
    // For v2 reCAPTCHA, this check isn't necessary, but included for completeness
    if (recaptchaData.score !== undefined && recaptchaData.score < 0.5) {
      return NextResponse.json(
        { success: false, message: 'Suspicious activity detected' },
        { status: 400 }
      );
    }

    // At this point, the reCAPTCHA verification was successful
    // Process the form data (e.g., send email, save to database, etc.)
    
    // This is where you would add your own logic to handle the form data
    // For example:
    // - Send an email notification
    // - Save the contact request to a database
    // - Forward the message to a CRM system
    
    console.log('Form submission verified:', {
      name,
      email,
      message: message.substring(0, 20) + '...' // Log truncated message for privacy
    });

    // Return a success response
    return NextResponse.json(
      { 
        success: true, 
        message: 'Form submitted successfully' 
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error processing contact form:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while processing your request' 
      },
      { status: 500 }
    );
  }
}
