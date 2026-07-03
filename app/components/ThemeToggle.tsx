"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * A toggle button component for switching between Light and Dark themes.
 * It manages the 'dark' class on the HTML element and persists the user's preference in localStorage.
 */
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check local storage for the user's previously saved theme preference.
    const storedTheme = localStorage.getItem("theme");
    
    // If explicitly set to 'light', render the light theme and remove the 'dark' class.
    if (storedTheme === "light") {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    } else {
      // Otherwise, default to dark theme.
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const newTheme = !prev; // Toggle the boolean state
      
      if (newTheme) {
        // Enable Dark Mode
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        // Enable Light Mode
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return newTheme;
    });
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      title="Toggle theme"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
