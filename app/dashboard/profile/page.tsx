/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../Sidebar";
import { Menu, X, User, Lock } from "lucide-react";
import Navbar1 from "../../components/Navbar1";
import TopBar from "../../components/TopBar";
import Footer from "../../components/Footer";
import supabaseClient from "@/lib/supabaseClient";
import toast from "react-hot-toast";

function passwordIssues(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters long";
  if (!/[A-Z]/.test(pw))
    return "Password must include at least one uppercase letter";
  if (!/[a-z]/.test(pw))
    return "Password must include at least one lowercase letter";
  if (!/[0-9]/.test(pw))
    return "Password must include at least one number";
  return null;
}

export default function ProfilePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [isSavingName, setIsSavingName] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", session.user.id)
        .single();

      if (error) {
        toast.error("Failed to load profile");
      } else if (profile) {
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
      }
      setEmail(session.user.email || "");
      setIsLoading(false);
    };

    fetchProfile();
  }, [router]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingName(true);
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { error } = await supabaseClient
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
        })
        .eq("id", session.user.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const pwIssue = passwordIssues(newPassword);
    if (pwIssue) {
      toast.error(pwIssue);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (!oldPassword.trim()) {
      toast.error("Please enter your current password");
      return;
    }

    setIsSavingPassword(true);
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session?.user?.email) {
        toast.error("Session expired. Please log in again.");
        router.push("/login");
        return;
      }

      // Verify old password by signing in
      const { error: signInError } =
        await supabaseClient.auth.signInWithPassword({
          email: session.user.email,
          password: oldPassword,
        });

      if (signInError) {
        toast.error("Current password is incorrect");
        return;
      }

      // Update to new password
      const { error: updateError } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast.success("Password updated successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleChange = async (key: string) => {
    if (key === "sign-out") {
      await supabaseClient.auth.signOut();
      router.push("/login");
    } else {
      router.push(
        `/dashboard${key !== "home" ? `/${key.replace("-", "-")}` : ""}`,
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#e4e9ee] text-foreground">
        <TopBar />
        <Navbar1 />
        <div className="flex flex-1 items-center justify-center py-24">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-[#F87D1F]"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e4e9ee] text-foreground">
      <TopBar />
      <Navbar1 />

      <div className="md:hidden sticky top-0 z-30 bg-[#e4e9ee]/80 backdrop-blur supports-[backdrop-filter]:bg-[#e4e9ee]/60">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm active:scale-[0.98]"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            Menu
          </button>
          <span className="text-base font-semibold text-gray-900">Profile</span>
        </div>
      </div>

      <div className="max-w-[1200px] w-full mx-auto flex gap-6 py-4 md:py-6 px-4 md:px-6">
        <div className="hidden md:block md:shrink-0">
          <Sidebar activeKey="profile" onChange={handleChange} />
        </div>

        {mobileOpen && (
          <div className="md:hidden">
            <div
              className="fixed inset-0 z-40 bg-black/40"
              aria-hidden
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85%] p-2">
              <div className="rounded-xl bg-white shadow-2xl ring-1 ring-black/10 h-full overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <span className="text-base font-semibold text-gray-900">
                    Menu
                  </span>
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="inline-flex rounded-md border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-2">
                  <Sidebar
                    activeKey="profile"
                    onChange={(key) => {
                      handleChange(key);
                      setMobileOpen(false);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col gap-6">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
            Profile Settings
          </h1>

          {/* Update name */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-4 md:p-5 lg:p-6">
            <div className="flex items-center gap-2 mb-6">
              <User className="h-5 w-5 text-[#F87D1F]" />
              <h2 className="text-lg font-semibold text-gray-900">
                Personal Information
              </h2>
            </div>
            <form onSubmit={handleSaveName} className="space-y-4 max-w-md">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed
                </p>
              </div>
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F87D1F] focus:border-[#F87D1F]"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F87D1F] focus:border-[#F87D1F]"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingName}
                className="px-6 py-2.5 bg-[#F87D1F] hover:bg-[#e06b10] text-white font-medium rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isSavingName ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          {/* Update password */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-4 md:p-5 lg:p-6">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="h-5 w-5 text-[#F87D1F]" />
              <h2 className="text-lg font-semibold text-gray-900">
                Change Password
              </h2>
            </div>
            <form
              onSubmit={handleUpdatePassword}
              className="space-y-4 max-w-md"
            >
              <div>
                <label
                  htmlFor="oldPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Current Password
                </label>
                <input
                  id="oldPassword"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F87D1F] focus:border-[#F87D1F] placeholder-gray-400"
                />
              </div>
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F87D1F] focus:border-[#F87D1F] placeholder-gray-400"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Min 8 chars, include upper, lower, and number
                </p>
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F87D1F] focus:border-[#F87D1F] placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                disabled={
                  isSavingPassword ||
                  !oldPassword ||
                  !newPassword ||
                  !confirmPassword
                }
                className="px-6 py-2.5 bg-[#F87D1F] hover:bg-[#e06b10] text-white font-medium rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isSavingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
