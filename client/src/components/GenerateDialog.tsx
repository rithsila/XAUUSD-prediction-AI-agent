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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Radio } from "lucide-react";

export function GenerateDialog() {
  const [open, setOpen] = useState(false);

  const [selectedHorizon, setSelectedHorizon] = useState<
    "3m" | "5m" | "15m" | "1H" | "4H"
  >("15m");
  const [currentPrice, setCurrentPrice] = useState("");
  const [dxy, setDxy] = useState("");
  const [yields, setYields] = useState("");
  const [adx, setAdx] = useState("");
  const [atr, setAtr] = useState("");
  const [regime, setRegime] = useState("");

  const utils = trpc.useUtils();

  const generatePrediction = trpc.predictions.generate.useMutation({
    onSuccess: () => {
      toast.success("Prediction generated successfully!");
      // Invalidate latest prediction so Dashboard updates
      utils.predictions.latest.invalidate({ horizon: selectedHorizon });
      setOpen(false);
      // reset form fields
      setCurrentPrice("");
      setDxy("");
      setYields("");
      setAdx("");
      setAtr("");
      setRegime("");
    },
    onError: error => {
      toast.error(`Failed to generate prediction: ${error.message}`);
    },
  });

  const handleGeneratePrediction = () => {
    generatePrediction.mutate({
      symbol: "XAUUSD",
      horizon: selectedHorizon,
      marketContext:
        currentPrice || dxy || yields
          ? {
              currentPrice: currentPrice ? parseFloat(currentPrice) : undefined,
              dxy: dxy ? parseFloat(dxy) : undefined,
              yields: yields ? parseFloat(yields) : undefined,
            }
          : undefined,
      technicalContext:
        adx || atr || regime
          ? {
              adx: adx ? parseFloat(adx) : undefined,
              atr: atr ? parseFloat(atr) : undefined,
              regime: regime || undefined,
            }
          : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          <Radio className="mr-2 h-5 w-5" />
          Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate New Prediction</DialogTitle>
          <DialogDescription>
            Provide market context for AI analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="horizon">Timeframe</Label>
            <Select
              value={selectedHorizon}
              onValueChange={(v: any) => setSelectedHorizon(v)}
            >
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
                onChange={e => setCurrentPrice(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dxy">DXY (optional)</Label>
              <Input
                id="dxy"
                type="number"
                placeholder="104.25"
                value={dxy}
                onChange={e => setDxy(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="yields">US10Y Yields (optional)</Label>
              <Input
                id="yields"
                type="number"
                placeholder="4.35"
                value={yields}
                onChange={e => setYields(e.target.value)}
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
                onChange={e => setAdx(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="atr">ATR (optional)</Label>
              <Input
                id="atr"
                type="number"
                placeholder="15.5"
                value={atr}
                onChange={e => setAtr(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="regime">Regime (optional)</Label>
              <Input
                id="regime"
                placeholder="trending/ranging"
                value={regime}
                onChange={e => setRegime(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleGeneratePrediction}
            disabled={generatePrediction.isPending}
            className="w-full"
            size="lg"
          >
            {generatePrediction.isPending
              ? "Generating..."
              : "Generate Prediction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}