import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket } from "lucide-react";

const TicketsPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold">Tickets</h1>
      <p className="text-muted-foreground">Support ticket management</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Ticket className="h-5 w-5" /> Support Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-12">Ticketing system coming soon.</p>
      </CardContent>
    </Card>
  </div>
);

export default TicketsPage;
