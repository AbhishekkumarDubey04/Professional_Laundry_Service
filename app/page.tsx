"use client";

/**
 * Main application entry point for the Professional Laundry Service.
 * Manages user authentication state, layout shell, and navigation 
 * between different views (Home, Booking, Orders, etc.).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home as HomeIcon, FileText, Star, User, Sparkles } from "lucide-react";
import { cn } from "./lib/utils";
import HomeScreen from "./components/HomeScreen";
import BookingForm from "./components/BookingForm";
import MyOrders from "./components/MyOrders";
import LoginScreen, { UserData } from "./components/LoginScreen";
import AdminDashboard from "./components/AdminDashboard";
import ThemeToggle from "./components/ThemeToggle";
import ProfileView from "./components/ProfileView";

type View = "home" | "book" | "orders" | "offers" | "profile";

/**
 * Reusable navigation item component for the mobile bottom bar.
 */
const NavItem = ({ icon: Icon, label, isActive, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-1.5 px-4 py-2 transition-colors",
      isActive ? "text-[#FF6B00]" : "text-[#8E94A3]"
    )}
  >
    <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
    <span className={cn("text-[13px]", isActive ? "font-semibold" : "font-medium")}>
      {label}
    </span>
  </button>
);

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"customer" | "admin" | "employee" | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [view, setView] = useState<View>("home");
  const [selectedService, setSelectedService] = useState<string>("Ironing");

  /**
   * Handles successful login for both customers and admins.
   * Redirects admins to the dashboard and mocks a WhatsApp welcome message for new users.
   *
   * @param role The role of the logged-in user.
   * @param isNewUser Indicates if this is a first-time signup.
   * @param data User data from login (phone or google details)
   */
  const handleLoginSuccess = (role: "customer" | "admin" | "employee", isNewUser: boolean, data: UserData) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserData(data);
    
    if (role === "admin" || role === "employee") {
      localStorage.setItem("userRole", role);
      router.push("/admin");
      return;
    }

    // Mock sending WhatsApp message for new users
    if (isNewUser) {
      console.log("Mock WhatsApp API: Sending Welcome Message to new user...");
      // In a real app this would call /api/whatsapp/send
      setTimeout(() => alert("WhatsApp Notification:\nWelcome to Professional Laundry Services!"), 500);
      
      // Mock triggering admin notification
      if (role === "customer") {
        localStorage.setItem("mock_new_user", "+91 " + Math.floor(1000000000 + Math.random() * 9000000000));
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex bg-[#F5F5DC] dark:bg-[#0A1128] font-sans text-black dark:text-white transition-colors duration-300">
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </main>
    );
  }

  // If admin or employee, we already redirected in handleLoginSuccess, but just in case:
  if (userRole === "admin" || userRole === "employee") {
    return null;
  }

  return (
    <main className="min-h-screen flex justify-center bg-[#F5F5DC] dark:bg-[#0A1128] font-sans text-black dark:text-white transition-colors duration-300">
      <div className="w-full min-h-screen flex flex-col relative">
        
        {/* Top Navigation (Desktop Only) */}
        <div className="hidden md:flex items-center justify-between px-8 py-4 bg-[#F5F5DC]/80 dark:bg-[#0A1128]/80 backdrop-blur-md border-b border-black/10 dark:border-white/5 sticky top-0 z-50 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-[#FF6B00] to-[#FFA366] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF6B00]/20">
              <Star className="text-white w-6 h-6" fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight">Professional Laundry</span>
          </div>
          
          <div className="flex items-center gap-8">
            <button onClick={() => setView("home")} className={cn("text-base font-medium transition-colors hover:text-[#FF6B00]", view === "home" ? "text-[#FF6B00]" : "text-[#8E94A3]")}>Home</button>
            <button onClick={() => setView("orders")} className={cn("text-base font-medium transition-colors hover:text-[#FF6B00]", view === "orders" ? "text-[#FF6B00]" : "text-[#8E94A3]")}>Orders</button>
            <button onClick={() => setView("offers")} className={cn("text-base font-medium transition-colors hover:text-[#FF6B00]", view === "offers" ? "text-[#FF6B00]" : "text-[#8E94A3]")}>Offers</button>
            <button onClick={() => setView("profile")} className={cn("text-base font-medium transition-colors hover:text-[#FF6B00]", view === "profile" ? "text-[#FF6B00]" : "text-[#8E94A3]")}>Profile</button>
            
            <ThemeToggle />
            <button 
              onClick={() => { setIsAuthenticated(false); setUserRole(null); }}
              className="px-5 py-2 text-base font-semibold rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-black/10 dark:border-white/10"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-[100px] md:pb-0 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {view === "home" && (
                <HomeScreen
                  selectedService={selectedService}
                  onServiceSelect={setSelectedService}
                  onBookClick={() => setView("book")}
                  onLogout={() => { setIsAuthenticated(false); setUserRole(null); }}
                />
              )}

              {view === "book" && (
                <BookingForm
                  selectedService={selectedService}
                  onBack={() => setView("home")}
                  onConfirm={(msg) => {
                    const encoded = encodeURIComponent(msg);
                    router.push(`/booking-confirmed?msg=${encoded}`);
                  }}
                />
              )}

              {view === "orders" && <MyOrders onBack={() => setView("home")} />}

              {view === "profile" && (
                <ProfileView userData={userData} />
              )}
              
              {view === "offers" && (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center h-[50vh]">
                  <div className="w-16 h-16 bg-[#FF6B00]/10 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-[#FF6B00]" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Coming Soon!</h3>
                  <p className="text-[#8E94A3] text-sm max-w-xs mx-auto">
                    We're working hard to bring you exciting new features. Stay tuned!
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation Bar (Mobile Only) */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 h-[80px] bg-[#F5F5DC]/95 dark:bg-[#0A1128]/95 backdrop-blur-md flex justify-around items-center pb-4 pt-2 border-t border-black/10 dark:border-white/5 z-50 transition-colors">
          <NavItem icon={HomeIcon} label="Home" isActive={view === "home"} onClick={() => setView("home")} />
          <NavItem icon={FileText} label="Orders" isActive={view === "orders"} onClick={() => setView("orders")} />
          <NavItem icon={Star} label="Offers" isActive={view === "offers"} onClick={() => setView("offers")} />
          <NavItem icon={User} label="Profile" isActive={view === "profile"} onClick={() => setView("profile")} />
        </div>

      </div>
    </main>
  );
}
