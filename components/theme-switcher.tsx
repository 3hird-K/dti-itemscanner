"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full opacity-0"
        aria-label="Toggle theme"
      />
    );
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300 active:scale-90 relative overflow-hidden"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      id="theme-toggle-btn"
    >
      <div className="relative h-5 w-5 flex items-center justify-center">
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-500 ease-out dark:-rotate-90 dark:scale-0 text-amber-500" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-500 ease-out dark:rotate-0 dark:scale-100 text-blue-400" />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

export { ThemeSwitcher };

