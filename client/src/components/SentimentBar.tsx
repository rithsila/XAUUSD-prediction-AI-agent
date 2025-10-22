import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SentimentBarProps {
  symbol: string;
  bullishPercent: number;
  bearishPercent: number;
  trend?: "up" | "down" | "neutral";
  lastUpdate?: Date;
}

export function SentimentBar({
  symbol,
  bullishPercent,
  bearishPercent,
  trend,
  lastUpdate,
}: SentimentBarProps) {
  const getTrendIcon = () => {
    if (trend === "up") {
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    } else if (trend === "down") {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Minus className="h-4 w-4 text-amber-500" />;
  };

  return (
    <div className="flex items-center gap-4 py-2">
      {/* Symbol Label */}
      <div className="w-24 font-semibold text-foreground">{symbol}</div>

      {/* Sentiment Bar */}
      <div className="flex-1 relative h-10 flex items-center">
        {/* Background */}
        <div className="absolute inset-0 bg-muted/30 rounded-md overflow-hidden flex">
          {/* Bullish (Green) Side */}
          <div
            className="bg-emerald-500 flex items-center justify-start px-3 transition-all duration-500"
            style={{ width: `${bullishPercent}%` }}
          >
            {bullishPercent > 15 && (
              <span className="text-sm font-bold text-white">
                {bullishPercent.toFixed(1)}%
              </span>
            )}
          </div>

          {/* Neutral Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border z-10" />

          {/* Bearish (Red) Side */}
          <div
            className="bg-red-500 flex items-center justify-end px-3 transition-all duration-500"
            style={{ width: `${bearishPercent}%` }}
          >
            {bearishPercent > 15 && (
              <span className="text-sm font-bold text-white">
                {bearishPercent.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Trend Indicator */}
      <div className="w-8 flex justify-center">{getTrendIcon()}</div>
    </div>
  );
}

interface SentimentChartProps {
  bullishPercent: number;
  bearishPercent: number;
  neutralPercent?: number;
  lastUpdate?: Date;
}

export function SentimentChart({
  bullishPercent,
  bearishPercent,
  neutralPercent = 0,
  lastUpdate,
}: SentimentChartProps) {
  const getTrend = (): "up" | "down" | "neutral" => {
    const diff = bullishPercent - bearishPercent;
    if (diff > 10) return "up";
    if (diff < -10) return "down";
    return "neutral";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Market Sentiment
        </CardTitle>
        <CardDescription>
          Based on recent news analysis for XAUUSD
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Sentiment Bar */}
        <SentimentBar
          symbol="XAUUSD"
          bullishPercent={bullishPercent}
          bearishPercent={bearishPercent}
          trend={getTrend()}
        />

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-muted-foreground">Bullish</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-muted-foreground">Bearish</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="h-4 w-4 text-amber-500" />
            <span className="text-muted-foreground">Neutral</span>
          </div>
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <div className="text-center text-xs text-muted-foreground">
            Latest update on{" "}
            {lastUpdate.toLocaleString("en-US", {
              weekday: "short",
              day: "numeric",
              month: "long",
              year: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
