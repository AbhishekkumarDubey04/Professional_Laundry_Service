"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, Clock, Package, Wind, Calendar, ChevronRight, PhoneCall, MessageCircle, HelpCircle } from "lucide-react";
import { cn } from "../lib/utils";

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isSelected: boolean;
  onClick: () => void;
}

function ServiceCard({ icon, title, subtitle, isSelected, onClick }: ServiceCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "flex flex-col p-8 rounded-3xl cursor-pointer transition-all duration-300 border backdrop-blur-md shadow-xl",
        isSelected
          ? "bg-gradient-to-br from-white dark:from-[#131B2F] to-gray-50 dark:to-[#1E293B] border-[#FF6B00] shadow-[#FF6B00]/20"
          : "bg-white/80 dark:bg-white dark:bg-[#131B2F]/80 border-black/5 dark:border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-[#1E293B]"
      )}
    >
      <div
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors shadow-lg",
          isSelected ? "text-white bg-gradient-to-tr from-[#FF6B00] to-[#FFA366]" : "text-[#FF6B00] bg-white/5"
        )}
      >
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold text-black dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-[#8E94A3] font-medium leading-relaxed">{subtitle}</p>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <span className={cn("text-xs font-bold uppercase tracking-wider", isSelected ? "text-[#FF6B00]" : "text-black/50 dark:text-white/50")}>
          {isSelected ? "Booking..." : "Book Now"}
        </span>
        <ChevronRight className={cn("w-5 h-5", isSelected ? "text-[#FF6B00]" : "text-black/50 dark:text-white/50")} />
      </div>
    </motion.div>
  );
}

