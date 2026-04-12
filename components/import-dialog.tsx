"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Loader2, FileSpreadsheet, CheckCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface ImportDialogProps {
  children?: React.ReactNode;
}

export function ImportDialog({ children }: ImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setSuccessMsg("");
      setErrorMsg("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setSuccessMsg("");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/inventory/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import file");
      }

      setSuccessMsg(data.message || "Import successful!");
      setFile(null);
      // Invalidate inventory query if we use react-query
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      
      // Auto close after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMsg("");
      }, 2000);
      
    } catch (err: any) {
      setErrorMsg(err.message || "An unknown error occurred.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="w-4 h-4" /> Import Excel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import RPCPPE Inventory Data</DialogTitle>
          <DialogDescription>
            Upload your official Excel (.xlsx) file to populate the database.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!successMsg ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border/50 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-muted/10">
                <FileSpreadsheet className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">
                  Drag and drop your Excel file here, or click to browse.
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Only .xlsx files are supported.
                </p>
                <input
                  type="file"
                  id="excel-upload"
                  className="hidden"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                />
                <Button asChild variant="secondary" size="sm">
                  <label htmlFor="excel-upload" className="cursor-pointer">
                    Browse Files
                  </label>
                </Button>
                {file && (
                  <p className="mt-4 text-xs font-semibold text-primary truncate max-w-[250px]">
                    Selected: {file.name}
                  </p>
                )}
              </div>
              
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-md">
                  {errorMsg}
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading and Parsing...
                  </>
                ) : (
                  "Start Import"
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
              <div>
                <p className="font-semibold text-lg">Import Complete!</p>
                <p className="text-sm text-muted-foreground">{successMsg}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
