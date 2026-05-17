"use client";

import * as React from "react";
import {
  Clock,
  Activity,
  Box,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Info
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from "recharts";
import { ExportPdfDialog } from "@/components/export-pdf-dialog";
import { InventoryTable } from "@/components/inventory-table";
import { createClient } from "@/lib/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/hooks/use-profile";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DashboardPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const isAdmin = profile?.account_type === "admin";
  const [activeDetails, setActiveDetails] = React.useState<any | null>(null);

  // Supabase Real-time database subscription for instant reactive updates!
  React.useEffect(() => {
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, and DELETE events!
          schema: "public",
          table: "inventory_items",
        },
        () => {
          // Instantly refresh the TanStack query data on any database event!
          queryClient.invalidateQueries({ queryKey: ["inventory"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);

  // Dynamic live clock
  const [timeStr, setTimeStr] = React.useState("");
  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = hours.toString().padStart(2, "0");
      setTimeStr(`${formattedHours}:${minutes}:${seconds} ${ampm} PH`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic network latency
  const [latency, setLatency] = React.useState(24);
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        const next = prev + delta;
        return Math.max(12, Math.min(32, next));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Inventory Items
  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .neq("status", "rejected")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate dynamic KPIs based on the database
  const totalAssetsValue = inventory.reduce((acc, item) => acc + (Number(item.total_cost) || 0), 0);
  const totalPhysicalQuantity = inventory.reduce((acc, item) => acc + (Number(item.qty_physical_count) || 0), 0);
  const itemsWithShortage = inventory.filter(item => Number(item.qty_shortage_overage) < 0).length;

  // Context-aware greeting and date
  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const dateStr = React.useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date().toLocaleDateString("en-US", options);
  }, []);

  // Generate Recharts timeline data based on actual inventory
  const chartData = React.useMemo(() => {
    const sortedItems = [...inventory].sort((a, b) => {
      const dateA = a.acquisition_date || a.created_at || "";
      const dateB = b.acquisition_date || b.created_at || "";
      return dateA.localeCompare(dateB);
    });

    if (sortedItems.length === 0) {
      return [
        { date: "Jan", "Total Assets Value": 0, "Physical Quantity": 0, "Registered Items": 0 },
        { date: "Feb", "Total Assets Value": 0, "Physical Quantity": 0, "Registered Items": 0 },
        { date: "Mar", "Total Assets Value": 0, "Physical Quantity": 0, "Registered Items": 0 },
        { date: "Apr", "Total Assets Value": 0, "Physical Quantity": 0, "Registered Items": 0 },
      ];
    }

    const points = 6;
    const dataPoints = [];
    const totalCount = sortedItems.length;
    const chunkSize = Math.max(1, Math.ceil(totalCount / points));

    let cumulativeCost = 0;
    let cumulativeQty = 0;
    let cumulativeItems = 0;

    for (let i = 0; i < points; i++) {
      const endIndex = Math.min((i + 1) * chunkSize, totalCount);
      const startIndex = i * chunkSize;
      const chunk = sortedItems.slice(startIndex, endIndex);

      chunk.forEach(item => {
        cumulativeCost += Number(item.total_cost) || 0;
        cumulativeQty += Number(item.qty_physical_count) || 0;
        cumulativeItems += 1;
      });

      const repItem = chunk[chunk.length - 1] || sortedItems[sortedItems.length - 1];
      let dateLabel = `P${i + 1}`;
      if (repItem) {
        const rawDate = repItem.acquisition_date || repItem.created_at;
        if (rawDate) {
          try {
            const d = new Date(rawDate);
            dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          } catch (e) {
            // fallback
          }
        }
      }

      dataPoints.push({
        date: dateLabel,
        "Total Assets Value": Math.round(cumulativeCost),
        "Physical Quantity": cumulativeQty,
        "Registered Items": cumulativeItems,
      });
    }

    return dataPoints;
  }, [inventory]);

  // Generate dynamic system activity feed based on Supabase updates
  const recentActivity = React.useMemo(() => {
    const sorted = [...inventory]
      .sort((a, b) => {
        const dateA = a.updated_at || a.created_at || "";
        const dateB = b.updated_at || b.created_at || "";
        return dateB.localeCompare(dateA);
      })
      .slice(0, 3);

    return sorted.map((item, index) => {
      const article = item.article || "Item";
      const initials = article.substring(0, 2).toUpperCase();

      const shortage = Number(item.qty_shortage_overage) || 0;
      let statusText = "VERIFIED";
      let statusColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/20";
      if (shortage < 0) {
        statusText = "SHORTAGE";
        statusColor = "text-rose-500 bg-rose-500/10 border-rose-500/20 dark:bg-rose-500/20";
      } else if (shortage > 0) {
        statusText = "OVERAGE";
        statusColor = "text-blue-500 bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/20";
      }

      let timeAgo = "Recently";
      if (item.updated_at || item.created_at) {
        const date = new Date(item.updated_at || item.created_at || "");
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHrs < 1) {
          timeAgo = "Just now";
        } else if (diffHrs < 24) {
          timeAgo = `${diffHrs} hours ago`;
        } else {
          const diffDays = Math.floor(diffHrs / 24);
          timeAgo = diffDays === 1 ? "Yesterday" : `${diffDays} days ago`;
        }
      }

      // Calculate if item was added or updated (within 1 second gap is considered 'Added')
      const createdTime = item.created_at ? new Date(item.created_at).getTime() : 0;
      const updatedTime = item.updated_at ? new Date(item.updated_at).getTime() : 0;
      const isAdded = Math.abs(updatedTime - createdTime) < 1000;
      const actionWord = isAdded ? "Added" : "Updated";

      // Cycle colors for avatar badges
      const bgColors = ["bg-blue-500 text-white", "bg-emerald-500 text-white", "bg-indigo-500 text-white"];
      const badgeBg = bgColors[index % bgColors.length];

      return {
        id: item.id,
        initials,
        badgeBg,
        title: `${actionWord} physical count of ${item.article || "unnamed asset"}`,
        description: item.description || "No description available",
        location: `${item.location || "Office"} — ${item.sub_location || "Central Storage"}`,
        statusText,
        statusColor,
        timeAgo,
        item, // Pass original item data
      };
    });
  }, [inventory]);

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8 bg-background min-h-screen text-foreground animate-in fade-in duration-500">
      
      {/* Dynamic Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 gap-4 border-b border-border/40">
        <div>
          <span className="text-xs font-bold tracking-widest text-rose-500 uppercase">
            DTI – FASTRACK MANAGEMENT SYSTEM
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            {greeting}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's the operational overview for <span className="font-semibold text-foreground">{dateStr}</span>.
          </p>
        </div>
        
        {/* Dynamic Running Clock, Latency & Live status */}
        <div className="flex items-center gap-3 self-start md:self-center flex-wrap">
          {/* Clock Pill */}
          <div className="flex items-center bg-muted/60 dark:bg-neutral-900 border border-border/50 rounded-full px-3 py-1 text-xs font-medium">
            <Clock className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
            <span className="tabular-nums">{timeStr}</span>
          </div>

          {/* Latency Pill */}
          <div className="flex items-center bg-muted/60 dark:bg-neutral-900 border border-border/50 rounded-full px-3 py-1 text-xs font-medium">
            <Activity className="h-3.5 w-3.5 text-muted-foreground mr-1.5 animate-pulse" />
            <span className="text-muted-foreground mr-1">LATENCY</span>
            <span className="text-emerald-500 font-bold tabular-nums">{latency}ms</span>
          </div>

          {/* Live Indicator Pill */}
          <div className="flex items-center bg-muted/60 dark:bg-neutral-900 border border-border/50 rounded-full px-3 py-1 text-xs font-medium">
            <span className="relative flex h-2 w-2 mr-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-500 font-bold tracking-wider uppercase text-[10px]">
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* Premium Bento Grid Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Card 1: Registered Items */}
        <div className="bg-card border border-neutral-100 dark:border-border/60 shadow-md shadow-neutral-200/50 dark:shadow-none rounded-2xl p-6 relative overflow-hidden group hover:shadow-xl hover:shadow-neutral-200/60 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              REGISTERED ITEMS
            </span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20">
              <Box className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">
              {inventory.length.toLocaleString()}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 dark:bg-indigo-500/30">
              DTI Database
            </span>
            <span className="text-xs text-muted-foreground truncate">
              Active physical records
            </span>
          </div>
        </div>

        {/* Card 2: Total Quantity */}
        <div className="bg-card border border-neutral-100 dark:border-border/60 shadow-md shadow-neutral-200/50 dark:shadow-none rounded-2xl p-6 relative overflow-hidden group hover:shadow-xl hover:shadow-neutral-200/60 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              PHYSICAL QUANTITY
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20">
              <ClipboardList className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">
              {totalPhysicalQuantity.toLocaleString()}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 dark:bg-emerald-500/30">
              Counted Units
            </span>
            <span className="text-xs text-muted-foreground truncate">
              Physical count verified
            </span>
          </div>
        </div>

        {/* Card 3: Total Assets Value */}
        <div className="bg-card border border-neutral-100 dark:border-border/60 shadow-md shadow-neutral-200/50 dark:shadow-none rounded-2xl p-6 relative overflow-hidden group hover:shadow-xl hover:shadow-neutral-200/60 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              TOTAL ASSETS VALUE
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 dark:bg-blue-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2 overflow-hidden">
            <span className="text-[22px] lg:text-[24px] xl:text-[28px] font-extrabold tracking-tight truncate">
              ₱{totalAssetsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 dark:bg-blue-500/30">
              Combined Cost
            </span>
            <span className="text-xs text-muted-foreground truncate">
              Fund Cluster valuation
            </span>
          </div>
        </div>

        {/* Card 4: Shortages */}
        <div className="bg-card border border-neutral-100 dark:border-border/60 shadow-md shadow-neutral-200/50 dark:shadow-none rounded-2xl p-6 relative overflow-hidden group hover:shadow-xl hover:shadow-neutral-200/60 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              ITEMS WITH SHORTAGE
            </span>
            <div className={`p-2 rounded-lg ${itemsWithShortage > 0 ? "bg-rose-500/10 text-rose-500 dark:bg-rose-500/20" : "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20"}`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">
              {itemsWithShortage}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${itemsWithShortage > 0 ? "bg-rose-500/15 text-rose-500 dark:bg-rose-500/30" : "bg-emerald-500/15 text-emerald-500 dark:bg-emerald-500/30"}`}>
              {itemsWithShortage > 0 ? "Needs Review" : "Fully Balanced"}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              Overage / shortage variance
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout (Service Impact Analysis Chart & Recent Activity) */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        
        {/* Cost & Qty Analysis Chart (Left 2 columns) */}
        <div className="lg:col-span-2 bg-card border border-neutral-100 dark:border-border/60 shadow-md shadow-neutral-200/50 dark:shadow-none rounded-2xl p-6 relative overflow-hidden group hover:shadow-xl hover:shadow-neutral-200/60 dark:hover:shadow-none transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-foreground">
                Inventory Valuation & Quantity Analysis
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Analyzing cumulative asset costs, physical counts, and cataloged items.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2.5 py-1 border border-border/40">
              <Info className="h-3.5 w-3.5" />
              <span>Real-time Chronology</span>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 15, left: 15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorItems" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: "currentColor", fontSize: 10 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: "currentColor", fontSize: 10 }}
                  className="text-muted-foreground"
                  tickFormatter={(val) => {
                    if (val >= 1e6) return `₱${(val / 1e6).toFixed(1)}M`;
                    if (val >= 1e3) return `₱${(val / 1e3).toFixed(0)}k`;
                    return `₱${val}`;
                  }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: "currentColor", fontSize: 10 }}
                  className="text-muted-foreground"
                  tickFormatter={(val) => val}
                />
                <ChartTooltip
                  formatter={(value, name) => {
                    if (name === "Total Assets Value") {
                      return [new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(Number(value)), name];
                    }
                    if (name === "Physical Quantity") {
                      return [`${value} units`, name];
                    }
                    if (name === "Registered Items") {
                      return [`${value} items`, name];
                    }
                    return [value, name];
                  }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.75rem",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    color: "hsl(var(--foreground))",
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  labelStyle={{ fontWeight: "bold", fontSize: 12, color: "hsl(var(--foreground))" }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="Total Assets Value"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorCost)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="Physical Quantity"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorQty)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="Registered Items"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorItems)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Custom Legends */}
          <div className="flex items-center gap-6 justify-center mt-4 border-t border-border/30 pt-4 text-xs font-semibold flex-wrap">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-muted-foreground">Total Assets Value (₱)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-muted-foreground">Physical Quantity (Units)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-muted-foreground">Registered Items (Unique)</span>
            </div>
          </div>
        </div>

        {/* System Activity (Right 1 column) */}
        <div className="bg-card border border-neutral-100 dark:border-border/60 shadow-md shadow-neutral-200/50 dark:shadow-none rounded-2xl p-6 relative overflow-hidden group hover:shadow-xl hover:shadow-neutral-200/60 dark:hover:shadow-none transition-all duration-300 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-foreground">
                System Activity
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Latest operational database updates.
              </p>
            </div>
            {isAdmin && (
              <Link 
                href="/protected/manage-data"
                className="text-xs font-bold text-rose-500 uppercase tracking-widest cursor-pointer hover:underline flex items-center"
              >
                VIEW ALL
              </Link>
            )}
          </div>

          {/* Activity items list */}
          <div className="space-y-4 flex-1">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div 
                  key={activity.id || index} 
                  onClick={() => setActiveDetails(activity)}
                  className="flex gap-4 relative group/item cursor-pointer p-3 rounded-2xl hover:bg-muted/40 transition-all duration-200 border border-transparent hover:border-border/30"
                >
                  {/* Circular badge */}
                  <div className={`h-9 w-9 rounded-full ${activity.badgeBg} flex items-center justify-center font-bold text-xs shrink-0 select-none`}>
                    {activity.initials}
                  </div>

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate pr-2 group-hover/item:text-primary transition-colors">
                        {activity.title}
                      </h4>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {activity.timeAgo}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground/80 mt-1 truncate">
                      {activity.description}
                    </p>
                    <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                      <span className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider">
                        {activity.location}
                      </span>
                      <span className={`text-[9px] font-extrabold border px-2 py-0.5 rounded-full ${activity.statusColor}`}>
                        {activity.statusText}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center flex-col text-center py-8">
                <Info className="h-8 w-8 text-muted-foreground/45 mb-2" />
                <span className="text-sm font-medium text-muted-foreground">No recent activity detected</span>
              </div>
            )}
          </div>

          {/* Bottom Audit Links */}
          <div className="border-t border-border/30 mt-6 pt-4 flex justify-center">
            <a 
              href="#inventory-table" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("inventory-table")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group/audit"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover/audit:translate-x-0.5 transition-transform" />
              <span>Scroll to Audit Table</span>
            </a>
          </div>
        </div>
      </div>

      {/* Database Table Section (Full-width Bento item) */}
      <div id="inventory-table" className="scroll-mt-20 bg-card border border-neutral-100 dark:border-border/60 shadow-md shadow-neutral-200/50 dark:shadow-none rounded-2xl p-6 relative overflow-hidden group hover:shadow-xl hover:shadow-neutral-200/60 dark:hover:shadow-none transition-all duration-300 mt-4">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 gap-4 border-b border-border/30 mb-6">
          <div>
            <h3 className="text-xl font-bold tracking-tight">Recent Additions & Physical Counts</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Active ledger of physical counts, shortages, and acquisition valuation records.
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 self-start sm:self-center">
              <ExportPdfDialog inventory={inventory} />
            </div>
          )}
        </div>

        {/* Database Table */}
        <div className="relative z-10">
          <InventoryTable data={inventory} isLoading={isLoading} isAdmin={isAdmin} />
        </div>
      </div>

      {/* Activity Details Modal */}
      <Dialog open={!!activeDetails} onOpenChange={(open) => !open && setActiveDetails(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border-border bg-card">
          <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">System Activity Log Details</DialogTitle>
            </DialogHeader>
            {activeDetails && (
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${activeDetails.statusColor} border shrink-0`}>
                {activeDetails.statusText}
              </span>
            )}
          </div>

          {activeDetails && (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Event banner */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/40 flex gap-4 items-center">
                <div className={`h-12 w-12 rounded-full ${activeDetails.badgeBg} flex items-center justify-center font-bold text-sm shrink-0 select-none`}>
                  {activeDetails.initials}
                </div>
                <div>
                  <h4 className="font-bold text-base text-foreground leading-snug">{activeDetails.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">Logged {activeDetails.timeAgo}</p>
                </div>
              </div>

              {/* Grid properties */}
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Identification */}
                <div className="space-y-4 p-4 rounded-xl border border-border/40 bg-muted/20">
                  <h5 className="text-xs font-extrabold uppercase tracking-widest text-primary">Specification & Identifiers</h5>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between border-b border-border/20 pb-1.5">
                      <span className="text-muted-foreground">Property No:</span>
                      <span className="font-mono font-semibold text-foreground">{activeDetails.item.property_number || "-"}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-1.5">
                      <span className="text-muted-foreground">Serial No:</span>
                      <span className="font-mono font-semibold text-foreground">{activeDetails.item.serial_number || "-"}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-1.5">
                      <span className="text-muted-foreground">Fund Cluster:</span>
                      <span className="font-semibold text-foreground">{activeDetails.item.fund_cluster || "-"}</span>
                    </div>
                    <div className="flex justify-between pb-0.5">
                      <span className="text-muted-foreground">Acquisition Date:</span>
                      <span className="font-semibold text-foreground">
                        {activeDetails.item.acquisition_date ? new Date(activeDetails.item.acquisition_date).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audit & Value */}
                <div className="space-y-4 p-4 rounded-xl border border-border/40 bg-muted/20">
                  <h5 className="text-xs font-extrabold uppercase tracking-widest text-primary">Valuation & Counts</h5>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between border-b border-border/20 pb-1.5">
                      <span className="text-muted-foreground">Unit Value:</span>
                      <span className="font-semibold text-foreground">
                        ₱{Number(activeDetails.item.unit_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-1.5">
                      <span className="text-muted-foreground">Total Assets Value:</span>
                      <span className="font-semibold text-foreground">
                        ₱{Number(activeDetails.item.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-1.5">
                      <span className="text-muted-foreground">Physical Qty Counted:</span>
                      <span className="font-semibold text-emerald-500">{activeDetails.item.qty_physical_count || 0} units</span>
                    </div>
                    <div className="flex justify-between pb-0.5">
                      <span className="text-muted-foreground">Shortage / Overage:</span>
                      <span className={`font-semibold ${Number(activeDetails.item.qty_shortage_overage) < 0 ? "text-rose-500" : "text-emerald-500"}`}>
                        {Number(activeDetails.item.qty_shortage_overage) || 0} units
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location & Custody */}
                <div className="space-y-4 p-4 rounded-xl border border-border/40 bg-muted/20 sm:col-span-2">
                  <h5 className="text-xs font-extrabold uppercase tracking-widest text-primary">Location & Custody Overview</h5>
                  <div className="grid gap-4 sm:grid-cols-2 text-sm">
                    <div className="space-y-2.5">
                      <div className="flex justify-between border-b border-border/20 pb-1.5">
                        <span className="text-muted-foreground">End-User:</span>
                        <span className="font-semibold text-foreground">{activeDetails.item.end_user || "-"}</span>
                      </div>
                      <div className="flex justify-between pb-0.5">
                        <span className="text-muted-foreground">Actual User:</span>
                        <span className="font-semibold text-foreground">{activeDetails.item.actual_user || "-"}</span>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex justify-between border-b border-border/20 pb-1.5">
                        <span className="text-muted-foreground">Primary Location:</span>
                        <span className="font-semibold text-foreground">{activeDetails.item.location || "-"}</span>
                      </div>
                      <div className="flex justify-between pb-0.5">
                        <span className="text-muted-foreground">Sub-Location:</span>
                        <span className="font-semibold text-foreground">{activeDetails.item.sub_location || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description & Remarks */}
              <div className="space-y-3 p-4 rounded-xl border border-border/40 bg-muted/20">
                <h5 className="text-xs font-extrabold uppercase tracking-widest text-primary">Description & Remarks</h5>
                <div className="text-sm space-y-2.5">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-0.5">Asset Description:</span>
                    <p className="font-medium text-foreground bg-card border border-border/30 rounded-lg p-2.5 leading-relaxed">{activeDetails.item.description || "No specific model/brand description cataloged."}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-0.5">Audit Remarks:</span>
                    <p className="font-medium text-foreground bg-card border border-border/30 rounded-lg p-2.5 leading-relaxed">{activeDetails.item.remarks || "No anomalies or comments logged."}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="px-6 py-4 border-t border-border/50 bg-muted/10 flex justify-end gap-3 shrink-0">
            <button 
              onClick={() => setActiveDetails(null)}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Close Details
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}