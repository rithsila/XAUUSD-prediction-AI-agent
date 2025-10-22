import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SentimentBar } from "@/components/SentimentBar";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";

export default function Sentiment() {
  const [selectedSymbol, setSelectedSymbol] = useState("XAUUSD");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch latest sentiment data
  const {
    data: sentimentData,
    isLoading,
    refetch,
  } = trpc.sentiment.getLatest.useQuery({
    symbol: selectedSymbol,
  });

  // Refresh sentiment mutation
  const refreshMutation = trpc.sentiment.refresh.useMutation({
    onSuccess: () => {
      toast.success("Sentiment data refreshed");
      refetch();
      setIsRefreshing(false);
    },
    onError: error => {
      toast.error(`Failed to refresh: ${error.message}`);
      setIsRefreshing(false);
    },
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshMutation.mutate({ symbol: selectedSymbol });
  };

  const symbols = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD"];

  // Calculate trend direction
  const getTrend = (longPct: number): "up" | "down" | "neutral" => {
    if (longPct > 55) return "up";
    if (longPct < 45) return "down";
    return "neutral";
  };

  const formatLastUpdate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(date));
  };

  return (
    <div className="min-h-screen">
      <AppHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Retail Sentiment
            </h1>
            <p className="text-sm text-muted-foreground">
              Real-time trader positioning from multiple brokers
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing || refreshMutation.isPending}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh Data
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Symbol Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Instrument</CardTitle>
            <CardDescription>
              Choose a trading pair to view sentiment data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {symbols.map(symbol => (
                <Button
                  key={symbol}
                  variant={selectedSymbol === symbol ? "default" : "outline"}
                  onClick={() => setSelectedSymbol(symbol)}
                  size="sm"
                >
                  {symbol}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading sentiment data...</p>
            </CardContent>
          </Card>
        )}

        {/* Sentiment Data */}
        {!isLoading && sentimentData && (
          <>
            {/* Weighted Average */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Market Sentiment - {selectedSymbol}</CardTitle>
                <CardDescription>
                  Aggregated data from {sentimentData.weighted.sourceCount}{" "}
                  broker sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SentimentBar
                  symbol={selectedSymbol}
                  bullishPercent={sentimentData.weighted.longPercentage}
                  bearishPercent={sentimentData.weighted.shortPercentage}
                  trend={getTrend(sentimentData.weighted.longPercentage)}
                  lastUpdate={sentimentData.lastUpdate}
                />
                <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span>Bullish</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span>Bearish</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded" />
                      <span>Neutral</span>
                    </div>
                  </div>
                  <span>
                    Last update: {formatLastUpdate(sentimentData.lastUpdate)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Individual Broker Data */}
            <Card>
              <CardHeader>
                <CardTitle>Broker Sentiment Breakdown</CardTitle>
                <CardDescription>
                  Individual sentiment data from each broker source
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sentimentData.sentiments.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">
                      No sentiment data available
                    </p>
                    <Button onClick={handleRefresh} variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Fetch Data
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {sentimentData.sentiments.map(sentiment => (
                      <div key={sentiment.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">
                            {sentiment.source}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {sentiment.longPositions &&
                              sentiment.shortPositions && (
                                <span>
                                  {sentiment.longPositions.toLocaleString()}{" "}
                                  long /{" "}
                                  {sentiment.shortPositions.toLocaleString()}{" "}
                                  short
                                </span>
                              )}
                            {sentiment.volume && (
                              <span>
                                {(sentiment.volume / 100).toLocaleString()} lots
                              </span>
                            )}
                          </div>
                        </div>
                        <SentimentBar
                          symbol={sentiment.source}
                          bullishPercent={sentiment.longPercentage}
                          bearishPercent={sentiment.shortPercentage}
                          trend={getTrend(sentiment.longPercentage)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="mt-6 border-blue-500/20 bg-blue-500/5">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-2">
                  About Retail Sentiment
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Retail sentiment shows the percentage of retail traders
                  holding long vs short positions. Many traders use this as a
                  contrarian indicator, as retail traders often position
                  themselves opposite to institutional money.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Contrarian Strategy:</strong> When sentiment is
                  extremely bullish (&gt;60% long), it may indicate an
                  overcrowded trade and potential reversal opportunity.
                  Conversely, extreme bearish sentiment (&lt;40% long) might
                  signal a buying opportunity.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
