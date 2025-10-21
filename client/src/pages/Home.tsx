import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Minus, Newspaper, Radio, Activity } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";

export default function Home() {
  const [selectedHorizon, setSelectedHorizon] = useState<"3m" | "5m" | "15m" | "1H" | "4H">("15m");
  
  // Prediction generation form
  const [currentPrice, setCurrentPrice] = useState("");
  const [dxy, setDxy] = useState("");
  const [yields, setYields] = useState("");
  const [adx, setAdx] = useState("");
  const [atr, setAtr] = useState("");
  const [regime, setRegime] = useState("");

  // News analysis form
  const [newsSource, setNewsSource] = useState("");
  const [newsHeadline, setNewsHeadline] = useState("");
  const [newsBody, setNewsBody] = useState("");

  // Queries
  const { data: latestPrediction, refetch: refetchPrediction } = trpc.predictions.latest.useQuery({
    horizon: selectedHorizon,
  });
  
  const { data: predictionHistory } = trpc.predictions.history.useQuery({ limit: 10 });
  const { data: latestNews } = trpc.news.latest.useQuery({ limit: 10 });

  // Mutations
  const generatePrediction = trpc.predictions.generate.useMutation({
    onSuccess: () => {
      toast.success("Prediction generated successfully!");
      refetchPrediction();
    },
    onError: (error) => {
      toast.error(`Failed to generate prediction: ${error.message}`);
    },
  });

  const analyzeNews = trpc.news.analyze.useMutation({
    onSuccess: (data) => {
      toast.success(`News analyzed! Sentiment: ${data.sentiment.topic} (${data.sentiment.polarity > 0 ? "Bullish" : "Bearish"})`);
      setNewsSource("");
      setNewsHeadline("");
      setNewsBody("");
    },
    onError: (error) => {
      toast.error(`Failed to analyze news: ${error.message}`);
    },
  });

  const handleGeneratePrediction = () => {
    generatePrediction.mutate({
      symbol: "XAUUSD",
      horizon: selectedHorizon,
      marketContext: currentPrice || dxy || yields ? {
        currentPrice: currentPrice ? parseFloat(currentPrice) : undefined,
        dxy: dxy ? parseFloat(dxy) : undefined,
        yields: yields ? parseFloat(yields) : undefined,
      } : undefined,
      technicalContext: adx || atr || regime ? {
        adx: adx ? parseFloat(adx) : undefined,
        atr: atr ? parseFloat(atr) : undefined,
        regime: regime || undefined,
      } : undefined,
    });
  };

  const handleAnalyzeNews = () => {
    if (!newsSource || !newsHeadline) {
      toast.error("Please provide source and headline");
      return;
    }
    analyzeNews.mutate({
      source: newsSource,
      headline: newsHeadline,
      body: newsBody || undefined,
    });
  };

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

  // Calculate sentiment percentages from news data
  const calculateBullishPercent = () => {
    if (!latestNews || latestNews.length === 0) return 50;
    
    const bullishCount = latestNews.filter(news => 
      news.sentimentPolarity && news.sentimentPolarity > 10
    ).length;
    
    const percent = (bullishCount / latestNews.length) * 100;
    return Math.round(percent * 10) / 10; // Round to 1 decimal
  };

  const calculateBearishPercent = () => {
    if (!latestNews || latestNews.length === 0) return 50;
    
    const bearishCount = latestNews.filter(news => 
      news.sentimentPolarity && news.sentimentPolarity < -10
    ).length;
    
    const percent = (bearishCount / latestNews.length) * 100;
    return Math.round(percent * 10) / 10; // Round to 1 decimal
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Latest Prediction */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Latest Prediction</CardTitle>
                    <CardDescription>Real-time XAUUSD market analysis</CardDescription>
                  </div>
                  <Select value={selectedHorizon} onValueChange={(v: any) => setSelectedHorizon(v)}>
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
                          <p className="text-sm text-muted-foreground">Direction</p>
                          <Badge className={getDirectionColor(latestPrediction.direction)}>
                            {latestPrediction.direction.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <p className="text-2xl font-bold text-foreground">{latestPrediction.confidence}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Range</p>
                        <p className="text-lg font-semibold text-foreground">
                          {latestPrediction.rangeMin} - {latestPrediction.rangeMax} pips
                        </p>
                      </div>
                    </div>
                    
                    {latestPrediction.rationale && latestPrediction.rationale.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Key Drivers:</p>
                        <ul className="space-y-1">
                          {latestPrediction.rationale.map((reason: string, idx: number) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      Generated: {new Date(latestPrediction.timestamp).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No predictions available for {selectedHorizon} timeframe</p>
                    <p className="text-sm mt-2">Generate a new prediction to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prediction History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Predictions</CardTitle>
                <CardDescription>Historical prediction performance</CardDescription>
              </CardHeader>
              <CardContent>
                {predictionHistory && predictionHistory.length > 0 ? (
                  <div className="space-y-3">
                    {predictionHistory.map((pred) => (
                      <div key={pred.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                        <div className="flex items-center gap-3">
                          {getDirectionIcon(pred.direction)}
                          <div>
                            <p className="font-medium text-foreground">{pred.horizon} • {pred.direction.toUpperCase()}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(pred.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{pred.confidence}%</p>
                          <p className="text-xs text-muted-foreground">
                            {pred.rangeMin}-{pred.rangeMax} pips
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No prediction history available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate New Prediction</CardTitle>
                <CardDescription>Provide market context for AI analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="horizon">Timeframe</Label>
                    <Select value={selectedHorizon} onValueChange={(v: any) => setSelectedHorizon(v)}>
                      <SelectTrigger id="horizon">
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="price">Current Price (optional)</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="2650.50"
                        value={currentPrice}
                        onChange={(e) => setCurrentPrice(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dxy">DXY (optional)</Label>
                      <Input
                        id="dxy"
                        type="number"
                        placeholder="104.25"
                        value={dxy}
                        onChange={(e) => setDxy(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="yields">US10Y Yields (optional)</Label>
                      <Input
                        id="yields"
                        type="number"
                        placeholder="4.35"
                        value={yields}
                        onChange={(e) => setYields(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="adx">ADX (optional)</Label>
                      <Input
                        id="adx"
                        type="number"
                        placeholder="25"
                        value={adx}
                        onChange={(e) => setAdx(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="atr">ATR (optional)</Label>
                      <Input
                        id="atr"
                        type="number"
                        placeholder="15.5"
                        value={atr}
                        onChange={(e) => setAtr(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="regime">Regime (optional)</Label>
                      <Input
                        id="regime"
                        placeholder="trending/ranging"
                        value={regime}
                        onChange={(e) => setRegime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGeneratePrediction}
                  disabled={generatePrediction.isPending}
                  className="w-full"
                  size="lg"
                >
                  <Radio className="mr-2 h-5 w-5" />
                  {generatePrediction.isPending ? "Generating..." : "Generate Prediction"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analyze News Sentiment</CardTitle>
                <CardDescription>Submit news for AI-powered sentiment analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="source">News Source</Label>
                  <Input
                    id="source"
                    placeholder="Reuters, Bloomberg, ForexFactory..."
                    value={newsSource}
                    onChange={(e) => setNewsSource(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="headline">Headline</Label>
                  <Input
                    id="headline"
                    placeholder="Fed signals potential rate cuts..."
                    value={newsHeadline}
                    onChange={(e) => setNewsHeadline(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="body">Body (optional)</Label>
                  <Textarea
                    id="body"
                    placeholder="Full news article text..."
                    rows={4}
                    value={newsBody}
                    onChange={(e) => setNewsBody(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleAnalyzeNews}
                  disabled={analyzeNews.isPending}
                  className="w-full"
                  size="lg"
                >
                  <Newspaper className="mr-2 h-5 w-5" />
                  {analyzeNews.isPending ? "Analyzing..." : "Analyze Sentiment"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent News Analysis</CardTitle>
                <CardDescription>Latest sentiment analysis results</CardDescription>
              </CardHeader>
              <CardContent>
                {latestNews && latestNews.length > 0 ? (
                  <div className="space-y-3">
                    {latestNews.map((news) => (
                      <div key={news.id} className="p-4 rounded-lg border border-border bg-card/50 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{news.headline}</p>
                            <p className="text-xs text-muted-foreground mt-1">{news.source}</p>
                          </div>
                          <Badge variant="outline">{news.topic}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Polarity:</span>
                            <span className={news.sentimentPolarity && news.sentimentPolarity > 0 ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>
                              {news.sentimentPolarity ? (news.sentimentPolarity / 100).toFixed(2) : "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Score:</span>
                            <span className="text-foreground font-medium">{news.sentimentScore}/100</span>
                          </div>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(news.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No news analysis available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>XAUUSD Prediction Agent • Powered by OpenAI GPT-4</p>
          <p className="mt-1">For informational purposes only • Not financial advice</p>
        </div>
      </footer>
    </div>
  );
}

