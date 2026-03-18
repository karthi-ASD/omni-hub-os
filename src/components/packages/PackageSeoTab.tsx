import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Target, Hash } from "lucide-react";
import type { SeoPackageData } from "@/hooks/useClientPackage";

interface Props {
  packageId: string;
  seoData: SeoPackageData | null;
  onSave: (packageId: string, data: Partial<SeoPackageData>) => void;
  isReadOnly?: boolean;
}

export default function PackageSeoTab({ packageId, seoData, onSave, isReadOnly }: Props) {
  const [form, setForm] = useState({
    radius_km: seoData?.radius_km ?? 0,
    suburbs: (seoData?.suburbs as string[]) ?? [],
    keyword_count: seoData?.keyword_count ?? 0,
    strategy_type: seoData?.strategy_type ?? "local",
  });
  const [suburbInput, setSuburbInput] = useState("");

  useEffect(() => {
    if (seoData) {
      setForm({
        radius_km: seoData.radius_km ?? 0,
        suburbs: (seoData.suburbs as string[]) ?? [],
        keyword_count: seoData.keyword_count ?? 0,
        strategy_type: seoData.strategy_type ?? "local",
      });
    }
  }, [seoData]);

  const addSuburb = () => {
    if (suburbInput.trim() && !form.suburbs.includes(suburbInput.trim())) {
      setForm(prev => ({ ...prev, suburbs: [...prev.suburbs, suburbInput.trim()] }));
      setSuburbInput("");
    }
  };

  const removeSuburb = (s: string) => {
    setForm(prev => ({ ...prev, suburbs: prev.suburbs.filter(x => x !== s) }));
  };

  const handleSave = () => {
    onSave(packageId, form as any);
  };

  return (
    <Card className="border border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> SEO Strategy Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Radius (km)
            </Label>
            <Input
              type="number"
              value={form.radius_km}
              onChange={e => setForm(prev => ({ ...prev, radius_km: parseFloat(e.target.value) || 0 }))}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Hash className="h-3 w-3" /> Keyword Count
            </Label>
            <Input
              type="number"
              value={form.keyword_count}
              onChange={e => setForm(prev => ({ ...prev, keyword_count: parseInt(e.target.value) || 0 }))}
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Strategy Type</Label>
          <Select value={form.strategy_type} onValueChange={v => setForm(prev => ({ ...prev, strategy_type: v }))} disabled={isReadOnly}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Local SEO</SelectItem>
              <SelectItem value="national">National SEO</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Target Suburbs</Label>
          {!isReadOnly && (
            <div className="flex gap-2">
              <Input
                placeholder="Add suburb..."
                value={suburbInput}
                onChange={e => setSuburbInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSuburb())}
              />
              <Button variant="outline" size="sm" onClick={addSuburb}>Add</Button>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {form.suburbs.map(s => (
              <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                {s}
                {!isReadOnly && (
                  <button onClick={() => removeSuburb(s)} className="hover:text-destructive ml-1">&times;</button>
                )}
              </span>
            ))}
          </div>
        </div>

        {!isReadOnly && (
          <Button onClick={handleSave} className="w-full">Save SEO Data</Button>
        )}
      </CardContent>
    </Card>
  );
}
