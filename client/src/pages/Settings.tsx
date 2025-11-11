import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Bell, Newspaper, Play, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Settings() {
  const {
    data: settings,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.automation.getSettings.useQuery(undefined, {
    retry: false,
  });
  const updateSettings = trpc.automation.updateSettings.useMutation();
  const testTelegram = trpc.automation.testTelegram.useMutation();
  const scrapeNews = trpc.automation.scrapeNews.useMutation();
  const runAnalysis = trpc.automation.runAnalysis.useMutation();

  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChannelId, setTelegramChannelId] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    const errorMessage =
      error && typeof error === "object" && "message" in (error as any)
        ? String((error as any).message)
        : "Network error";
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-4">
          <Alert variant="destructive">
            <AlertTitle>Failed to load settings</AlertTitle>
            <AlertDescription>
              <p className="mb-2">{errorMessage}</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>
                  Make sure the backend server is running at{" "}
                  <code className="font-mono">http://localhost:3000</code>.
                </li>
                <li>
                  If you are viewing the app on{" "}
                  <code className="font-mono">http://localhost:5173</code>,
                  enable a proxy to <code className="font-mono">/api</code> or
                  open it via{" "}
                  <code className="font-mono">http://localhost:3000</code>.
                </li>
                <li>
                  You can also try the dev login at{" "}
                  <code className="font-mono">/api/auth/dev-login</code> if
                  authentication is required.
                </li>
              </ul>
            </AlertDescription>
          </Alert>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="focus-ring"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
        telegramBotToken:
          telegramBotToken || settings.telegramBotToken || undefined,
        telegramChannelId:
          telegramChannelId || settings.telegramChannelId || undefined,
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
        toast.success(
          `Scraped ${result.articlesScraped} articles and ${result.eventsScraped} events!`
        );
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
          (result.predictionGenerated
            ? `Prediction generated!`
            : "No prediction generated.")
      );
    } catch (error) {
      toast.error("Failed to run analysis");
    }
  };

  return (
    <div className="min-h-screen">

      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings & Automation</h1>
          <p className="text-sm text-muted-foreground">
            Configure automated news scraping, predictions, and alerts
          </p>
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
                  Automatically scrape news from configured sources at regular
                  intervals
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
                    onCheckedChange={checked =>
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleSaveAutomation({
                        scrapingInterval: parseInt(e.target.value),
                      })
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
                      AI will analyze news and generate predictions
                      automatically
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoPredictionEnabled ?? false}
                    onCheckedChange={checked =>
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleSaveAutomation({
                        predictionInterval: parseInt(e.target.value),
                      })
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleSaveAutomation({
                        minImpactScore: parseInt(e.target.value),
                      })
                    }
                    placeholder="50"
                  />
                  <p className="text-sm text-muted-foreground">
                    Only generate predictions for news with impact score above
                    this threshold
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
                    onCheckedChange={checked =>
                      handleSaveAutomation({ telegramEnabled: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bot Token</Label>
                  <Input
                    type="text"
                    value={telegramBotToken}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTelegramBotToken(e.target.value)
                    }
                    placeholder={settings.telegramBotToken || "Enter Bot Token"}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Channel ID</Label>
                  <Input
                    type="text"
                    value={telegramChannelId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTelegramChannelId(e.target.value)
                    }
                    placeholder={
                      settings.telegramChannelId || "Enter Channel ID"
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alert on Prediction</Label>
                    <p className="text-sm text-muted-foreground">
                      Send alerts when a prediction is generated
                    </p>
                  </div>
                  <Switch
                    checked={settings.telegramAlertOnPrediction ?? true}
                    onCheckedChange={checked =>
                      handleSaveAutomation({
                        telegramAlertOnPrediction: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alert on News</Label>
                    <p className="text-sm text-muted-foreground">
                      Send alerts for high-impact news items
                    </p>
                  </div>
                  <Switch
                    checked={settings.telegramAlertOnNews ?? false}
                    onCheckedChange={checked =>
                      handleSaveAutomation({ telegramAlertOnNews: checked })
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveTelegram} className="focus-ring">
                    Save Telegram Settings
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTestTelegram}
                    className="focus-ring"
                  >
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Actions */}
          <TabsContent value="manual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5" />
                  Manual News Scraping
                </CardTitle>
                <CardDescription>
                  Trigger news scraping and set articles for analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={handleScrapeNews} className="focus-ring">
                    Scrape News Now
                  </Button>
                  <Button
                    onClick={handleRunAnalysis}
                    variant="outline"
                    className="focus-ring"
                  >
                    <Play className="mr-2 h-4 w-4" /> Run Analysis
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  These actions will run immediately without waiting for the
                  configured intervals
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
