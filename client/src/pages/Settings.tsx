import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Bell, Newspaper, Play, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";

export default function Settings() {
  const { data: settings, isLoading, refetch } = trpc.automation.getSettings.useQuery();
  const updateSettings = trpc.automation.updateSettings.useMutation();
  const testTelegram = trpc.automation.testTelegram.useMutation();
  const scrapeNews = trpc.automation.scrapeNews.useMutation();
  const runAnalysis = trpc.automation.runAnalysis.useMutation();

  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChannelId, setTelegramChannelId] = useState("");

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSaveAutomation = async (data: any) => {
    try {
      await updateSettings.mutateAsync(data);
      toast.success("Automation settings saved!");
      refetch();
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const handleSaveTelegram = async () => {
    try {
      await updateSettings.mutateAsync({
        telegramBotToken: telegramBotToken || settings.telegramBotToken || undefined,
        telegramChannelId: telegramChannelId || settings.telegramChannelId || undefined,
      });
      toast.success("Telegram settings saved!");
      refetch();
    } catch (error) {
      toast.error("Failed to save Telegram settings");
    }
  };

  const handleTestTelegram = async () => {
    const token = telegramBotToken || settings.telegramBotToken;
    const channelId = telegramChannelId || settings.telegramChannelId;

    if (!token || !channelId) {
      toast.error("Please enter both Bot Token and Channel ID");
      return;
    }

    try {
      const result = await testTelegram.mutateAsync({
        botToken: token,
        channelId: channelId,
      });

      if (result.success) {
        toast.success("Telegram connection successful! Check your channel.");
      } else {
        toast.error(`Telegram test failed: ${result.error}`);
      }
    } catch (error) {
      toast.error("Failed to test Telegram connection");
    }
  };

  const handleScrapeNews = async () => {
    try {
      const result = await scrapeNews.mutateAsync();
      if (result.success) {
        toast.success(`Scraped ${result.articlesScraped} articles and ${result.eventsScraped} events!`);
      } else {
        toast.error(result.error || "Failed to scrape news");
      }
    } catch (error) {
      toast.error("Failed to scrape news");
    }
  };

  const handleRunAnalysis = async () => {
    try {
      const result = await runAnalysis.mutateAsync();
      toast.success(
        `Analyzed ${result.articlesAnalyzed} articles. ` +
        (result.predictionGenerated ? `Prediction generated!` : "No prediction generated.")
      );
    } catch (error) {
      toast.error("Failed to run analysis");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings & Automation</h1>
          <p className="text-sm text-muted-foreground">Configure automated news scraping, predictions, and alerts</p>
        </div>
      </div>

      <div className="container py-8">
        <Tabs defaultValue="automation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="telegram">Telegram</TabsTrigger>
            <TabsTrigger value="manual">Manual Actions</TabsTrigger>
          </TabsList>

          {/* Automation Settings */}
          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>News Scraping Automation</CardTitle>
                <CardDescription>
                  Automatically scrape news from configured sources at regular intervals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Auto-Scraping</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically collect news from social media and websites
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoScrapingEnabled ?? false}
                    onCheckedChange={(checked) =>
                      handleSaveAutomation({ autoScrapingEnabled: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Scraping Interval (minutes)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={1440}
                    value={settings.scrapingInterval ?? 60}
                    onChange={(e) =>
                      handleSaveAutomation({ scrapingInterval: parseInt(e.target.value) })
                    }
                    placeholder="60"
                  />
                  <p className="text-sm text-muted-foreground">
                    How often to scrape news (5-1440 minutes)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prediction Automation</CardTitle>
                <CardDescription>
                  Automatically analyze news and generate predictions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Auto-Prediction</Label>
                    <p className="text-sm text-muted-foreground">
                      AI will analyze news and generate predictions automatically
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoPredictionEnabled ?? false}
                    onCheckedChange={(checked) =>
                      handleSaveAutomation({ autoPredictionEnabled: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prediction Interval (minutes)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={1440}
                    value={settings.predictionInterval ?? 60}
                    onChange={(e) =>
                      handleSaveAutomation({ predictionInterval: parseInt(e.target.value) })
                    }
                    placeholder="60"
                  />
                  <p className="text-sm text-muted-foreground">
                    How often to run automated analysis (5-1440 minutes)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Minimum Impact Score</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.minImpactScore ?? 50}
                    onChange={(e) =>
                      handleSaveAutomation({ minImpactScore: parseInt(e.target.value) })
                    }
                    placeholder="50"
                  />
                  <p className="text-sm text-muted-foreground">
                    Only generate predictions for news with impact score above this threshold
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Telegram Settings */}
          <TabsContent value="telegram" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Telegram Alerts
                </CardTitle>
                <CardDescription>
                  Send automated alerts to your Telegram channel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Telegram Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications to your Telegram channel
                    </p>
                  </div>
                  <Switch
                    checked={settings.telegramEnabled ?? false}
                    onCheckedChange={(checked) =>
                      handleSaveAutomation({ telegramEnabled: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bot Token</Label>
                  <Input
                    type="password"
                    value={telegramBotToken || settings.telegramBotToken || ""}
                    onChange={(e) => setTelegramBotToken(e.target.value)}
                    placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  />
                  <p className="text-sm text-muted-foreground">
                    Get your bot token from @BotFather on Telegram
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Channel ID</Label>
                  <Input
                    value={telegramChannelId || settings.telegramChannelId || ""}
                    onChange={(e) => setTelegramChannelId(e.target.value)}
                    placeholder="@your_channel or -1001234567890"
                  />
                  <p className="text-sm text-muted-foreground">
                    Your channel username or numeric ID
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveTelegram} disabled={updateSettings.isPending}>
                    {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Telegram Settings
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTestTelegram}
                    disabled={testTelegram.isPending}
                  >
                    {testTelegram.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Test Connection
                  </Button>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label>Alert on New Predictions</Label>
                    <Switch
                      checked={settings.telegramAlertOnPrediction ?? true}
                      onCheckedChange={(checked) =>
                        handleSaveAutomation({ telegramAlertOnPrediction: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Alert on High-Impact News</Label>
                    <Switch
                      checked={settings.telegramAlertOnNews ?? false}
                      onCheckedChange={(checked) =>
                        handleSaveAutomation({ telegramAlertOnNews: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Actions */}
          <TabsContent value="manual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Manual Triggers
                </CardTitle>
                <CardDescription>
                  Manually trigger scraping and analysis tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Scrape News Now</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Immediately scrape news from all enabled sources
                  </p>
                  <Button onClick={handleScrapeNews} disabled={scrapeNews.isPending}>
                    {scrapeNews.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Newspaper className="mr-2 h-4 w-4" />
                    Scrape News
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Run Analysis Now</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Analyze unprocessed articles and generate predictions
                  </p>
                  <Button onClick={handleRunAnalysis} disabled={runAnalysis.isPending}>
                    {runAnalysis.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Play className="mr-2 h-4 w-4" />
                    Run Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

