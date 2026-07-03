"use client";

import { useState, useEffect } from "react";
import { UserData } from "./LoginScreen";
import { User, Mail, Phone, MapPin, Building, Hash, Loader2, Save } from "lucide-react";
import { cn } from "../lib/utils";

interface ProfileViewProps {
  userData: UserData | null;
}

export default function ProfileView({ userData }: ProfileViewProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [society, setSociety] = useState("");
  const [block, setBlock] = useState("");
  const [flat, setFlat] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Initialize locked values
  const isPhoneLocked = userData?.type === "phone";
  const isGoogleLocked = userData?.type === "google";

  useEffect(() => {
    if (userData?.type === "phone") {
      setPhone(userData.phone);
    } else if (userData?.type === "google") {
      setEmail(userData.email);
      setName(userData.name);
    }

    // Fetch existing details from API if we have a phone number
    const fetchExisting = async () => {
      const searchPhone = userData?.type === "phone" ? userData.phone : "";
      if (!searchPhone) return;

      try {
        const res = await fetch(`/api/customer?phone=${encodeURIComponent(searchPhone)}`);
        const data = await res.json();
        if (data.customer) {
          setName(data.customer.customer_name || name);
          setSociety(data.customer.society_name || "");
          setBlock(data.customer.block || "");
          setFlat(data.customer.flat_number || "");
        }
      } catch (err) {
        console.error("Failed to load customer profile:", err);
      }
    };

    fetchExisting();
  }, [userData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/customer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          society,
          block,
          flat,
          type: userData?.type // Pass login type for backend handling
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");
      setMessage({ text: "Profile updated successfully!", type: "success" });
    } catch (err) {
      setMessage({ text: "Failed to update profile. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 text-black dark:text-white max-w-2xl mx-auto pb-24">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <User className="w-6 h-6 text-[#FF6B00]" />
        Your Profile
      </h2>

      {message && (
        <div className={cn(
          "mb-6 p-4 rounded-lg text-sm font-medium",
          message.type === "success" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        )}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#333]">
        {/* Personal Details */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-[#8E94A3]">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isGoogleLocked}
                  className={cn(
                    "block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#222] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]",
                    isGoogleLocked && "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-black"
                  )}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isGoogleLocked}
                  className={cn(
                    "block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#222] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]",
                    isGoogleLocked && "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-black"
                  )}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  disabled={isPhoneLocked}
                  className={cn(
                    "block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#222] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]",
                    isPhoneLocked && "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-black"
                  )}
                  placeholder="10-digit number"
                  maxLength={10}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address Details */}
        <div className="pt-4 border-t border-gray-100 dark:border-[#333]">
          <h3 className="text-lg font-semibold mb-4 text-[#8E94A3]">Delivery Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Society Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={society}
                  onChange={(e) => setSociety(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#222] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                  placeholder="e.g. Prestige Lakeside"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Block / Wing (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#222] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                  placeholder="e.g. Tower B"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Flat / Villa Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={flat}
                  onChange={(e) => setFlat(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#222] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                  placeholder="e.g. 404"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#FF6B00] text-white py-3 px-4 rounded-xl font-bold hover:bg-[#e66000] transition-colors disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Update Profile
        </button>
      </form>
    </div>
  );
}
