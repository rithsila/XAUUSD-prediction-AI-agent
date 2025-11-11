import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
} from "lucide-react";
import { APP_TITLE } from "@/const";

// Local type for prediction history items used in UI
type PredictionItem = {
  id: string;
  horizon: "3m" | "5m" | "15m" | "1H" | "4H";
  direction: "bull" | "bear" | "neutral";
  timestamp: string | Date;
  confidence: number;
  rangeMin?: number | null;
  rangeMax?: number | null;
};

export default function Home() {
  const [selectedHorizon, setSelectedHorizon] = useState<
    "3m" | "5m" | "15m" | "1H" | "4H"
  >("15m");

  // Queries
  const { data: latestPrediction } = trpc.predictions.latest.useQuery({
    horizon: selectedHorizon,
  });

  const { data: predictionHistory } = trpc.predictions.history.useQuery({
    limit: 10,
  });

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case "bull":
        return <TrendingUp className="h-5 w-5 text-emerald-500" />;
      case "bear":
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case "bull":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "bear":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen">

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Latest Prediction */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Latest Prediction</CardTitle>
                  <CardDescription>
                    Real-time XAUUSD market analysis
                  </CardDescription>
                </div>
                <Select
                  value={selectedHorizon}
                  onValueChange={(v: any) => setSelectedHorizon(v)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3m">3 Minutes</SelectItem>
                    <SelectItem value="5m">5 Minutes</SelectItem>
                    <SelectItem value="15m">15 Minutes</SelectItem>
                    <SelectItem value="1H">1 Hour</SelectItem>
                    <SelectItem value="4H">4 Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {latestPrediction ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getDirectionIcon(latestPrediction.direction)}
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Direction
                        </p>
                        <Badge
                          className={getDirectionColor(
                            latestPrediction.direction
                          )}
                        >
                          {latestPrediction.direction.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Confidence
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {latestPrediction.confidence}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Range</p>
                      <p className="text-lg font-semibold text-foreground">
                        {latestPrediction.rangeMin} -{" "}
                        {latestPrediction.rangeMax} pips
                      </p>
                    </div>
                  </div>

                  {latestPrediction.rationale &&
                    latestPrediction.rationale.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">
                          Key Drivers:
                        </p>
                        <ul className="space-y-1">
                          {latestPrediction.rationale.map(
                            (reason: string, idx: number) => (
                              <li
                                key={idx}
                                className="text-sm text-muted-foreground flex items-start gap-2"
                              >
                                <span className="text-primary mt-1">•</span>
                                <span>{reason}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  <p className="text-xs text-muted-foreground">
                    Generated:{" "}
                    {new Date(latestPrediction.timestamp).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>
                    No predictions available for {selectedHorizon} timeframe
                  </p>
                  <p className="text-sm mt-2">
                    Generate a new prediction to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prediction History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Predictions</CardTitle>
              <CardDescription>
                Historical prediction performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {predictionHistory && predictionHistory.length > 0 ? (
                <div className="space-y-3">
                  {predictionHistory.map((pred: PredictionItem) => (
                    <div
                      key={pred.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50"
                    >
                      <div className="flex items-center gap-3">
                        {getDirectionIcon(pred.direction)}
                        <div>
                          <p className="font-medium text-foreground">
                            {pred.horizon} • {pred.direction.toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(pred.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {pred.confidence}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pred.rangeMin}-{pred.rangeMax} pips
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No prediction history available
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>{APP_TITLE} • Powered by OpenAI GPT-4</p>
          <p className="mt-1">
            For informational purposes only • Not financial advice
          </p>
        </div>
      </footer>
    </div>
  );
}
