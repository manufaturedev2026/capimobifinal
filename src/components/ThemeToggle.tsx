import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-xl hover:bg-secondary transition-colors"
      aria-label="Alternar tema"
    >
      {theme === "dark" ? <Sun size={18} className="text-foreground" /> : <Moon size={18} className="text-foreground" />}
    </button>
  );
}