// Icons
const IronIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14v-2c0-1.7 1.3-3 3-3h9l2-2h2v7H4z" />
    <path d="M4 14h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
    <path d="M7 9a2 2 0 110-4 2 2 0 010 4z" />
  </svg>
);

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function HomeScreen(props: {
  selectedService: string;
  onServiceSelect: (service: string) => void;
  onBookClick: () => void;
  onLogout?: () => void;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <section className="relative pt-16 pb-12 overflow-hidden border-b border-black/5 dark:border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#FF6B00]/20 via-[#F5F5DC] dark:via-[#0A1128] to-[#F5F5DC] dark:to-[#0A1128] -z-10"></div>
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-[#FF6B00]/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="z-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 mb-8 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
              <span className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Accepting new orders in your area</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-black dark:text-white leading-[1.1] mb-6 tracking-tight">
              Premium care<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-[#FFB080]">for every fabric.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 dark:text-[#8E94A3] leading-relaxed font-medium mb-10 max-w-lg">
              Experience the highest quality ironing, washing, and dry cleaning services with free pickup and on-time delivery right to your door.
            </p>

            <div className="flex flex-wrap items-center gap-6 mb-12">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#FF6B00]/10 text-[#FF6B00]">
                  <ShieldCheck className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <span className="text-sm text-black/90 dark:text-white/90 font-bold">Premium Quality</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Sparkles className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <span className="text-sm text-black/90 dark:text-white/90 font-bold">Hygienic Clean</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                  <Clock className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <span className="text-sm text-black/90 dark:text-white/90 font-bold">On-time Delivery</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-gradient-to-r from-[#F05F00] to-[#FF7B1A] text-white text-lg font-bold shadow-[0_10px_40px_rgba(255,107,0,0.4)] transition-all"
            >
              <Calendar className="w-6 h-6" />
              Book a Pickup Now
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, type: "spring", bounce: 0.4 }}
            className="hidden md:flex justify-center relative z-10"
          >
             <img src="/washing_machine_hero.png" alt="Professional Laundry" className="w-[120%] max-w-[800px] h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] -mr-20" />
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-12 bg-[#F5F5DC] dark:bg-[#0A1128] relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-extrabold text-black dark:text-white tracking-tight mb-4">Our Services</h2>
            <p className="text-gray-600 dark:text-[#8E94A3] text-lg max-w-2xl mx-auto">Select a service below to start building your order. We handle everything from everyday wear to delicate fabrics.</p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.div variants={itemVariants} className="h-full">
              <ServiceCard
                icon={<IronIcon />}
                title="Ironing"
                subtitle="Crisp, neat, and perfectly pressed everyday wear."
                isSelected={props.selectedService === "Ironing"}
                onClick={() => {
                  props.onServiceSelect("Ironing");
                  props.onBookClick();
                }}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="h-full">
              <ServiceCard
                icon={<Sparkles className="w-8 h-8" strokeWidth={2} />}
                title="Wash & Iron"
                subtitle="Deep cleaned and perfectly pressed for immediate wear."
                isSelected={props.selectedService === "Washing & Ironing"}
                onClick={() => {
                  props.onServiceSelect("Washing & Ironing");
                  props.onBookClick();
                }}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="h-full">
              <ServiceCard
                icon={<Package className="w-8 h-8" strokeWidth={2} />}
                title="Wash & Fold"
                subtitle="Professionally washed, dried, and neatly folded."
                isSelected={props.selectedService === "Washing & Folding"}
                onClick={() => {
                  props.onServiceSelect("Washing & Folding");
                  props.onBookClick();
                }}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="h-full">
              <ServiceCard
                icon={<Wind className="w-8 h-8" strokeWidth={2} />}
                title="Dry Cleaning"
                subtitle="Gentle, premium solvent care for delicate fabrics."
                isSelected={props.selectedService === "Dry Cleaning"}
                onClick={() => {
                  props.onServiceSelect("Dry Cleaning");
                  props.onBookClick();
                }}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 bg-[#EAE6D1] dark:bg-[#050B19] border-t border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-black dark:text-white tracking-tight mb-10">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-[#FF6B00]/30 to-transparent"></div>

            <div className="flex flex-col items-center relative z-10">
              <div className="w-24 h-24 rounded-full bg-white dark:bg-[#131B2F] border-4 border-[#EAE6D1] dark:border-[#050B19] shadow-xl flex items-center justify-center mb-6 text-[#FF6B00]">
                <Calendar className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-3">1. Book a Pickup</h3>
              <p className="text-gray-600 dark:text-[#8E94A3] text-sm max-w-[250px] leading-relaxed">Choose your service and schedule a convenient time for us to pick up your clothes.</p>
            </div>
            
            <div className="flex flex-col items-center relative z-10">
              <div className="w-24 h-24 rounded-full bg-white dark:bg-[#131B2F] border-4 border-[#EAE6D1] dark:border-[#050B19] shadow-xl flex items-center justify-center mb-6 text-[#FF6B00]">
                <Sparkles className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-3">2. We Clean & Press</h3>
              <p className="text-gray-600 dark:text-[#8E94A3] text-sm max-w-[250px] leading-relaxed">Our professionals treat your garments with premium care and high-quality equipment.</p>
            </div>
            
            <div className="flex flex-col items-center relative z-10">
              <div className="w-24 h-24 rounded-full bg-white dark:bg-[#131B2F] border-4 border-[#EAE6D1] dark:border-[#050B19] shadow-xl flex items-center justify-center mb-6 text-[#FF6B00]">
                <Package className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-3">3. Fresh Delivery</h3>
              <p className="text-gray-600 dark:text-[#8E94A3] text-sm max-w-[250px] leading-relaxed">Your clothes are returned to your door, fresh, crisp, and ready to wear.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Help & Support Section */}
      <section className="py-16 bg-[#F5F5DC] dark:bg-[#0A1128] border-t border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-black dark:text-white tracking-tight mb-4">Help & Support</h2>
          <p className="text-gray-600 dark:text-[#8E94A3] text-lg max-w-2xl mx-auto mb-10">Have questions or need assistance with your order? Our team is here to help.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white/80 dark:bg-[#131B2F]/80 p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-xl flex flex-col items-center transition-transform hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6">
                <PhoneCall className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-2">Call Us</h3>
              <p className="text-gray-600 dark:text-[#8E94A3] mb-4">Available 9 AM - 9 PM</p>
              <a href="tel:+919999999999" className="text-[#FF6B00] font-bold text-lg hover:underline">+91 99999 99999</a>
            </div>

            <div className="bg-white/80 dark:bg-[#131B2F]/80 p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-xl flex flex-col items-center transition-transform hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center mb-6">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-2">WhatsApp</h3>
              <p className="text-gray-600 dark:text-[#8E94A3] mb-4">Fastest response time</p>
              <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="text-green-500 font-bold text-lg hover:underline">Chat with us</a>
            </div>

            <div className="bg-white/80 dark:bg-[#131B2F]/80 p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-xl flex flex-col items-center transition-transform hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center mb-6">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-2">FAQs</h3>
              <p className="text-gray-600 dark:text-[#8E94A3] mb-4">Find answers instantly</p>
              <button className="text-[#FF6B00] font-bold text-lg hover:underline">View FAQs</button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
