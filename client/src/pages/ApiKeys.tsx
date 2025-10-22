import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Key, Plus, Trash2, Ban, Copy, CheckCircle2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { APP_TITLE } from "@/const";

export default function ApiKeys() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [type, setType] = useState<"MT5" | "TradingView">("MT5");
  const [expiresAt, setExpiresAt] = useState("");

  // Queries
  const { data: apiKeys, refetch } = trpc.apiKeys.list.useQuery();

  // Mutations
  const createKey = trpc.apiKeys.create.useMutation({
    onSuccess: (data) => {
      toast.success("API key created successfully!");
      setIsCreateDialogOpen(false);
      setName("");
      setUsername("");
      setExpiresAt("");
      refetch();
      
      // Copy to clipboard
      navigator.clipboard.writeText(data.apiKey.apiKey || "");
      toast.info("API key copied to clipboard!");
    },
    onError: (error) => {
      toast.error(`Failed to create API key: ${error.message}`);
    },
  });

  const revokeKey = trpc.apiKeys.revoke.useMutation({
    onSuccess: () => {
      toast.success("API key revoked");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to revoke API key: ${error.message}`);
    },
  });

  const deleteKey = trpc.apiKeys.delete.useMutation({
    onSuccess: () => {
      toast.success("API key deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete API key: ${error.message}`);
    },
  });

  const handleCreateKey = () => {
    if (!name || !username) {
      toast.error("Please fill in all required fields");
      return;
    }

    createKey.mutate({
      name,
      username,
      type,
      expiresAt: expiresAt || undefined,
    });
  };

  const handleCopyKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(apiKey);
    toast.success("API key copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Active</Badge>;
      case "revoked":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Revoked</Badge>;
      case "expired":
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === "MT5" ? (
      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">MT5</Badge>
    ) : (
      <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">TradingView</Badge>
    );
  };

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Key className="h-8 w-8 text-primary" />
                API Key Management
              </h2>
              <p className="text-muted-foreground mt-2">
                Manage webhook access for TradingView indicators and MT5 Expert Advisors
              </p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Generate a new API key for webhook access
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Key Name *</Label>
                    <Input
                      id="name"
                      placeholder="My MT5 EA"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      placeholder="trader123"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select value={type} onValueChange={(v: "MT5" | "TradingView") => setType(v)}>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MT5">MT5 Expert Advisor</SelectItem>
                        <SelectItem value="TradingView">TradingView Indicator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expires">Expiration Date (optional)</Label>
                    <Input
                      id="expires"
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateKey} disabled={createKey.isPending}>
                    {createKey.isPending ? "Creating..." : "Create Key"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* API Keys Table */}
          <Card>
            <CardHeader>
              <CardTitle>Active API Keys</CardTitle>
              <CardDescription>
                {apiKeys?.length || 0} total keys • Click to copy API key
              </CardDescription>
            </CardHeader>
            <CardContent>
              {apiKeys && apiKeys.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>API Key</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell>{getTypeBadge(key.type)}</TableCell>
                        <TableCell>{key.username}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {key.apiKey.substring(0, 20)}...
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleCopyKey(key.apiKey)}
                            >
                              {copiedKey === key.apiKey ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(key.status)}</TableCell>
                        <TableCell>{key.requestCount || 0} requests</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : "Never"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : "Never"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {key.status === "active" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                                onClick={() => revokeKey.mutate({ id: key.id })}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this API key?")) {
                                  deleteKey.mutate({ id: key.id });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Key className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No API keys created yet</p>
                  <p className="text-sm mt-2">Create your first API key to enable webhook access</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Integration Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Guide</CardTitle>
              <CardDescription>How to use API keys with TradingView and MT5</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">TradingView Webhook URL</h3>
                <code className="block bg-muted p-3 rounded text-sm">
                  {window.location.origin}/api/trpc/webhook.getPrediction?apiKey=YOUR_API_KEY&horizon=15m
                </code>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">MT5 EA HTTP Request</h3>
                <code className="block bg-muted p-3 rounded text-sm whitespace-pre">
{`// Get prediction
string url = "${window.location.origin}/api/trpc/webhook.getPrediction";
string params = "?apiKey=YOUR_API_KEY&horizon=15m";

// Get combined market data
string url = "${window.location.origin}/api/trpc/webhook.getMarketData";
string params = "?apiKey=YOUR_API_KEY&horizon=15m&newsLimit=5";`}
                </code>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Available Endpoints</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <code className="bg-muted px-2 py-0.5 rounded">/webhook.getPrediction</code> - Get latest prediction</li>
                  <li>• <code className="bg-muted px-2 py-0.5 rounded">/webhook.getNewsSentiment</code> - Get latest news sentiment</li>
                  <li>• <code className="bg-muted px-2 py-0.5 rounded">/webhook.getMarketData</code> - Get prediction + news combined</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>{APP_TITLE} • Powered by OpenAI GPT-4</p>
          <p className="mt-1">Secure API access for automated trading systems</p>
        </div>
      </footer>
    </div>
  );
}

