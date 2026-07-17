"use client";
import React from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Users, AlertTriangle, Loader2 } from "lucide-react";
import clubData from "../AllDatas/data.json";
import { getContactCategories } from "../../lib/contact";
import { useContactForm } from "../../hooks/useContactForm";

const inputClassName =
  "mt-1 block w-full min-w-0 rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-white shadow-sm focus:border-red-500 focus:outline-none focus:ring focus:ring-red-500 focus:ring-opacity-50";

const ContactPage = () => {
  const {
    formData,
    errors,
    isSubmitting,
    submitted,
    submitError,
    handleInputChange,
    handleSubmit,
  } = useContactForm();

  // Use leadership data from the imported JSON
  const coreMembersData = clubData.leadership.map((member) => ({
    name: member.name,
    role: member.role,
    email: member.email,
  }));

  // Get available contact categories
  const availableCategories = getContactCategories();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-black text-white font-sans py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Section - simple & consistent */}
      <motion.div
        className="max-w-7xl mx-auto mb-8 sm:mb-12 text-center"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 font-display bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-600 break-words px-1">
          Contact NewtonBotics
        </h1>
        <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto px-1">
          Reach out for workshops, projects, collaborations, or general queries.
        </p>
      </motion.div>

      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto mb-6 rounded-xl border border-green-500/30 bg-green-500/10 text-green-200 px-4 py-3 text-sm"
        >
          ✅ Thank you! Your message has been sent. Our team will get back to you within 24-48 hours.
        </motion.div>
      )}

      {submitError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto mb-6 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3 text-sm break-words"
        >
          ❌ Error: {submitError}
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Contact Form */}
        <motion.div
          className="w-full min-w-0 bg-white/5 backdrop-blur-lg rounded-xl p-4 sm:p-6 lg:p-8 border border-white/10"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center font-display">
            Get In Touch
          </h2>
          <p className="text-white/60 text-center mb-6 text-sm sm:text-base">
            We typically respond within 24–48 hours.
          </p>
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-white/80"
              >
                Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                aria-invalid={errors.name ? "true" : "false"}
                className={inputClassName}
              />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white/80"
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                aria-invalid={errors.email ? "true" : "false"}
                className={inputClassName}
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label htmlFor="subject" className="block text-sm font-medium text-white/80">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={handleInputChange}
                  aria-invalid={errors.subject ? "true" : "false"}
                  className={inputClassName}
                />
                {errors.subject && <p className="mt-1 text-xs text-red-400">{errors.subject}</p>}
              </div>
              <div className="min-w-0">
                <label htmlFor="category" className="block text-sm font-medium text-white/80">
                  Category
                </label>
                <select
                  name="category"
                  id="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={inputClassName}
                >
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-white/80">
                Phone (optional)
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={inputClassName}
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-white/80"
              >
                Message
              </label>
              <textarea
                name="message"
                id="message"
                rows={4}
                required
                value={formData.message}
                onChange={handleInputChange}
                maxLength={1000}
                aria-invalid={errors.message ? "true" : "false"}
                className={`${inputClassName} resize-y`}
              />
              <div className="flex items-center justify-between mt-1 gap-2">
                {errors.message ? (
                  <p className="text-xs text-red-400">{errors.message}</p>
                ) : (
                  <span className="text-xs text-white/50">{formData.message.length}/1000</span>
                )}
              </div>
              {/* Honeypot for bots */}
              <input
                type="text"
                name="honeypot"
                value={formData.honeypot}
                onChange={handleInputChange}
                className="hidden"
                autoComplete="off"
                tabIndex={-1}
              />
            </div>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.03 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.97 }}
              className={`w-full py-3 rounded-md transition duration-300 ease-in-out flex items-center justify-center text-sm sm:text-base ${
                isSubmitting
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-500"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </motion.button>

            {/* Core Member Notification */}
            <div className="mt-4 bg-yellow-50/10 border-l-4 border-yellow-400 p-3 flex items-start sm:items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5 sm:mt-0" />
              <p className="text-yellow-200 text-sm leading-relaxed">
                This message will be visible to all core team members
              </p>
            </div>
          </form>
        </motion.div>

        {/* Core Members Section */}
        <motion.div
          className="w-full min-w-0 overflow-hidden bg-white/5 backdrop-blur-lg rounded-xl p-4 sm:p-6 lg:p-8 border border-white/10"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center font-display">
            <Users className="mr-3 text-red-500 shrink-0" /> Core Members
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {coreMembersData.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 w-full box-border p-3 sm:p-4 bg-white/5 backdrop-blur-lg rounded-lg hover:bg-white/10 transition border border-white/10"
              >
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="font-semibold text-white truncate">{member.name}</p>
                  <p className="text-sm text-white/80 truncate">{member.role}</p>
                </div>
                <a
                  href={`mailto:${member.email}`}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 shrink-0"
                  aria-label={`Email ${member.name}`}
                >
                  <Mail className="h-4 w-4" />
                </a>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 space-y-4 text-white/80">
            <div className="flex items-start gap-3">
              <MapPin className="text-red-500 shrink-0 mt-0.5" />
              <span className="min-w-0 break-words">Academic Block, Room 407</span>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="text-red-500 shrink-0 mt-0.5" />
              <a
                href="mailto:newtonbotics.club@rishihood.edu.in"
                className="min-w-0 text-sm sm:text-base break-words hover:text-white transition-colors"
              >
                newtonbotics.club@rishihood.edu.in
              </a>
            </div>
            <div className="mt-4">
              <h4 className="text-lg font-semibold text-white mb-2 font-display">
                Social Media
              </h4>
              <div className="flex flex-wrap gap-4">
                <a
                  href={`https://instagram.com/${clubData.contactInfo.socialMedia.instagram.replace(
                    "@",
                    ""
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-500 hover:text-red-600"
                >
                  Instagram
                </a>
                <a
                  href={`https://linkedin.com/company/${clubData.contactInfo.socialMedia.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-500 hover:text-red-600"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactPage;
