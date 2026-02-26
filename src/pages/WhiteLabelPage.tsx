import { useState } from "react";
import { useWhiteLabel } from "@/hooks/useWhiteLabel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Palette, Package, Check } from "lucide-react";

const WhiteLabelPage = () => {
  const { brands, packages, loading, addBrand, addPackage } = useWhiteLabel();

  const [brandOpen, setBrandOpen] = useState(false);
  const [brandForm, setBrandForm] = useState({ brand_name: "", domain: "", primary_color: "#6366f1", secondary_color: "#8b5cf6" });

  const [pkgOpen, setPkgOpen] = useState(false);
  const [pkgForm, setPkgForm] = useState({ name: "", max_users: 5, max_campaigns: 3, monthly_price: 0, yearly_price: 0, ai_enabled: false, white_label_enabled: false });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">White-Label & Packages</h1>
        <p className="text-muted-foreground">Multi-brand engine & subscription packaging</p>
      </div>

      <Tabs defaultValue="brands">
        <TabsList>
          <TabsTrigger value="brands"><Palette className="h-3 w-3 mr-1" /> Brands</TabsTrigger>
          <TabsTrigger value="packages"><Package className="h-3 w-3 mr-1" /> Packages</TabsTrigger>
        </TabsList>

        <TabsContent value="brands" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Brands ({brands.length})</h2>
            <Dialog open={brandOpen} onOpenChange={setBrandOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add Brand</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Brand</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Brand Name</Label><Input value={brandForm.brand_name} onChange={(e) => setBrandForm({ ...brandForm, brand_name: e.target.value })} /></div>
                  <div><Label>Domain</Label><Input value={brandForm.domain} onChange={(e) => setBrandForm({ ...brandForm, domain: e.target.value })} placeholder="brand.example.com" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Primary Color</Label><Input type="color" value={brandForm.primary_color} onChange={(e) => setBrandForm({ ...brandForm, primary_color: e.target.value })} /></div>
                    <div><Label>Secondary Color</Label><Input type="color" value={brandForm.secondary_color} onChange={(e) => setBrandForm({ ...brandForm, secondary_color: e.target.value })} /></div>
                  </div>
                  <Button className="w-full" onClick={async () => {
                    if (!brandForm.brand_name) return;
                    await addBrand(brandForm);
                    setBrandOpen(false);
                    setBrandForm({ brand_name: "", domain: "", primary_color: "#6366f1", secondary_color: "#8b5cf6" });
                  }}>Create Brand</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {loading ? <Skeleton className="h-24 w-full" /> : brands.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No brands configured</CardContent></Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((b) => (
                <Card key={b.id}>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg" style={{ background: b.primary_color }} />
                      <div>
                        <p className="font-medium">{b.brand_name}</p>
                        <p className="text-xs text-muted-foreground">{b.domain || "No domain"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-4 w-4 rounded" style={{ background: b.primary_color }} />
                      <div className="h-4 w-4 rounded" style={{ background: b.secondary_color }} />
                      <Badge variant={b.is_active ? "default" : "secondary"}>{b.is_active ? "Active" : "Inactive"}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Subscription Packages ({packages.length})</h2>
            <Dialog open={pkgOpen} onOpenChange={setPkgOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add Package</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Package</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Name</Label><Input value={pkgForm.name} onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Max Users</Label><Input type="number" value={pkgForm.max_users} onChange={(e) => setPkgForm({ ...pkgForm, max_users: Number(e.target.value) })} /></div>
                    <div><Label>Max Campaigns</Label><Input type="number" value={pkgForm.max_campaigns} onChange={(e) => setPkgForm({ ...pkgForm, max_campaigns: Number(e.target.value) })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Monthly Price ($)</Label><Input type="number" value={pkgForm.monthly_price} onChange={(e) => setPkgForm({ ...pkgForm, monthly_price: Number(e.target.value) })} /></div>
                    <div><Label>Yearly Price ($)</Label><Input type="number" value={pkgForm.yearly_price} onChange={(e) => setPkgForm({ ...pkgForm, yearly_price: Number(e.target.value) })} /></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2"><Switch checked={pkgForm.ai_enabled} onCheckedChange={(v) => setPkgForm({ ...pkgForm, ai_enabled: v })} /><Label>AI Enabled</Label></div>
                    <div className="flex items-center gap-2"><Switch checked={pkgForm.white_label_enabled} onCheckedChange={(v) => setPkgForm({ ...pkgForm, white_label_enabled: v })} /><Label>White-Label</Label></div>
                  </div>
                  <Button className="w-full" onClick={async () => {
                    if (!pkgForm.name) return;
                    await addPackage(pkgForm);
                    setPkgOpen(false);
                    setPkgForm({ name: "", max_users: 5, max_campaigns: 3, monthly_price: 0, yearly_price: 0, ai_enabled: false, white_label_enabled: false });
                  }}>Create Package</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {loading ? <Skeleton className="h-24 w-full" /> : packages.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No packages defined</CardContent></Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {packages.map((p) => (
                <Card key={p.id} className="relative">
                  <CardHeader className="pb-2"><CardTitle className="text-lg">{p.name}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-3xl font-bold">${p.monthly_price}<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
                    <p className="text-sm text-muted-foreground">${p.yearly_price}/yr</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> {p.max_users} users</div>
                      <div className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> {p.max_campaigns} campaigns</div>
                      {p.ai_enabled && <div className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> AI features</div>}
                      {p.white_label_enabled && <div className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> White-label</div>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhiteLabelPage;
