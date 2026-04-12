"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Box, MapPin, User, Tag, Calendar, LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function PublicItemPage() {
  const { id } = useParams();
  const supabase = createClient();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchItem() {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) {
        setError("Item not found or inaccessible.");
      } else {
        setData(data);
      }
      setLoading(false);
    }
    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground bg-gradient-to-br from-background to-muted/20">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-xl font-medium animate-pulse text-muted-foreground">Scanning Database...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 text-center">
        <Box className="w-16 h-16 text-destructive mb-6" />
        <h1 className="text-3xl font-bold mb-2">Item Not Found</h1>
        <p className="text-muted-foreground max-w-md">The QR code you scanned does not match any valid item in our active registry, or the item has been deleted.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex items-center justify-center animate-in fade-in duration-700 bg-[url('/noise.png')]">
      <div className="max-w-2xl w-full">
        {/* Header Block */}
        <div className="text-center mb-8 space-y-3 relative">
          <div className="inline-flex bg-primary/10 p-3 rounded-full mb-2 border border-primary/20">
            <LayoutDashboard className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">DTI Registry Record</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
            Verified Physical Asset 
            <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none border-none">ACTIVE</Badge>
          </p>
        </div>

        <Card className="overflow-hidden border-border/50 shadow-2xl bg-card/60 backdrop-blur-xl">
          <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <CardDescription className="text-xs font-semibold tracking-wider text-primary uppercase mb-1">Article</CardDescription>
                <CardTitle className="text-3xl font-bold font-mono">{data.article || "Unnamed Asset"}</CardTitle>
              </div>
              <Badge variant="outline" className="w-fit text-sm py-1 font-mono tracking-widest border-primary/30">
                NO. {data.property_number || "N/A"}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {/* Overview Section */}
            <div className="p-6 bg-card/40">
              <p className="text-foreground/90 font-medium leading-relaxed">
                {data.description || "No specific description has been logged for this item."}
              </p>
            </div>

            <Separator className="bg-border/50" />

            {/* Structured Specifications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
              <div className="p-6 space-y-6">
                
                <div className="space-y-1.5">
                  <div className="flex items-center text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-1 gap-2">
                    <User className="w-4 h-4" /> Personnel Tracker
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground">End User:</span>
                    <span className="font-medium">{data.end_user || "Unassigned"}</span>
                    <span className="text-muted-foreground">Actual User:</span>
                    <span className="font-medium">{data.actual_user || "Unassigned"}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-1 gap-2">
                    <MapPin className="w-4 h-4" /> Location Base
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{data.location || "N/A"}</span>
                    <span className="text-muted-foreground">Sub-Location:</span>
                    <span className="font-medium">{data.sub_location || "N/A"}</span>
                  </div>
                </div>

              </div>

              <div className="p-6 space-y-6 bg-muted/5">
                
                <div className="space-y-1.5">
                  <div className="flex items-center text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-1 gap-2">
                    <Tag className="w-4 h-4" /> Technical Specs
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground">Serial No:</span>
                    <span className="font-mono bg-muted px-1.5 rounded">{data.serial_number || "None"}</span>
                    <span className="text-muted-foreground">Condition:</span>
                    <span className="font-medium capitalize">{data.condition || "Unknown"}</span>
                    <span className="text-muted-foreground">Property Type:</span>
                    <span className="font-medium">{data.property_type || "N/A"}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-1 gap-2">
                    <Calendar className="w-4 h-4" /> Metrics
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground">Acquired:</span>
                    <span className="font-medium">{data.acquisition_date || "Unknown"}</span>
                    <span className="text-muted-foreground">Unit Value:</span>
                    <span className="font-mono font-bold text-primary">₱{Number(data.unit_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

              </div>
            </div>

            {data.remarks && (
              <>
                <Separator className="bg-border/50" />
                <div className="p-6 bg-muted/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Administrative Remarks</span>
                  <p className="text-sm italic text-foreground/80">&quot;{data.remarks}&quot;</p>
                </div>
              </>
            )}

          </CardContent>
        </Card>
        
        <div className="text-center mt-6 text-xs text-muted-foreground font-mono">
          <p>Scan Generated by DTI-CDO QR Utility</p>
          <p className="opacity-50 mt-1">UUID: {data.id}</p>
        </div>
      </div>
    </div>
  );
}
