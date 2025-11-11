import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Sparkles } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { APP_TITLE, APP_LOGO } from "@/const";
import { GenerateDialog } from "@/components/GenerateDialog";
import { AnalyzeNewsDialog } from "@/components/AnalyzeNewsDialog";
import { useLiquidHeaderMotion } from "@/hooks/useLiquidHeaderMotion";
import { useRouteLiquidPulse } from "@/hooks/useRouteLiquidPulse";

export function AppHeader() {
  const { theme, toggleTheme, setTheme } = useTheme();
  const headerRef = useLiquidHeaderMotion<HTMLElement>();
  useRouteLiquidPulse(headerRef);

  return (
    <header ref={headerRef} className="glass-nav sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img
                src={APP_LOGO}
                alt={APP_TITLE}
                className="h-6 w-6 rounded object-cover ring-1 ring-border"
              />
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  {APP_TITLE}
                </h1>
                {/* Tagline removed as requested */}
              </div>
            </div>
          </Link>

          <nav className="flex gap-1">
            <Link href="/">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Link href="/sentiment">
              <Button variant="ghost" size="sm">
                Sentiment
              </Button>
            </Link>
            <Link href="/api-keys">
              <Button variant="ghost" size="sm">
                API Keys
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                Settings
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <GenerateDialog />
          <AnalyzeNewsDialog />
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="focus-ring"
            aria-label="Toggle light/dark theme"
            title="Toggle light/dark theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          {setTheme && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "amoled" ? "dark" : "amoled")}
              className="focus-ring"
              aria-label="Toggle AMOLED theme"
              title="Toggle AMOLED theme"
            >
              <Sparkles className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
