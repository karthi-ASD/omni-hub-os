import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface Props {
  onFileSelected: (file: File) => void;
}

const StepUpload: React.FC<Props> = ({ onFileSelected }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    onFileSelected(f);
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium">Click to upload CSV or Excel file</p>
        <p className="text-xs text-muted-foreground mt-1">Supports Xero Contacts exports (.xlsx/.csv)</p>
        <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
};

export default StepUpload;
