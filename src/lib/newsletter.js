import { API_BASE_URL } from './api';

/**
 * Subscribe an email address to the newsletter
 * @param {Object} subscriptionData - The subscription data
 * @param {string} subscriptionData.email - Email address (required)
 * @param {string} [subscriptionData.firstName] - First name (optional)
 * @param {string} [subscriptionData.lastName] - Last name (optional)
 * @returns {Promise<Object>} Response data
 */
export const subscribeToNewsletter = async (subscriptionData) => {
  try {
    // Validate required fields
    if (!subscriptionData.email) {
      throw new Error('Email is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(subscriptionData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate field lengths
    if (subscriptionData.email.length > 255) {
      throw new Error('Email too long. Maximum 255 characters allowed.');
    }

    if (subscriptionData.firstName && subscriptionData.firstName.length > 100) {
      throw new Error('First name too long. Maximum 100 characters allowed.');
    }

    if (subscriptionData.lastName && subscriptionData.lastName.length > 100) {
      throw new Error('Last name too long. Maximum 100 characters allowed.');
    }

    const response = await fetch(`${API_BASE_URL}/newsletter/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle different error status codes
      if (response.status === 400) {
        throw new Error(data.error || 'Validation error occurred');
      } else if (response.status === 409) {
        throw new Error('Email is already subscribed to the newsletter');
      } else if (response.status === 500) {
        throw new Error('Failed to subscribe to newsletter. Please try again later.');
      } else {
        throw new Error(data.error || 'An unexpected error occurred');
      }
    }

    return data;
  } catch (error) {
    // Re-throw validation errors
    if (error.message.includes('Email is required') || 
        error.message.includes('Invalid email format') ||
        error.message.includes('Email too long') ||
        error.message.includes('First name too long') ||
        error.message.includes('Last name too long') ||
        error.message.includes('Email is already subscribed')) {
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
 * Check if an email is subscribed to the newsletter
 * @param {string} email - Email address to check
 * @returns {Promise<Object>} Response data with subscription status
 */
export const checkNewsletterStatus = async (email) => {
  try {
    // Validate required fields
    if (!email) {
      throw new Error('Email is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    const response = await fetch(`${API_BASE_URL}/newsletter/status/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle different error status codes
      if (response.status === 400) {
        throw new Error(data.error || 'Validation error occurred');
      } else if (response.status === 500) {
        throw new Error('Failed to check subscription status. Please try again later.');
      } else {
        throw new Error(data.error || 'An unexpected error occurred');
      }
    }

    return data;
  } catch (error) {
    // Re-throw validation errors
    if (error.message.includes('Email is required') || 
        error.message.includes('Invalid email format')) {
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
 * Unsubscribe an email from the newsletter
 * @param {string} email - Email address to unsubscribe
 * @returns {Promise<Object>} Response data
 */
export const unsubscribeFromNewsletter = async (email) => {
  try {
    // Validate required fields
    if (!email) {
      throw new Error('Email is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    const response = await fetch(`${API_BASE_URL}/newsletter/unsubscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle different error status codes
      if (response.status === 400) {
        throw new Error(data.error || 'Validation error occurred');
      } else if (response.status === 404) {
        throw new Error('Email not found in subscription list');
      } else if (response.status === 500) {
        throw new Error('Failed to unsubscribe from newsletter. Please try again later.');
      } else {
        throw new Error(data.error || 'An unexpected error occurred');
      }
    }

    return data;
  } catch (error) {
    // Re-throw validation errors
    if (error.message.includes('Email is required') || 
        error.message.includes('Invalid email format') ||
        error.message.includes('Email not found')) {
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
