"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import { Pencil, X } from "lucide-react";
import ProtectedRoute from "../../components/ProtectedRoute";
import CloudinaryUploader from "../../components/CloudinaryUploader";
import RemoteImage from "@/components/RemoteImage";
import {
  Alert,
  Field,
  PasswordChecklist,
  PasswordField,
  SelectField,
  SubmitButton,
  TextField,
  passwordRules,
} from "../auth/components/AuthFields";
import { titleCase } from "@/lib/labUi";
import {
  OTHER_ACADEMIC_YEAR,
  PASSING_YEARS,
  passingYearOptionLabel,
  passingYearToYearOfStudy,
  passingYearToAcademicStartYear,
  yearOfStudyToPassingYear,
} from "@/lib/academicYear";

const departments = [
  "Computer Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Robotics Engineering",
  "Artificial Intelligence",
  "Data Science",
  "Other"
];

// Mirrors the server's User.profileCompletion virtual (used when the user object lacks it).
const COMPLETION_FIELDS = [
  { key: "firstName", label: "first name" },
  { key: "lastName", label: "last name" },
  { key: "email", label: "email" },
  { key: "department", label: "department" },
  { key: "yearOfStudy", label: "academic year" },
  { key: "bio", label: "bio" },
  { key: "skills", label: "skills" },
];

const isFilled = (v) => (Array.isArray(v) ? v.length > 0 : Boolean(v));

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

