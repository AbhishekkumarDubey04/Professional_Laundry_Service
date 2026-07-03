"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, ShieldCheck, Star, Sparkles } from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: (role: "customer" | "admin" | "employee", isNewUser: boolean) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = () => {
    if (mobile.length < 10) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("otp");
    }, 800);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess("customer", false);
    }, 1500);
  };

  const handleVerifyOtp = () => {
    if (otp.length < 4) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      let role: "customer" | "admin" | "employee" = "customer";
      if (mobile === "9999999999") role = "admin";
      else if (mobile === "8888888888") role = "employee";
      
      const isNewUser = !mobile.endsWith("00");
      onLoginSuccess(role, isNewUser);
    }, 800);
  };

  return (
    <div className="w-full flex min-h-screen relative overflow-hidden bg-[#F5F5DC] dark:bg-[#0A1128]">

      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#FF6B00]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Left side: Branding (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col flex-1 p-16 justify-center relative z-10">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-gradient-to-tr from-[#FF6B00] to-[#FFA366] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF6B00]/20">
              <Star className="text-black dark:text-white w-7 h-7" fill="currentColor" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-black dark:text-white">Professional Laundry Services</span>
          </div>

          <h1 className="text-6xl font-extrabold text-black dark:text-white leading-[1.1] mb-6 tracking-tight">
            Premium fabric care,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-[#FFB080]">delivered...</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-[#8E94A3] font-medium leading-relaxed mb-12">
            Experience the highest quality ironing, washing, and dry cleaning services with free pickup and on-time delivery right to your door.
          </p>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#FF6B00]" />
              </div>
              <span className="text-sm font-semibold text-black dark:text-white/80">Secure & Safe</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm font-semibold text-black dark:text-white/80">Premium Quality</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Login Card */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 relative z-10">
        <div className="w-full max-w-md bg-white/80 dark:bg-[#131B2F]/80 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">

          {/* Card Top Highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF6B00] to-[#FFA366]"></div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="lg:hidden flex justify-center items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-gradient-to-tr from-[#FF6B00] to-[#FFA366] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF6B00]/20">
                <Star className="text-black dark:text-white w-6 h-6" fill="currentColor" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-black dark:text-white tracking-tight mb-2">Welcome Back</h2>
            <p className="text-sm text-gray-600 dark:text-[#8E94A3] font-medium">Log in or sign up to continue</p>
          </motion.div>

          <AnimatePresence mode="wait">
            {step === "mobile" && (
              <motion.div
                key="mobile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                <label className="text-xs font-bold text-gray-600 dark:text-[#8E94A3] uppercase tracking-wider mb-2 block ml-2">
                  Mobile Number
                </label>
                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-gray-600 dark:text-[#8E94A3]" />
                  </div>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full bg-[#F5F5DC] dark:bg-[#0A1128] border-2 border-transparent focus:border-[#FF6B00] rounded-2xl py-4 pl-14 pr-4 text-black dark:text-white font-semibold text-lg outline-none transition-all placeholder:text-black dark:text-white/20 shadow-inner"
                    placeholder="Enter 10-digit number"
                  />
                </div>

                <div className="flex flex-col gap-4 mt-8">
                  <button
                    onClick={handleSendOtp}
                    disabled={mobile.length < 10 || isLoading}
                    className="w-full bg-gradient-to-r from-[#F05F00] to-[#FF7B1A] text-black dark:text-white py-4 rounded-xl text-[15px] font-bold shadow-[0_4px_14px_rgba(255,107,0,0.4)] disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2"
                  >
                    {isLoading ? "Please wait..." : "Continue"}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center my-8">
                  <div className="flex-1 border-t border-black/10 dark:border-white/10"></div>
                  <span className="px-4 text-xs font-bold text-gray-600 dark:text-[#8E94A3]">OR</span>
                  <div className="flex-1 border-t border-black/10 dark:border-white/10"></div>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full bg-[#F5F5DC] dark:bg-[#0A1128] border-2 border-black/10 dark:border-white/10 hover:border-black/30 dark:border-white/30 text-black dark:text-white py-4 rounded-xl text-[15px] font-bold transition-all disabled:opacity-50 flex justify-center items-center gap-3"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                <label className="text-xs font-bold text-gray-600 dark:text-[#8E94A3] uppercase tracking-wider mb-2 block ml-2">
                  Enter OTP
                </label>
                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <ShieldCheck className="w-5 h-5 text-gray-600 dark:text-[#8E94A3]" />
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-[#F5F5DC] dark:bg-[#0A1128] border-2 border-transparent focus:border-[#FF6B00] rounded-2xl py-4 pl-14 pr-4 text-black dark:text-white font-bold text-2xl tracking-[0.4em] outline-none transition-all placeholder:text-black dark:text-white/20 shadow-inner text-center"
                    placeholder="------"
                  />
                </div>
                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.length < 4 || isLoading}
                  className="w-full bg-gradient-to-r from-[#F05F00] to-[#FF7B1A] text-black dark:text-white py-4 rounded-xl text-[15px] font-bold shadow-[0_4px_14px_rgba(255,107,0,0.4)] disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2 mt-8"
                >
                  {isLoading ? "Verifying..." : "Verify & Login"}
                </button>

                <div className="flex justify-between items-center mt-8 px-2">
                  <button onClick={() => setStep("mobile")} className="text-xs font-semibold text-gray-600 dark:text-[#8E94A3] hover:text-black dark:text-white transition-colors">
                    Change Number
                  </button>
                  <button className="text-xs font-semibold text-[#FF6B00] hover:text-[#FFA366] transition-colors">
                    Resend OTP
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Mock instructions */}
        <div className="text-center mt-8 text-xs text-black dark:text-white/30 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-white/5 max-w-md w-full">
          <strong>Testing?</strong> Any 10 digits works.<br />
          Use <code>9999999999</code> for Admin role.<br />
          Use <code>8888888888</code> for Employee role.<br />
          Numbers ending in '00' are existing users.
        </div>
      </div>
    </div>
  );
}
