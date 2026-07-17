"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";
import { User2, Mail, Phone, Building, Calendar, Lock, Eye, EyeOff, Save, AlertCircle, CheckCircle } from "lucide-react";
import ProtectedRoute from "../../components/ProtectedRoute";
import CloudinaryUploader from "../../components/CloudinaryUploader";

function Input({ label, icon: Icon, rightElement, disabled: isDisabled, ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-sm text-white/80">{label}</span>}
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />}
        <input 
          {...props} 
          disabled={isDisabled}
          className={`w-full ${Icon ? "pl-10" : "pl-4"} ${rightElement ? "pr-10" : "pr-4"} py-2.5 rounded-xl bg-white/10 border border-white/15 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-sm leading-normal text-white placeholder-white/50 [font-family:system-ui,Segoe_UI,Roboto,sans-serif] ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}`} 
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
    </label>
  );
}

function Select({ label, icon: Icon, disabled: isDisabled, children, ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-sm text-white/80">{label}</span>}
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />}
        <select
          {...props}
          disabled={isDisabled}
          className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-4 py-2.5 rounded-xl bg-white/10 border border-white/15 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-sm leading-normal text-white [font-family:system-ui,Segoe_UI,Roboto,sans-serif] ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {children}
        </select>
      </div>
    </label>
  );
}

const departments = [
  "Computer Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Robotics Engineering",
  "Artificial Intelligence",
  "Data Science",
  "Other"
];

