import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

interface Props {
  packageId: string;
  totalValue: number;
  startDate: string;
  onGenerate: (packageId: string, totalValue: number, count: number, startDate: string) => void;
}

export default function GenerateInstallmentsDialog({ packageId, totalValue, startDate, onGenerate }: Props) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(12);
  const [value, setValue] = useState(totalValue);
  const [start, setStart] = useState(startDate);

  const perInstallment = count > 0 ? (value / count) : 0;
  const fmt = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Calculator className="h-4 w-4" /> Generate Installments</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Generate Installments</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Total Value ($)</Label>
            <Input type="number" value={value} onChange={e => setValue(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-1.5">
            <Label>Number of Installments</Label>
            <Input type="number" value={count} onChange={e => setCount(parseInt(e.target.value) || 1)} min={1} />
          </div>
          <div className="space-y-1.5">
            <Label>Start Date</Label>
            <Input type="date" value={start} onChange={e => setStart(e.target.value)} />
          </div>
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">Each installment</p>
            <p className="text-lg font-bold text-primary">{fmt(perInstallment)}</p>
          </div>
          <Button className="w-full" onClick={() => { onGenerate(packageId, value, count, start); setOpen(false); }}>
            Generate {count} Installments
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
