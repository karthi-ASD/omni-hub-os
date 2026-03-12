import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Globe, MapPin, Building2, TrendingUp, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Prospect {
  name: string;
  website: string;
  location: string;
  industry: string;
  opportunityScore: number;
  weaknesses: string[];
  recommendation: string;
}

const INDUSTRIES = [
  "Restaurant", "Real Estate", "Healthcare", "Legal", "Automotive",
  "Retail", "Education", "Construction", "Beauty & Wellness", "Finance",
  "Hospitality", "Fitness", "Dental", "Plumbing", "HVAC",
];

export default function ProspectFinderPage() {
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Australia");
  const [loading, setLoading] = useState(false);
  const [rawResult, setRawResult] = useState("");

  const handleSearch = async () => {
    if (!industry && !city) {
      toast.error("Enter at least an industry or city");
      return;
    }
    setLoading(true);
    setRawResult("");

    try {
      const { data, error } = await supabase.functions.invoke("ai-sales-assistant", {
        body: {
          type: "prospect_search",
          context: { industry, city, country },
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        setRawResult(data?.result || "No prospects found.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to find prospects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Prospect Finder" subtitle="Discover businesses with SEO opportunities using AI intelligence." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-primary" />
            Search Criteria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger>
                <SelectValue placeholder="Select Industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((ind) => (
                  <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input placeholder="City (e.g. Sydney)" value={city} onChange={(e) => setCity(e.target.value)} />

            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {["Australia", "United States", "United Kingdom", "Canada", "India", "UAE", "New Zealand"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleSearch} disabled={loading} className="w-full">
              {loading ? "Searching..." : "Find Prospects"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {rawResult && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              AI Prospect Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{rawResult}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
