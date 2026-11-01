import { useState } from 'react';
import { submitContactForm } from '../lib/contact';

export const useContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "General",
    message: "",
    phone: "",
    honeypot: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required field validation
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = "Please enter your full name (minimum 2 characters).";
    }
    
    if (!formData.email || formData.email.trim() === "") {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    
    if (!formData.subject || formData.subject.trim().length < 3) {
      newErrors.subject = "Subject must be at least 3 characters long.";
    }
    
    if (!formData.message || formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters long.";
    }

    // Length validation
    if (formData.name && formData.name.length > 255) {
      newErrors.name = "Name is too long. Maximum 255 characters allowed.";
    }
    
    if (formData.email && formData.email.length > 255) {
      newErrors.email = "Email is too long. Maximum 255 characters allowed.";
    }
    
    if (formData.subject && formData.subject.length > 255) {
      newErrors.subject = "Subject is too long. Maximum 255 characters allowed.";
    }
    
    if (formData.message && formData.message.length > 1000) {
      newErrors.message = "Message is too long. Maximum 1000 characters allowed.";
    }
    
    if (formData.phone && formData.phone.length > 20) {
      newErrors.phone = "Phone number is too long. Maximum 20 characters allowed.";
    }

    // Bot detection
    if (formData.honeypot) {
      newErrors.general = "Bot detected. Please try again.";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset previous errors
    setErrors({});
    setSubmitError("");
    
    // Validate form
    const newErrors = validateForm();
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return false;
    }

    // Submit form via API
    setIsSubmitting(true);
    try {
      const response = await submitContactForm(formData);
      setSubmitted(true);
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        category: "General",
        message: "",
        phone: "",
        honeypot: "",
      });
      
      return true;
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setSubmitError(error.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      subject: "",
      category: "General",
      message: "",
      phone: "",
      honeypot: "",
    });
    setErrors({});
    setSubmitError("");
    setSubmitted(false);
  };

  return {
    formData,
    errors,
    isSubmitting,
    submitted,
    submitError,
    handleInputChange,
    handleSubmit,
    resetForm,
  };
};
