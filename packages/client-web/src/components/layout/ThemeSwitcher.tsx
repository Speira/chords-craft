"use client";

import { useEffect, useState } from "react";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Skeleton } from "../Skeleton";
import { Switch } from "../ui/switch";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true); // eslint-disable-line
  }, []);

  const isDarkMode = resolvedTheme === "dark";

  const toggleTheme = () => {
    const newTheme = isDarkMode ? "light" : "dark";
    setTheme(newTheme);
  };

  if (!mounted) return <Skeleton />;
  return (
    <div className="flex items-center space-x-2">
      <Sun className="h-5 w-5 text-yellow-500" />
      <Switch
        checked={isDarkMode}
        aria-checked={isDarkMode}
        onCheckedChange={toggleTheme}
      />
      <Moon className="h-5 w-5 text-gray-500" />
    </div>
  );
}