function AccountRow({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[13px] text-ink-muted">{label}</span>
      <span className="break-all text-sm font-semibold">{children}</span>
    </div>
  );
}

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

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [academicYearChanged, setAcademicYearChanged] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        department: user.department || "",
        yearOfStudy: yearOfStudyToPassingYear(user.yearOfStudy) || "",
        studentId: user.studentId || "",
        profileImageUrl: user.profileImageUrl || "",
        bio: user.bio || "",
        skills: user.skills || []
      });
    }
  }, [user]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [profileData.profileImageUrl]);

  const handleProfileInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (field === 'yearOfStudy') setAcademicYearChanged(true);
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
    setProfileError("");
    setProfileMessage("");

    if (user.role === "student" && academicYearChanged) {
      const yearOfStudy = passingYearToYearOfStudy(profileData.yearOfStudy);
      const academicStartYear = passingYearToAcademicStartYear(profileData.yearOfStudy);
      if (!yearOfStudy || yearOfStudy > 4 || !academicStartYear) {
        setProfileError("Select a valid academic year (Year 1 through Year 4)");
        return;
      }
    }

    setIsUpdatingProfile(true);

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
      if (profileData.yearOfStudy && profileData.yearOfStudy !== OTHER_ACADEMIC_YEAR) {
        const yearOfStudy = passingYearToYearOfStudy(profileData.yearOfStudy);
        if (yearOfStudy) {
          payload.yearOfStudy = yearOfStudy;
          if (academicYearChanged) {
            payload.academicStartYear = passingYearToAcademicStartYear(profileData.yearOfStudy);
          }
        }
      }
      if (Array.isArray(profileData.skills) && profileData.skills.length > 0) {
        const uniqueSkills = Array.from(new Set(profileData.skills.map((s) => String(s).trim()))).filter(Boolean);
        if (uniqueSkills.length > 0) payload.skills = uniqueSkills;
      }

      const result = await updateProfile(payload);
      if (result.success) {
        setProfileMessage("Profile updated successfully!");
        setIsEditing(false);
        setAcademicYearChanged(false);
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

  const cancelEditing = () => {
    setIsEditing(false);
    setAcademicYearChanged(false);
    if (user) {
      setProfileData({ firstName: user.firstName || "", lastName: user.lastName || "", phone: user.phone || "", department: user.department || "", yearOfStudy: yearOfStudyToPassingYear(user.yearOfStudy) || "", studentId: user.studentId || "", profileImageUrl: user.profileImageUrl || "", bio: user.bio || "", skills: user.skills || [] });
    }
  };

  if (!user) {
    return null;
  }

  const displayName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || user.email;
  const missing = COMPLETION_FIELDS.filter((f) => !isFilled(user[f.key]));
  const completion =
    typeof user.profileCompletion === "number"
      ? user.profileCompletion
      : Math.round(((COMPLETION_FIELDS.length - missing.length) / COMPLETION_FIELDS.length) * 100);
  const subroles = Array.isArray(user.subroles) ? user.subroles : [];
  const roleLabel = titleCase(user.role) || "Member";
  const metaLine = [roleLabel, user.department, user.studentId].filter(Boolean).join(" · ");
  const showAvatarImage = profileData.profileImageUrl && !avatarFailed;
  const disabledCls = "disabled:cursor-not-allowed disabled:bg-paper disabled:text-ink-muted";
  const newPasswordRules = passwordRules(passwordData.newPassword);

  return (
    <ProtectedRoute>
      <main className="nb-dark bg-paper text-ink">
        <div className="nb-container flex flex-col gap-6 pb-24 pt-10 sm:pt-12">
          <section className="nb-card overflow-hidden">
            <div className="nb-blueprint-dark h-[120px]" aria-hidden="true" />
            <div className="flex flex-wrap items-end justify-between gap-6 px-5 pb-7 sm:px-8">
              <div className="flex min-w-0 flex-wrap items-end gap-5">
                <div className="relative -mt-14 h-28 w-28 shrink-0">
                  {showAvatarImage ? (
                    <RemoteImage
                      src={profileData.profileImageUrl}
                      alt="Profile photo"
                      width={112}
                      height={112}
                      className="h-28 w-28 rounded-lg border-4 border-surface bg-surface object-cover"
                      onError={() => setAvatarFailed(true)}
                    />
                  ) : (
                    <span className="grid h-28 w-28 place-items-center rounded-lg border-4 border-surface bg-signal font-display text-4xl font-semibold text-ink">
                      {initials(displayName)}
                    </span>
                  )}
                  {isEditing && (
                    <div className="absolute -bottom-2 -right-2">
                      <CloudinaryUploader
                        folder="newtonbotics/profile"
                        showPreview={false}
                        maxFileSizeBytes={5 * 1024 * 1024}
                        renderTrigger={({ open }) => (
                          <button
                            type="button"
                            onClick={open}
                            aria-label="Change profile photo"
                            className="grid h-11 w-11 place-items-center rounded-full border-2 border-surface bg-ink text-paper hover:bg-[#23272E]"
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                        )}
                        onUploadComplete={(file) => handleProfileInputChange('profileImageUrl', file.secureUrl)}
                      />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <h1 className="m-0 break-words font-display text-[30px] font-semibold leading-tight tracking-[-0.02em]">
                    {displayName}
                  </h1>
                  <span className="font-mono text-xs uppercase tracking-[0.04em] text-ink-muted">{metaLine}</span>
                </div>
              </div>
              <div className="flex min-w-[240px] flex-[0_1_320px] flex-col gap-2">
                <span className="flex justify-between gap-3 text-[13px]">
                  <span className="font-semibold">Profile {completion}% complete</span>
                  <span className="font-mono text-ink-muted">
                    {COMPLETION_FIELDS.length - missing.length} / {COMPLETION_FIELDS.length}
                  </span>
                </span>
                <span
                  className="h-1.5 overflow-hidden rounded-[3px] bg-[#E6E7E1]"
                  role="progressbar"
                  aria-label="Profile completion"
                  aria-valuenow={completion}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span className="block h-full bg-signal" style={{ width: `${completion}%` }} />
                </span>
                {missing.length > 0 && (
                  <span className="text-[13px] text-ink-muted">
                    Add your {missing.map((f) => f.label).join(", ")} to complete your profile.
                  </span>
                )}
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-start gap-6">
            <form
              onSubmit={handleProfileUpdate}
              className="nb-card flex min-w-0 flex-[999_1_480px] flex-col gap-[22px] p-5 sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="m-0 font-display text-xl font-semibold">Personal details</h2>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => { setAcademicYearChanged(false); setIsEditing(true); }}
                    className="nb-btn nb-btn-secondary nb-btn-sm h-11"
                  >
                    <Pencil size={16} aria-hidden="true" /> Edit
                  </button>
                )}
              </div>

              {isEditing && (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                  <TextField
                    id="pf-first"
                    label="First name"
                    type="text"
                    placeholder="First name"
                    value={profileData.firstName}
                    onChange={(e) => handleProfileInputChange('firstName', e.target.value)}
                  />
                  <TextField
                    id="pf-last"
                    label="Last name"
                    type="text"
                    placeholder="Last name"
                    value={profileData.lastName}
                    onChange={(e) => handleProfileInputChange('lastName', e.target.value)}
                  />
                </div>
              )}

              {isEditing && (
                <TextField
                  id="pf-email"
                  label="Email"
                  type="email"
                  value={user.email}
                  disabled
                  hint="Email can't be changed."
                  className={`nb-input ${disabledCls}`}
                />
              )}

              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                <TextField
                  id="pf-phone"
                  label="Phone number"
                  type="tel"
                  placeholder="Phone number"
                  value={profileData.phone}
                  disabled={!isEditing}
                  className={`nb-input ${disabledCls}`}
                  onChange={(e) => handleProfileInputChange('phone', e.target.value)}
                />
                <TextField
                  id="pf-student-id"
                  label="Student ID"
                  optional
                  type="text"
                  placeholder="Student ID"
                  value={profileData.studentId}
                  disabled={!isEditing}
                  className={`nb-input ${disabledCls}`}
                  onChange={(e) => handleProfileInputChange('studentId', e.target.value)}
                />

                {user.role === "student" && (
                  <>
                    <SelectField
                      id="pf-dept"
                      label="Department"
                      value={profileData.department}
                      disabled={!isEditing}
                      className={`nb-input pr-8 ${disabledCls}`}
                      onChange={(e) => handleProfileInputChange('department', e.target.value)}
                    >
                      <option value="">Select department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </SelectField>

                    <SelectField
                      id="pf-year"
                      label="Academic year"
                      required={academicYearChanged}
                      value={profileData.yearOfStudy}
                      disabled={!isEditing}
                      className={`nb-input pr-8 ${disabledCls}`}
                      onChange={(e) => handleProfileInputChange('yearOfStudy', e.target.value)}
                    >
                      <option value="">Select passing year</option>
                      {PASSING_YEARS.map(year => (
                        <option key={year} value={year}>{passingYearOptionLabel(year)}</option>
                      ))}
                      {profileData.yearOfStudy &&
                        profileData.yearOfStudy !== OTHER_ACADEMIC_YEAR &&
                        !PASSING_YEARS.includes(Number(profileData.yearOfStudy)) && (
                        <option value={profileData.yearOfStudy}>{profileData.yearOfStudy}</option>
                      )}
                      <option value={OTHER_ACADEMIC_YEAR}>Other (other branch / programme)</option>
                    </SelectField>
                  </>
                )}
              </div>

              <Field id="pf-bio" label="Short bio">
                <textarea
                  id="pf-bio"
                  placeholder="Tell us about yourself…"
                  value={profileData.bio}
                  disabled={!isEditing}
                  onChange={(e) => handleProfileInputChange('bio', e.target.value)}
                  className={`nb-textarea resize-y ${disabledCls}`}
                  rows={3}
                />
              </Field>

              <div
                className={`flex flex-col gap-2.5 rounded-lg p-4 ${
                  profileData.skills.length === 0
                    ? "border border-dashed border-signal bg-[#FFF7F3]"
                    : "border border-line"
                }`}
              >
                <label htmlFor="pf-skill" className="nb-label">
                  Skills
                  {profileData.skills.length === 0 && (
                    <span className="ml-1 font-mono text-[11px] font-medium uppercase text-signal-hover">· Missing</span>
                  )}
                </label>
                <input
                  id="pf-skill"
                  type="text"
                  placeholder={isEditing ? "e.g. Arduino, ROS 2, CAD — press Enter to add" : "Click Edit to add skills"}
                  onKeyDown={isEditing ? handleSkillInput : undefined}
                  disabled={!isEditing}
                  className={`nb-input h-11 ${disabledCls}`}
                />
                {profileData.skills.length > 0 && (
                  <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                    {profileData.skills.map((skill, index) => (
                      <li
                        key={index}
                        className="inline-flex items-center gap-1 rounded border border-line bg-surface py-1 pl-2.5 pr-1 font-mono text-xs"
                      >
                        <span className={isEditing ? "" : "pr-1.5"}>{skill}</span>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            aria-label={`Remove ${skill}`}
                            className="grid h-7 w-7 place-items-center rounded text-ink-muted hover:bg-paper hover:text-ink"
                          >
                            <X size={14} aria-hidden="true" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Alert tone="error">{profileError}</Alert>
              <Alert tone="success">{profileMessage}</Alert>

              {isEditing && (
                <div className="flex flex-wrap justify-end gap-2 border-t border-line-soft pt-5">
                  <button type="button" onClick={cancelEditing} className="nb-btn nb-btn-ghost">
                    Cancel
                  </button>
                  <SubmitButton loading={isUpdatingProfile} loadingText="Saving…" className="h-12 w-auto">
                    Save changes
                  </SubmitButton>
                </div>
              )}
            </form>

            <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
              <div className="nb-card flex flex-col gap-3.5 p-6">
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted">Account</span>
                <AccountRow label="Email">{user.email}</AccountRow>
                <AccountRow label="Role">{roleLabel}</AccountRow>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] text-ink-muted">Responsibilities</span>
                  {subroles.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {subroles.map((subrole, idx) => (
                        <span key={idx} className="nb-chip nb-chip-outline">
                          {titleCase(subrole)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-ink-muted">
                      No subroles assigned
                      {refreshingUser && " (refreshing…)"}
                    </span>
                  )}
                </div>
                <Link href="/my-activity" className="nb-link text-sm">
                  View my activity →
                </Link>
              </div>

              <form onSubmit={handlePasswordChange} className="nb-card flex flex-col gap-4 p-6">
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted">Change password</span>
                <PasswordField
                  id="pw-current"
                  label="Current password"
                  placeholder="Current password"
                  autoComplete="current-password"
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                />
                <PasswordField
                  id="pw-new"
                  label="New password"
                  placeholder="New password"
                  autoComplete="new-password"
                  aria-describedby="pw-rules"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                />
                <PasswordChecklist id="pw-rules" rules={newPasswordRules} />
                <PasswordField
                  id="pw-confirm"
                  label="Confirm new password"
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                />

                <Alert tone="error">{passwordError}</Alert>
                <Alert tone="success">{passwordMessage}</Alert>

                <SubmitButton loading={isChangingPassword} loadingText="Changing…" className="h-12">
                  Change password
                </SubmitButton>
                <Link href="/auth/forgot" className="nb-link self-start text-sm">
                  Forgot your password?
                </Link>
              </form>
            </aside>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
