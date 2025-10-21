import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Activity } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { APP_TITLE } from "@/const";

export function AppHeader() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Activity className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">{APP_TITLE}</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Gold Market Analysis</p>
              </div>
            </div>
          </Link>
          
          <nav className="flex gap-1">
            <Link href="/">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <Link href="/sentiment">
              <Button variant="ghost" size="sm">Sentiment</Button>
            </Link>
            <Link href="/api-keys">
              <Button variant="ghost" size="sm">API Keys</Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm">Settings</Button>
            </Link>
          </nav>
        </div>
        
        <Button variant="outline" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    </header>
  );
}

