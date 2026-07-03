"use client";

import { motion } from "framer-motion";
import { Users, Bell, Search, CheckCircle, LogOut } from "lucide-react";
import { useState, useEffect } from "react";

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  // In a real app, fetch these from Supabase admin_notifications
  const [notifications, setNotifications] = useState([
    { id: 1, text: "New user signed up: +91 9876543210", time: "2 mins ago", isRead: false },
    { id: 2, text: "New user signed up: +91 8765432109", time: "1 hour ago", isRead: true },
  ]);

  // Simulate receiving a new notification if a new user just signed up before admin logged in
  useEffect(() => {
    const hasNewMockUser = localStorage.getItem("mock_new_user");
    if (hasNewMockUser) {
      setNotifications(prev => [
        { id: Date.now(), text: `New user signed up: ${hasNewMockUser}`, time: "Just now", isRead: false },
        ...prev
      ]);
      localStorage.removeItem("mock_new_user");
    }
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-col h-full bg-[#F5F5DC] dark:bg-[#0A1128] text-black dark:text-white">
      {/* Header */}
      <div className="flex justify-between items-center p-6 pb-2">
        <div>
          <h1 className="text-xl font-bold">Admin Portal</h1>
          <p className="text-gray-600 dark:text-[#8E94A3] text-xs font-medium">Manage users and notifications</p>
        </div>
        <button onClick={onLogout} className="p-2 rounded-full bg-red-500/10 text-red-500">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-[#131B2F] p-4 rounded-2xl border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-gray-600 dark:text-[#8E94A3] text-xs font-bold uppercase">Total Users</span>
            </div>
            <div className="text-2xl font-extrabold">1,248</div>
          </div>
          <div className="bg-white dark:bg-[#131B2F] p-4 rounded-2xl border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                <Bell className="w-5 h-5" />
              </div>
              <span className="text-gray-600 dark:text-[#8E94A3] text-xs font-bold uppercase">New Alerts</span>
            </div>
            <div className="text-2xl font-extrabold">{unreadCount}</div>
          </div>
        </div>

        {/* Notifications */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Recent Notifications</h2>
          <button onClick={markAllRead} className="text-[#FF6B00] text-xs font-bold">Mark all read</button>
        </div>

        <div className="flex flex-col gap-3">
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border ${notif.isRead ? 'bg-white dark:bg-[#131B2F] border-transparent' : 'bg-[#FF6B00]/5 border-[#FF6B00]/20'} flex items-start gap-3`}
            >
              <div className={`mt-0.5 ${notif.isRead ? 'text-gray-600 dark:text-[#8E94A3]' : 'text-[#FF6B00]'}`}>
                {notif.isRead ? <CheckCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </div>
              <div>
                <p className={`text-sm ${notif.isRead ? 'text-black dark:text-white/80' : 'text-black dark:text-white font-medium'}`}>{notif.text}</p>
                <p className="text-[10px] text-gray-600 dark:text-[#8E94A3] mt-1">{notif.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
