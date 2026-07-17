import { API_BASE_URL } from './api';

/**
 * Submit a contact form message
 * @param {Object} contactData - The contact form data
 * @param {string} contactData.name - Sender's full name (required, max 255 chars)
 * @param {string} contactData.email - Sender's email address (required, max 255 chars)
 * @param {string} contactData.subject - Message subject (required, max 255 chars)
 * @param {string} contactData.message - Message content (required, max 1000 chars)
 * @param {string} [contactData.phone] - Phone number (optional, max 20 chars)
 * @param {string} [contactData.category] - Message category (optional, defaults to "General")
 * @returns {Promise<Object>} Response data
 */
export const submitContactForm = async (contactData) => {
  try {
    // Validate required fields
    const requiredFields = ['name', 'email', 'subject', 'message'];
    const missingFields = requiredFields.filter(field => !contactData[field] || contactData[field].trim() === '');
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')} are required`);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate message length
    if (contactData.message.length > 1000) {
      throw new Error('Message too long. Maximum 1000 characters allowed.');
    }

    // Validate field lengths
    if (contactData.name.length > 255) {
      throw new Error('Name too long. Maximum 255 characters allowed.');
    }

    if (contactData.email.length > 255) {
      throw new Error('Email too long. Maximum 255 characters allowed.');
    }

    if (contactData.subject.length > 255) {
      throw new Error('Subject too long. Maximum 255 characters allowed.');
    }

    if (contactData.phone && contactData.phone.length > 20) {
      throw new Error('Phone number too long. Maximum 20 characters allowed.');
    }

    // Set default category if not provided
    const formData = {
      ...contactData,
      category: contactData.category || 'General'
    };

    const response = await fetch(`${API_BASE_URL}/contact/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle different error status codes
      if (response.status === 400) {
        throw new Error(data.error || 'Validation error occurred');
      } else if (response.status === 500) {
        throw new Error('Failed to submit contact message. Please try again later.');
      } else {
        throw new Error(data.error || 'An unexpected error occurred');
      }
    }

    return data;
  } catch (error) {
    // Re-throw validation errors
    if (error.message.includes('Missing required fields') || 
        error.message.includes('Invalid email format') ||
        error.message.includes('Message too long') ||
        error.message.includes('Name too long') ||
        error.message.includes('Email too long') ||
        error.message.includes('Subject too long') ||
        error.message.includes('Phone number too long')) {
      throw error;
    }

    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }

    // Re-throw other errors
    throw error;
  }
};

/**
 * Get available contact categories
 * @returns {Array<string>} Array of available categories
 */
export const getContactCategories = () => {
  return [
    'General',
    'Technical Support',
    'Events',
    'Partnership',
    'Membership',
    'Workshop',
    'Project'
  ];
};
