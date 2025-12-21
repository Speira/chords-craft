"use client";

import { useEffect, useState } from "react";

import { Moon, Sun } from "lucide-react";

import { Switch } from "../ui/switch";

export function ThemeSwitcher() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (storedTheme === "dark" || (!storedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = isDarkMode ? "light" : "dark";
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark", !isDarkMode);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <div className="flex items-center space-x-2">
      <Sun className="h-5 w-5 text-yellow-500" />
      <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
      <Moon className="h-5 w-5 text-gray-500" />
    </div>
  );
}
