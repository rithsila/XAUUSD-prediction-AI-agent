import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  // Map custom AMOLED theme to dark for Sonner, which only supports light/dark/system
  const sonnerTheme: ToasterProps["theme"] = theme === "amoled" ? "dark" : (theme as ToasterProps["theme"]);

  return (
    <Sonner
      theme={sonnerTheme}
      className="toaster group"
      toastOptions={{ className: "glass-surface text-popover-foreground" }}
      style={{
        "--normal-bg": "var(--glass-bg)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--glass-border)",
      } as React.CSSProperties}
      {...props}
    />
  );
};

export { Toaster };
