import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Link, Unlink, RefreshCw } from "lucide-react";

const XeroTestPage = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<"idle" | "connecting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [connection, setConnection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncResult, setSyncResult] = useState<any>(null);

  const redirectUri = window.location.origin + "/xero-test";

  // Check existing connection
  useEffect(() => {
    if (!profile?.business_id) return;
    (async () => {
      const { data } = await supabase
        .from("xero_connections")
        .select("*")
        .eq("business_id", profile.business_id)
        .maybeSingle();
      setConnection(data);
      setLoading(false);
    })();
  }, [profile?.business_id]);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get("code");
    if (!code || !profile?.business_id) return;

    setStatus("connecting");
    setMessage("Exchanging authorization code for tokens...");

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("xero-sync", {
          body: {
            action: "oauth_callback",
            business_id: profile.business_id,
            code,
            redirect_uri: redirectUri,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setStatus("success");
        setMessage(`Connected! Tenant ID: ${data.tenantId}`);
        setSearchParams({});

        // Refresh connection info
        const { data: conn } = await supabase
          .from("xero_connections")
          .select("*")
          .eq("business_id", profile.business_id)
          .maybeSingle();
        setConnection(conn);
      } catch (e: any) {
        setStatus("error");
        setMessage(e.message || "OAuth callback failed");
      }
    })();
  }, [searchParams, profile?.business_id]);

  const handleConnect = async () => {
    setStatus("connecting");
    setMessage("Getting auth URL...");
    try {
      const { data, error } = await supabase.functions.invoke("xero-sync", {
        body: { action: "get_auth_url", redirect_uri: redirectUri },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMessage("Redirecting to Xero...");
      window.location.href = data.auth_url;
    } catch (e: any) {
      setStatus("error");
      setMessage(e.message || "Failed to get auth URL");
    }
  };

  const handleDisconnect = async () => {
    if (!profile?.business_id) return;
    try {
      await supabase.functions.invoke("xero-sync", {
        body: { action: "disconnect", business_id: profile.business_id },
      });
      setConnection(null);
      setStatus("idle");
      setMessage("Disconnected.");
      setSyncResult(null);
    } catch (e: any) {
      setMessage(e.message);
    }
  };

  const handleTestSync = async () => {
    if (!profile?.business_id) return;
    setStatus("connecting");
    setMessage("Running test sync...");
    try {
      const { data, error } = await supabase.functions.invoke("xero-sync", {
        body: { action: "sync", business_id: profile.business_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSyncResult(data);
      setStatus("success");
      setMessage("Sync completed!");
    } catch (e: any) {
      setStatus("error");
      setMessage(e.message || "Sync failed");
    }
  };

  const isConnected = connection?.is_connected;

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Xero OAuth Test
            {isConnected && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="h-3 w-3 mr-1" /> Connected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Redirect URI info */}
          <div className="text-xs bg-muted p-3 rounded-md font-mono break-all">
            <span className="text-muted-foreground font-sans">Redirect URI:</span>
            <br />
            {redirectUri}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : (
            <>
              {/* Status message */}
              {message && (
                <div
                  className={`p-3 rounded-md text-sm ${
                    status === "error"
                      ? "bg-destructive/10 text-destructive"
                      : status === "success"
                      ? "bg-green-500/10 text-green-700"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {status === "connecting" && <Loader2 className="h-3 w-3 animate-spin inline mr-2" />}
                  {status === "error" && <XCircle className="h-3 w-3 inline mr-2" />}
                  {status === "success" && <CheckCircle className="h-3 w-3 inline mr-2" />}
                  {message}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {!isConnected ? (
                  <Button onClick={handleConnect} disabled={status === "connecting"}>
                    <Link className="h-4 w-4 mr-2" />
                    Connect Xero
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleTestSync} disabled={status === "connecting"} variant="default">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Test Sync
                    </Button>
                    <Button onClick={handleDisconnect} variant="destructive" size="sm">
                      <Unlink className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </>
                )}
              </div>

              {/* Connection details */}
              {isConnected && connection && (
                <div className="text-xs space-y-1 bg-muted p-3 rounded-md">
                  <div><strong>Tenant ID:</strong> {connection.xero_tenant_id}</div>
                  <div><strong>Last Sync:</strong> {connection.last_sync_at || "Never"}</div>
                  <div><strong>Token Expires:</strong> {connection.token_expires_at}</div>
                </div>
              )}

              {/* Sync results */}
              {syncResult && (
                <div className="text-sm bg-muted p-3 rounded-md space-y-1">
                  <div className="font-semibold">Sync Results:</div>
                  <div>Contacts: {syncResult.contactsSynced}</div>
                  <div>Invoices: {syncResult.invoicesSynced}</div>
                  <div>Payments: {syncResult.paymentsSynced}</div>
                  <div>Expenses: {syncResult.expensesSynced || 0}</div>
                  {syncResult.errors?.length > 0 && (
                    <div className="text-destructive">Errors: {syncResult.errors.join(", ")}</div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default XeroTestPage;