export default function ProfileCompletionPage() {
  const { user, updateProfile, changePassword, refreshUser } = useAuth();
  const [refreshingUser, setRefreshingUser] = useState(false);
  
  // Refresh user profile on mount to get latest data including subroles
  useEffect(() => {
    let cancelled = false;

    const refreshUserProfile = async () => {
      if (!user) return;

      try {
        setRefreshingUser(true);
        await refreshUser();
      } catch (error) {
        console.error('Failed to refresh user profile:', error);
      } finally {
        if (!cancelled) setRefreshingUser(false);
      }
    };

    refreshUserProfile();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount
  
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    department: "",
    yearOfStudy: "",
    studentId: "",
    profileImageUrl: "",
    bio: "",
    skills: []
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      console.log('User object in ProfileCompletion:', user);
      console.log('User role:', user.role);
      console.log('User subroles:', user.subroles);
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        department: user.department || "",
        yearOfStudy: user.yearOfStudy || "",
        studentId: user.studentId || "",
        profileImageUrl: user.profileImageUrl || "",
        bio: user.bio || "",
        skills: user.skills || []
      });
    }
  }, [user]);

  const handleProfileInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setProfileError("");
    setProfileMessage("");
  };

  const handlePasswordInputChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    setPasswordError("");
    setPasswordMessage("");
  };

  const handleSkillInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newSkill = e.target.value.trim();
      if (!profileData.skills.includes(newSkill)) {
        setProfileData(prev => ({
          ...prev,
          skills: [...prev.skills, newSkill]
        }));
      }
      e.target.value = '';
    }
  };

  const removeSkill = (skillToRemove) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const isValidPassword = (password) => {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password) && 
           /[!@#$%^&*()_\-.,?":{}|<>]/.test(password);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileError("");
    setProfileMessage("");

    try {
      const payload = {};
      const trimOrNull = (v) => (typeof v === 'string' ? v.trim() : v);
      const stringFields = ['firstName','lastName','studentId','department','phone','bio'];
      stringFields.forEach((key) => {
        const val = trimOrNull(profileData[key]);
        if (val !== undefined && val !== null && val !== '') payload[key] = val;
      });
      const url = trimOrNull(profileData.profileImageUrl);
      if (url) {
        const isHttp = /^https?:\/\//i.test(url);
        const isImage = /(\.png|\.jpg|\.jpeg|\.gif|\.webp)(\?|#|$)/i.test(url);
        if (isHttp && isImage) {
          payload.profileImageUrl = url;
        }
      }
      if (profileData.yearOfStudy !== '' && !Number.isNaN(parseInt(profileData.yearOfStudy))) {
        const y = parseInt(profileData.yearOfStudy);
        if (y >= 1 && y <= 8) payload.yearOfStudy = y;
      }
      if (Array.isArray(profileData.skills) && profileData.skills.length > 0) {
        const uniqueSkills = Array.from(new Set(profileData.skills.map((s) => String(s).trim()))).filter(Boolean);
        if (uniqueSkills.length > 0) payload.skills = uniqueSkills;
      }

      const result = await updateProfile(payload);
      if (result.success) {
        setProfileMessage("Profile updated successfully!");
        setIsEditing(false);
      } else {
        setProfileError(result.error);
      }
    } catch (error) {
      setProfileError(error.message || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!isValidPassword(passwordData.newPassword)) {
      setPasswordError("Password must be at least 8 characters with uppercase, lowercase, number, and special character");
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    setPasswordError("");
    setPasswordMessage("");

    try {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      if (result.success) {
        setPasswordMessage("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        setPasswordError(result.error);
      }
    } catch (error) {
      setPasswordError(error.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return null;
  }

  const displayName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || user.email;

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen bg-[#070b12] text-white overflow-hidden">
        {/* Background visuals */}
        <div className="absolute inset-0">
          <div className="absolute -top-24 -left-10 w-[36rem] h-[36rem] rounded-full bg-red-500/10 blur-3xl" />
          <div className="absolute bottom-[-8rem] right-[-6rem] w-[36rem] h-[36rem] rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="relative container mx-auto px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Profile Settings</h1>
              <p className="text-white/70">Manage your account information and preferences</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Profile Information */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/[0.06] rounded-3xl border border-white/10 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <User2 className="w-5 h-5" />
                    Profile Information
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsEditing((e) => !e)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 text-sm"
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                </div>

                {/* Avatar + Name row */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative h-16 w-16 shrink-0">
                    <img
                      src={profileData.profileImageUrl || '/white logo.png'}
                      alt="Profile"
                      className="h-16 w-16 rounded-full object-cover border border-white/20"
                    />
                    {isEditing && (
                      <div className="absolute -bottom-1 -right-1">
                        <CloudinaryUploader
                          folder="newtonbotics/profile"
                          showPreview={false}
                          maxFileSizeBytes={5 * 1024 * 1024}
                          renderTrigger={({ open }) => (
                            <button
                              type="button"
                              onClick={open}
                              aria-label="Edit profile image"
                              className="h-7 w-7 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg"
                            >
                              ✎
                            </button>
                          )}
                          onUploadComplete={(file) => handleProfileInputChange('profileImageUrl', file.secureUrl)}
                        />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg font-semibold truncate">{displayName}</div>
                    <div className="text-white/60 text-sm truncate">{user.email}</div>
                  </div>
                </div>

                {/* Role and Subroles Section */}
                <div className="mb-4 pb-4 border-b border-white/10">
                  <div className="mb-2">
                    <label className="block text-sm text-white/80 mb-2">Role & Responsibilities</label>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-medium border border-blue-500/30 capitalize">
                        {user.role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Member'}
                      </span>
                      {(() => {
                        // Debug: Log what we're checking
                        console.log('Checking subroles:', {
                          hasSubroles: !!user.subroles,
                          isArray: Array.isArray(user.subroles),
                          length: user.subroles?.length,
                          subroles: user.subroles
                        });
                        
                        const subroles = user.subroles;
                        if (subroles && Array.isArray(subroles) && subroles.length > 0) {
                          return subroles.map((subrole, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-sm font-medium border border-red-500/30 capitalize"
                            >
                              {subrole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          ));
                        }
                        return (
                          <span className="text-white/40 text-sm italic">
                            No subroles assigned
                            {refreshingUser && ' (Refreshing...)'}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="First Name"
                        icon={User2}
                        type="text"
                        placeholder="First name"
                        value={profileData.firstName}
                        onChange={(e) => handleProfileInputChange('firstName', e.target.value)}
                      />
                      <Input 
                        label="Last Name"
                        icon={User2}
                        type="text"
                        placeholder="Last name"
                        value={profileData.lastName}
                        onChange={(e) => handleProfileInputChange('lastName', e.target.value)}
                      />
                    </div>
                  ) : null}

                  {isEditing ? (
                    <Input 
                      label="Email"
                      icon={Mail}
                      type="email"
                      value={user.email}
                      disabled
                      className="opacity-60 cursor-not-allowed"
                    />
                  ) : null}

                  <Input 
                    label="Phone Number"
                    icon={Phone}
                    type="tel"
                    placeholder="Phone number"
                    value={profileData.phone}
                    disabled={!isEditing}
                    onChange={(e) => handleProfileInputChange('phone', e.target.value)}
                  />

                  {/* Optional: Student-specific identifiers */}
                  <Input
                    label="Student ID"
                    icon={User2}
                    type="text"
                    placeholder="Student ID (optional)"
                    value={profileData.studentId}
                    disabled={!isEditing}
                    onChange={(e) => handleProfileInputChange('studentId', e.target.value)}
                  />

                  {user.role === "student" && (
                    <>
                      <Select 
                        label="Department"
                        icon={Building}
                        value={profileData.department}
                        disabled={!isEditing}
                        onChange={(e) => handleProfileInputChange('department', e.target.value)}
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </Select>

                      <Select 
                        label="Year of Study"
                        icon={Calendar}
                        value={profileData.yearOfStudy}
                        disabled={!isEditing}
                        onChange={(e) => handleProfileInputChange('yearOfStudy', e.target.value)}
                      >
                        <option value="">Select Year</option>
                        {[1, 2, 3, 4, 5].map(year => (
                          <option key={year} value={year}>Year {year}</option>
                        ))}
                      </Select>
                    </>
                  )}

                  <div>
                    <label className="block mb-2 text-sm text-white/80">Bio</label>
                    <textarea
                      placeholder="Tell us about yourself..."
                      value={profileData.bio}
                      disabled={!isEditing}
                      onChange={(e) => handleProfileInputChange('bio', e.target.value)}
                      className={`w-full pl-4 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/15 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-sm leading-normal text-white placeholder-white/50 resize-none [font-family:system-ui,Segoe_UI,Roboto,sans-serif] ${!isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm text-white/80">Skills</label>
                    <input
                      type="text"
                      placeholder="Press Enter to add a skill"
                      onKeyDown={isEditing ? handleSkillInput : undefined}
                      disabled={!isEditing}
                      className={`w-full pl-4 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/15 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-sm leading-normal text-white placeholder-white/50 [font-family:system-ui,Segoe_UI,Roboto,sans-serif] ${!isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
                    />
                    {profileData.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm border border-red-500/30"
                          >
                            {skill}
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => removeSkill(skill)}
                                className="ml-1 hover:text-red-100 transition"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {profileError && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {profileError}
                    </div>
                  )}

                  {profileMessage && (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      {profileMessage}
                    </div>
                  )}

                  {isEditing && (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => { setIsEditing(false); if (user) { setProfileData({ firstName: user.firstName || "", lastName: user.lastName || "", phone: user.phone || "", department: user.department || "", yearOfStudy: user.yearOfStudy || "", studentId: user.studentId || "", profileImageUrl: user.profileImageUrl || "", bio: user.bio || "", skills: user.skills || [] }); } }}
                        className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed transition font-semibold flex items-center justify-center gap-2"
                      >
                        {isUpdatingProfile ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </motion.div>

              {/* Change Password */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/[0.06] rounded-3xl border border-white/10 p-6"
              >
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Change Password
                </h2>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <Input 
                    label="Current Password"
                    icon={Lock}
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Current password"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="text-white/60 hover:text-white/80 transition"
                        aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  <Input 
                    label="New Password"
                    icon={Lock}
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-white/60 hover:text-white/80 transition"
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  <Input 
                    label="Confirm New Password"
                    icon={Lock}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-white/60 hover:text-white/80 transition"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  <div className="text-xs text-white/60">
                    Password must contain at least 8 characters with uppercase, lowercase, number, and special character.
                  </div>

                  {passwordError && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {passwordError}
                    </div>
                  )}

                  {passwordMessage && (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      {passwordMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition font-semibold flex items-center justify-center gap-2"
                  >
                    {isChangingPassword ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Changing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Change Password
                      </>
                    )}
                  </button>

                  <Link
                    href="/auth/forgot"
                    className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 transition font-semibold flex items-center justify-center gap-2 text-sm"
                  >
                    Forgot Password?
                  </Link>
                </form>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
