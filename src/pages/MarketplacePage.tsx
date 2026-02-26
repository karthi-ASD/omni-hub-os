import { useMarketplace } from "@/hooks/useMarketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, Download, Star, Puzzle } from "lucide-react";

const MarketplacePage = () => {
  const { plugins, installed, loading, installPlugin, togglePlugin, uninstallPlugin, isInstalled } = useMarketplace();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <p className="text-muted-foreground">Browse and install plugins to extend your platform</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : (
        <Tabs defaultValue="browse">
          <TabsList>
            <TabsTrigger value="browse"><Store className="mr-1 h-4 w-4" />Browse ({plugins.length})</TabsTrigger>
            <TabsTrigger value="installed"><Puzzle className="mr-1 h-4 w-4" />Installed ({installed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plugins.map(plugin => {
                const alreadyInstalled = isInstalled(plugin.id);
                return (
                  <Card key={plugin.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{plugin.name}</CardTitle>
                        <Badge variant="outline" className="capitalize">{plugin.pricing_type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{plugin.description || "No description"}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <span>by {plugin.developer_name}</span>
                        <span className="flex items-center gap-1"><Star className="h-3 w-3" />{Number(plugin.rating_avg).toFixed(1)}</span>
                        <span className="flex items-center gap-1"><Download className="h-3 w-3" />{plugin.install_count}</span>
                      </div>
                      <Button size="sm" className="w-full" variant={alreadyInstalled ? "secondary" : "default"} disabled={alreadyInstalled} onClick={() => installPlugin(plugin.id)}>
                        {alreadyInstalled ? "Installed" : "Install"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
              {plugins.length === 0 && (
                <Card className="col-span-full"><CardContent className="py-8 text-center text-muted-foreground">No plugins available yet. Check back soon!</CardContent></Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="installed">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {installed.map(tp => {
                const plugin = plugins.find(p => p.id === tp.plugin_id);
                return (
                  <Card key={tp.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{plugin?.name || "Unknown Plugin"}</CardTitle>
                        <Switch checked={tp.enabled} onCheckedChange={v => togglePlugin(tp.id, v)} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground mb-3">Installed {new Date(tp.installed_at).toLocaleDateString()}</p>
                      <Button size="sm" variant="destructive" className="w-full" onClick={() => uninstallPlugin(tp.id)}>Uninstall</Button>
                    </CardContent>
                  </Card>
                );
              })}
              {installed.length === 0 && (
                <Card className="col-span-full"><CardContent className="py-8 text-center text-muted-foreground">No plugins installed</CardContent></Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default MarketplacePage;
