import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

const MarketingPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold">Marketing</h1>
      <p className="text-muted-foreground">Campaigns, automation & outreach</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> Marketing Hub</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-12">Marketing module coming soon.</p>
      </CardContent>
    </Card>
  </div>
);

export default MarketingPage;
