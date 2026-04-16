"use client";

import * as React from "react";
import {
  IconBox,
  IconChartInfographic,
  IconAlertTriangle,
  IconChecklist,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExportPdfDialog } from "@/components/export-pdf-dialog";
import { InventoryTable } from "@/components/inventory-table";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useProfile } from "@/hooks/use-profile";

export default function DashboardPage() {
  const supabase = createClient();
  const { data: profile } = useProfile();
  const isAdmin = profile?.account_type === "admin";

  // Fetch Inventory Items
  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate dynamic KPIs based on the database
  const totalAssetsValue = inventory.reduce((acc, item) => acc + (Number(item.total_cost) || 0), 0);
  const totalPhysicalQuantity = inventory.reduce((acc, item) => acc + (Number(item.qty_physical_count) || 0), 0);
  const itemsWithShortage = inventory.filter(item => Number(item.qty_shortage_overage) < 0).length;

  const kpiData = [
    {
      title: "Total Registered Items",
      value: inventory.length.toLocaleString(),
      change: "Items in Database",
      icon: IconBox,
      iconColor: "text-indigo-400",
      bgColor: "bg-indigo-400/10",
    },
    {
      title: "Total Physical Quantity",
      value: totalPhysicalQuantity.toLocaleString(),
      change: "Units Counted",
      icon: IconChecklist,
      iconColor: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
    },
    {
      title: "Total Assets Value",
      value: `₱${totalAssetsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "Combined Cost",
      icon: IconChartInfographic,
      iconColor: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      title: "Items with Shortage",
      value: itemsWithShortage.toString(),
      change: "Requires review",
      icon: IconAlertTriangle,
      iconColor: itemsWithShortage > 0 ? "text-amber-500" : "text-emerald-400",
      bgColor: itemsWithShortage > 0 ? "bg-amber-500/10" : "bg-emerald-400/10",
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-background min-h-screen text-foreground animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Inventory Database <span className="text-muted-foreground font-normal ml-1">— RPCPPE Records</span>
          </h2>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <ExportPdfDialog inventory={inventory} />
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-4">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={index}
              className="bg-card border-border shadow-sm rounded-xl overflow-hidden relative group hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-out"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2 rounded-md ${kpi.bgColor}`}>
                  <Icon className={`h-4 w-4 ${kpi.iconColor}`} />
                </div>
              </CardHeader>

              <CardContent className="relative z-10">
                <div className="text-3xl font-bold mb-1 tracking-tight">{kpi.value}</div>
                <div className="mt-1 flex flex-col gap-1">
                  <p className="text-[11px] text-muted-foreground">
                    {kpi.change}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Database Table Section */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-tight">Recent Additions</h3>
          <p className="text-sm text-muted-foreground">
            Showing all items loaded in the current database.
          </p>
        </div>
        
        <InventoryTable data={inventory} isLoading={isLoading} isAdmin={isAdmin} />
      </div>
    </div>
  );
}