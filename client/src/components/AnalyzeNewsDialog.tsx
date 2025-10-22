import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Newspaper } from "lucide-react";

export function AnalyzeNewsDialog() {
  const [open, setOpen] = useState(false);
  const [newsSource, setNewsSource] = useState("");
  const [newsHeadline, setNewsHeadline] = useState("");
  const [newsBody, setNewsBody] = useState("");

  const utils = trpc.useUtils();

  const analyzeNews = trpc.news.analyze.useMutation({
    onSuccess: data => {
      toast.success(
        `News analyzed! Sentiment: ${data.sentiment.topic} (${data.sentiment.polarity > 0 ? "Bullish" : "Bearish"})`
      );
      // Invalidate latest news so Dashboard and News list refresh
      utils.news.latest.invalidate({ limit: 10 });
      setOpen(false);
      setNewsSource("");
      setNewsHeadline("");
      setNewsBody("");
    },
    onError: error => {
      toast.error(`Failed to analyze news: ${error.message}`);
    },
  });

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <Newspaper className="mr-2 h-5 w-5" />
          Analyze News
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Analyze News Sentiment</DialogTitle>
          <DialogDescription>
            Submit news for AI-powered sentiment analysis
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="source">News Source</Label>
            <Input
              id="source"
              placeholder="Reuters, Bloomberg, ForexFactory..."
              value={newsSource}
              onChange={e => setNewsSource(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              placeholder="Fed signals potential rate cuts..."
              value={newsHeadline}
              onChange={e => setNewsHeadline(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="body">Body (optional)</Label>
            <Textarea
              id="body"
              placeholder="Full news article text..."
              rows={4}
              value={newsBody}
              onChange={e => setNewsBody(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleAnalyzeNews}
            disabled={analyzeNews.isPending}
            className="w-full"
            size="lg"
          >
            {analyzeNews.isPending ? "Analyzing..." : "Analyze Sentiment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}