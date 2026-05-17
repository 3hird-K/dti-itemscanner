"use client";

import * as React from "react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ColumnDef,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useProfile } from "@/hooks/use-profile";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  Search,
  QrCode,
  Printer,
  Download,
  Plus,
  CheckCircle,
  Calendar as CalendarIcon,
  Check,
  SlidersHorizontal,
  Box,
  DollarSign,
  Layers,
  Hourglass,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeSVG } from "qrcode.react";
import { Checkbox } from "@/components/ui/checkbox";

interface ManageDataTableProps {
  data: any[];
  isLoading?: boolean;
  isAdmin?: boolean;
  isStaff?: boolean;
}

// 26 columns based exactly on the Supabase schema
const columnsDef: ColumnDef<any>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const displayStatus = status || "pending";
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          displayStatus.toLowerCase() === "approved" ? "bg-green-500/20 text-green-500 border border-green-500/30" : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
        }`}>
          {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
        </span>
      );
    }
  },
  { accessorKey: "property_type", header: "Property Type" },
  { accessorKey: "fund_cluster", header: "Fund Cluster" },
  { accessorKey: "article", header: "Article" },
  { accessorKey: "acquisition_date", header: "Acquisition Date" },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="max-w-[250px] truncate" title={row.getValue("description")}>
        {row.getValue("description") || "-"}
      </div>
    ),
  },
  { accessorKey: "end_user", header: "End User" },
  { accessorKey: "office_center", header: "Office/Center" },
  { accessorKey: "serial_number", header: "Serial No." },
  { accessorKey: "ngas_number", header: "NGAS No." },
  { 
    accessorKey: "property_number", 
    header: "Property No.",
    cell: ({ row }) => {
      const propertyNumber = row.getValue("property_number") as string;
      const pendingEdits = row.original.pendingEdits || false;
      return (
        <div className="flex items-center gap-2">
          <span>{propertyNumber}</span>
          {pendingEdits && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-500 border border-blue-500/30">
              Pending Edit
            </span>
          )}
        </div>
      );
    }
  },
  { accessorKey: "unit_of_measure", header: "Unit" },
  {
    accessorKey: "unit_value",
    header: "Unit Value",
    cell: ({ row }) => `₱${Number(row.getValue("unit_value") || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
  },
  { accessorKey: "total_cost", header: "Total Cost" },
  { accessorKey: "qty_property_card", header: "Qty (Card)" },
  { accessorKey: "qty_physical_count", header: "Qty (Physical)" },
  { accessorKey: "qty_shortage_overage", header: "Qty Shortage" },
  { accessorKey: "value_shortage_overage", header: "Value Shortage" },
  { accessorKey: "remarks", header: "Remarks" },
  { accessorKey: "par_ics_ro", header: "PAR/ICS (RO)" },
  { accessorKey: "par_ics_received_by", header: "PAR/ICS Rcvd By" },
  { accessorKey: "par_ics_pos", header: "PAR/ICS POs" },
  { accessorKey: "actual_user", header: "Actual User" },
  { accessorKey: "location", header: "Location" },
  { accessorKey: "sub_location", header: "Sub-Location" },
  { accessorKey: "condition", header: "Condition" },
  { accessorKey: "tagging_number", header: "Tagging No." },
];

export function ManageDataTable({ data, isLoading = false, isAdmin = false, isStaff = false }: ManageDataTableProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  // Fetch pending edits for current user (or all if admin, though badge only needs existence)
  const { data: pendingEditsData } = useQuery({
    queryKey: ["pending_edits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_edits")
        .select("item_id")
        .eq("status", "pending");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Map pending edits
  const pendingEditItems = React.useMemo(() => {
    return new Set(pendingEditsData?.map(edit => edit.item_id) || []);
  }, [pendingEditsData]);

  // Attach pending flag to data
  const dataWithPending = React.useMemo(() => {
    return data.map(item => ({
      ...item,
      pendingEdits: pendingEditItems.has(item.id)
    }));
  }, [data, pendingEditItems]);

  // Dialog & Form states
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [acquisitionDate, setAcquisitionDate] = useState<Date | undefined>();

  React.useEffect(() => {
    if (editingItem?.acquisition_date) {
      setAcquisitionDate(new Date(editingItem.acquisition_date));
    } else {
      setAcquisitionDate(undefined);
    }
  }, [editingItem, isAdding]);

  // Table states
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    fund_cluster: false,
    office_center: false,
    serial_number: false,
    ngas_number: false,
    total_cost: false,
    qty_property_card: false,
    qty_shortage_overage: false,
    value_shortage_overage: false,
    par_ics_ro: false,
    par_ics_received_by: false,
    par_ics_pos: false,
    location: false,
    tagging_number: false,
    unit_of_measure: false,
    qty_physical_count: false,
    acquisition_date: false,
    property_number: false,
    remarks: false,
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredData = React.useMemo(() => {
    let result = dataWithPending;
    if (statusFilter !== "all") {
      result = result.filter(item => (item.status || "pending").toLowerCase() === statusFilter);
    }

    if (categoryFilter === "ppe") {
      return result.filter(item => Number(item.unit_value || 0) >= 50000);
    } else if (categoryFilter === "semi") {
      return result.filter(item => {
        const val = Number(item.unit_value || 0);
        return val >= 5000 && val < 50000;
      });
    }
    return result;
  }, [dataWithPending, categoryFilter, statusFilter]);

  // QR Modal States
  const [viewingQr, setViewingQr] = useState<any | null>(null);
  const [isBulkPrintView, setIsBulkPrintView] = useState(false);

  let columns: ColumnDef<any>[] = [...columnsDef];

  columns.push({
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewingQr(item)}>
                <QrCode className="w-4 h-4 mr-2" /> View QR Code
              </DropdownMenuItem>
              {isAdmin && item.status === "pending" && (
                <DropdownMenuItem onClick={() => handleApprove(item.id)}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Approve
                </DropdownMenuItem>
              )}
              {(isAdmin || isStaff) && (
                <DropdownMenuItem onClick={() => setEditingItem(item)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit Records
                </DropdownMenuItem>
              )}
              {isAdmin && (
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                  onClick={() => setDeleteConfirmItem(item)}
                  disabled={isDeleting === item.id}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  });

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    state: {
      columnVisibility,
      columnFilters,
      globalFilter,
      rowSelection,
    },
  });

  const handleDownloadQr = () => {
    if (!viewingQr) return;
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height + 40; // Add space for text
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        ctx.font = "16px monospace";
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.fillText(viewingQr.property_number || viewingQr.article, canvas.width / 2, canvas.height - 15);

        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `QR_${viewingQr.property_number || viewingQr.id}.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleBulkPrint = () => {
    setIsBulkPrintView(true);
    setTimeout(() => {
      window.print();
      setIsBulkPrintView(false);
    }, 500);
  };

  const selectedRowsData = table.getFilteredSelectedRowModel().rows.map(r => r.original);

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("inventory_items")
      .update({ status: "approved" })
      .eq("id", id);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Record approved successfully");
    } else {
      toast.error("Failed to approve item: " + error.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    // 16 Categorized editable fields
    const payload = {
      property_type: formData.get("property_type") || null,
      article: formData.get("article") || null,
      acquisition_date: formData.get("acquisition_date") || null,
      description: formData.get("description") || null,
      end_user: formData.get("end_user") || null,
      serial_number: formData.get("serial_number") || null,
      ngas_number: formData.get("ngas_number") || null,
      property_number: formData.get("property_number") || null,
      unit_of_measure: formData.get("unit_of_measure") || null,
      unit_value: formData.get("unit_value") ? parseFloat(formData.get("unit_value") as string) : null,
      remarks: formData.get("remarks") || null,
      par_ics_ro: formData.get("par_ics_ro") || null,
      actual_user: formData.get("actual_user") || null,
      sub_location: formData.get("sub_location") || null,
      condition: formData.get("condition") || null,
      tagging_number: formData.get("tagging_number") || null,
      fund_cluster: formData.get("fund_cluster") || null,
      office_center: formData.get("office_center") || null,
      total_cost: formData.get("total_cost") ? parseFloat(formData.get("total_cost") as string) : null,
      qty_property_card: formData.get("qty_property_card") ? parseInt(formData.get("qty_property_card") as string) : null,
      qty_physical_count: formData.get("qty_physical_count") ? parseInt(formData.get("qty_physical_count") as string) : null,
      qty_shortage_overage: formData.get("qty_shortage_overage") ? parseInt(formData.get("qty_shortage_overage") as string) : null,
      value_shortage_overage: formData.get("value_shortage_overage") ? parseFloat(formData.get("value_shortage_overage") as string) : null,
      par_ics_received_by: formData.get("par_ics_received_by") || null,
      par_ics_pos: formData.get("par_ics_pos") || null,
      location: formData.get("location") || null,
    };

    console.log("Payload being sent:", payload);

    if (isAdding) {
      (payload as any).status = isAdmin ? "approved" : "pending";
      const { data, error } = await supabase.from("inventory_items").insert([payload]);
      console.log("Insert response:", { data, error });
      if (!error) {
        setIsAdding(false);
        setCurrentStep(1);
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        toast.success("Record added successfully");
      } else {
        console.error("Insert error details:", error);
        toast.error("Error adding item: " + error.message);
      }
    } else if (editingItem) {
      if (!isAdmin) {
        // Staff edit - create pending edit
        if (!profile?.id) {
          toast.error("User profile not found. Cannot submit edit.");
          return;
        }
        const { data, error } = await supabase.from("pending_edits").insert([{
          item_id: editingItem.id,
          submitted_by: profile.id,
          changes: payload,
          status: "pending"
        }]);
        
        if (!error) {
          setEditingItem(null);
          setCurrentStep(1);
          queryClient.invalidateQueries({ queryKey: ["inventory"] });
          queryClient.invalidateQueries({ queryKey: ["pending_edits"] });
          toast.success("Edit submitted for admin approval.");
        } else {
          console.error("Pending edit insert error details:", error);
          toast.error("Error submitting edit: " + error.message);
        }
      } else {
        // Admin edit - direct update
        const { data, error } = await supabase
          .from("inventory_items")
          .update(payload)
          .eq("id", editingItem.id);

        console.log("Update response:", { data, error });
        if (!error) {
          setEditingItem(null);
          setCurrentStep(1);
          queryClient.invalidateQueries({ queryKey: ["inventory"] });
          toast.success("Record updated successfully");
        } else {
          console.error("Update error details:", error);
          toast.error("Error updating item: " + error.message);
        }
      }
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("inventory_items").delete().eq("id", id);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Record deleted");
    } else {
      toast.error("Failed to delete item: " + error.message);
    }
    setDeleteConfirmItem(null);
    setIsDeleting(null);
  };

  const handleBulkDelete = async () => {
    const ids = selectedRowsData.map((r) => r.id);
    if (!ids.length) return;

    setIsDeleting("bulk");
    const { error } = await supabase.from("inventory_items").delete().in("id", ids);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success(`Successfully deleted ${ids.length} records`);
      setRowSelection({}); // Clear table selection
    } else {
      toast.error("Failed to delete items: " + error.message);
    }
    setIsDeleting(null);
    setBulkDeleteConfirm(false);
  };

  const currentItem = isAdding ? {} : editingItem || {};

  const totalItems = data.length;
  const totalPhysicalQty = data.reduce((sum, item) => sum + Number(item.qty_physical_count || 0), 0);
  const totalValuation = data.reduce((sum, item) => sum + (Number(item.total_cost) || 0), 0);
  const formattedValuation = `₱${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const pendingApprovalsCount = data.filter(item => String(item.status).toLowerCase() === "pending").length;

  return (
    <div className="w-full space-y-6">
      {/* Dynamic Asset Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        
        {/* Card 1: Registered Items */}
        <div className="bg-card border border-border/40 rounded-2xl p-6 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-300 flex flex-col justify-between min-h-[140px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300 pointer-events-none">
            <Box className="w-24 h-24 stroke-[1.5px]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-extrabold text-muted-foreground tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              Registered Items
            </div>
            <div className="text-3xl font-black text-foreground tracking-tight pt-1">
              {totalItems}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/10">
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-500 uppercase tracking-wider">
              All Categories
            </span>
            <span className="text-[10px] font-medium text-muted-foreground truncate">
              Fully tracked assets
            </span>
          </div>
        </div>

        {/* Card 2: Physical Quantity */}
        <div className="bg-card border border-border/40 rounded-2xl p-6 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-300 flex flex-col justify-between min-h-[140px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300 pointer-events-none">
            <Layers className="w-24 h-24 stroke-[1.5px]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-extrabold text-muted-foreground tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Physical Qty
            </div>
            <div className="text-3xl font-black text-foreground tracking-tight pt-1">
              {totalPhysicalQty}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/10">
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 uppercase tracking-wider">
              In Stock
            </span>
            <span className="text-[10px] font-medium text-muted-foreground truncate">
              Verified on-hand count
            </span>
          </div>
        </div>

        {/* Card 3: Total Assets Val */}
        <div className="bg-card border border-border/40 rounded-2xl p-6 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-300 flex flex-col justify-between min-h-[140px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300 pointer-events-none">
            <DollarSign className="w-24 h-24 stroke-[1.5px]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-extrabold text-muted-foreground tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Total Assets Val
            </div>
            <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight pt-1">
              {formattedValuation}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/10">
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 uppercase tracking-wider">
              VALUATION
            </span>
            <span className="text-[10px] font-medium text-muted-foreground truncate">
              Aggregated net value
            </span>
          </div>
        </div>

        {/* Card 4: Pending Approvals */}
        <div className="bg-card border border-border/40 rounded-2xl p-6 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-300 flex flex-col justify-between min-h-[140px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300 pointer-events-none">
            <Hourglass className="w-24 h-24 stroke-[1.5px]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-extrabold text-muted-foreground tracking-widest uppercase">
              <span className={`w-1.5 h-1.5 rounded-full ${pendingApprovalsCount > 0 ? "bg-rose-500 animate-pulse" : "bg-slate-400"}`} />
              Pending Approvals
            </div>
            <div className="text-3xl font-black text-foreground tracking-tight pt-1">
              {pendingApprovalsCount}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/10">
            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
              pendingApprovalsCount > 0 ? "bg-rose-500/10 text-rose-500" : "bg-muted text-muted-foreground"
            }`}>
              {pendingApprovalsCount > 0 ? "Action Required" : "Up To Date"}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground truncate">
              Requires admin audit
            </span>
          </div>
        </div>

      </div>

      {/* Controls & Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search all columns..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 pr-4 bg-card border-border rounded-full w-full h-10 shadow-sm"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[330px] bg-card border-border rounded-full h-10 shadow-sm">
              <SelectValue placeholder="Categorize item..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="ppe">PPE - 50k and above</SelectItem>
              <SelectItem value="semi">Semi-expendable properties - 5,000 to 49,999.00</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-card border-border rounded-full h-10 shadow-sm">
              <SelectValue placeholder="Filter logically" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 lg:gap-3 justify-end">
          {selectedRowsData.length > 0 && (
            <>
              <Button onClick={handleBulkPrint} variant="secondary" className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 h-10 rounded-full">
                <Printer className="w-4 h-4" /> Print {selectedRowsData.length} Label{selectedRowsData.length > 1 && 's'}
              </Button>
              {isAdmin && (
                <Button onClick={() => setBulkDeleteConfirm(true)} variant="destructive" className="flex items-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive/20 border-none h-10 rounded-full">
                  <Trash2 className="w-4 h-4" /> Delete {selectedRowsData.length} Item{selectedRowsData.length > 1 && 's'}
                </Button>
              )}
            </>
          )}

          {(isAdmin || isStaff) && (
            <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2 h-10 rounded-full px-5">
              <Plus className="w-4 h-4" /> Add Data
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 rounded-full bg-card border-border px-5 py-2 font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-muted/50 cursor-pointer shadow-sm">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <span>FILTER</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 bg-popover border border-border shadow-xl max-h-[350px] overflow-y-auto">
              <div className="px-3 py-2 text-[10px] font-extrabold text-muted-foreground tracking-widest uppercase border-b border-border/20 mb-1.5 select-none sticky top-0 bg-popover z-10">
                TOGGLE COLUMNS
              </div>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const isVisible = column.getIsVisible();
                  const label = typeof column.columnDef.header === 'string' 
                    ? column.columnDef.header 
                    : column.id.replace(/_/g, " ");
                  
                  // Protect property_number from being hidden
                  const isLocked = column.id === "property_number";

                  return (
                    <DropdownMenuItem
                      key={column.id}
                      disabled={isLocked}
                      onClick={(e) => {
                        if (isLocked) return;
                        e.preventDefault();
                        column.toggleVisibility(!isVisible);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide cursor-pointer transition-colors ${
                        isLocked ? "opacity-45 cursor-not-allowed" : "hover:bg-muted"
                      }`}
                    >
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        {isVisible && <Check className="w-4 h-4 text-foreground stroke-[3px]" />}
                      </div>
                      <span className={isVisible ? "text-foreground" : "text-muted-foreground text-[11px]"}>
                        {label}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-none">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="text-xs font-semibold text-muted-foreground h-10 whitespace-nowrap">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, index) => (
                  <TableRow key={index} className="border-b border-border/40">
                    {table.getVisibleLeafColumns().map((column) => (
                      <TableCell key={column.id} className="py-3">
                        <Skeleton className="h-6 w-full opacity-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-b border-border/40 hover:bg-muted/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No data found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="flex items-center justify-between py-6 px-6 text-xs text-muted-foreground bg-card border-t border-border/40 font-bold uppercase tracking-wider select-none">
          
          {/* Bottom Left: Rows & Total */}
          <div className="flex items-center gap-6">
            {/* Rows Dropdown Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors bg-muted/40 px-3 py-1.5 rounded-lg border border-border/20 text-[11px] font-bold">
                  <span>{table.getState().pagination.pageSize} ROWS</span>
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-popover border border-border rounded-xl p-1 shadow-lg min-w-[100px]">
                {[10, 20, 30, 40, 50, 100].map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => table.setPageSize(size)}
                    className="px-3 py-2 text-xs font-bold uppercase cursor-pointer rounded-lg hover:bg-muted"
                  >
                    {size} Rows
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Total Count */}
            <span className="text-[11px] text-muted-foreground/60 hidden sm:inline-block">
              {data.length} TOTAL RECORDS
            </span>
          </div>

          {/* Bottom Right: Page Info & Chevrons */}
          <div className="flex items-center gap-6">
            <span className="text-[11px] text-muted-foreground/60 font-mono">
              PAGE {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
            </span>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8 w-8 rounded-lg flex items-center justify-center border border-border/30 bg-muted/20 hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8 w-8 rounded-lg flex items-center justify-center border border-border/30 bg-muted/20 hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Form Dialog - Scrollable */}
      <Dialog open={isAdding || !!editingItem} onOpenChange={(open) => {
        if (!open) {
          setIsAdding(false);
          setEditingItem(null);
          setCurrentStep(1);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <DialogTitle>{isAdding ? "Add New Record" : "Edit Record Data"} - Step {currentStep} of 3</DialogTitle>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-between px-6 py-3 bg-muted/20 border-b border-border">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold mb-1 transition-colors text-sm ${
                    step === currentStep
                      ? "bg-blue-500 text-white"
                      : step < currentStep
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {step < currentStep ? "✓" : step}
                </div>
                <span className="text-xs text-center font-medium text-muted-foreground">
                  {step === 1 && "Identifiers"}
                  {step === 2 && "Specifications"}
                  {step === 3 && "Tracking"}
                </span>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 overflow-y-auto flex-1">
            <form id="record-form" onSubmit={handleSave} className="space-y-4" onKeyPress={(e) => {
              if (e.key === 'Enter' && currentStep < 3) {
                e.preventDefault();
              }
            }}>

              {/* Step 1: Identifiers & Categorization */}
              <div style={{ display: currentStep === 1 ? 'block' : 'none' }} className="space-y-4">
                <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">Identifiers & Categorization</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="property_number">Property Number</Label>
                    <Input id="property_number" name="property_number" defaultValue={currentItem.property_number} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="property_type">Property Type (PPE)</Label>
                    <Input id="property_type" name="property_type" defaultValue={currentItem.property_type} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ngas_number">NGAS No.</Label>
                    <Input id="ngas_number" name="ngas_number" defaultValue={currentItem.ngas_number} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="article">Article</Label>
                    <Input id="article" name="article" defaultValue={currentItem.article} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fund_cluster">Fund Cluster</Label>
                    <Input id="fund_cluster" name="fund_cluster" defaultValue={currentItem.fund_cluster} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="office_center">Office/Center</Label>
                    <Input id="office_center" name="office_center" defaultValue={currentItem.office_center} />
                  </div>
                </div>
              </div>

              {/* Step 2: Specifications & Value */}
              <div style={{ display: currentStep === 2 ? 'block' : 'none' }} className="space-y-4">
                <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">Specifications & Value</h4>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Brand, Model, Size, Color, etc.)</Label>
                    <Input id="description" name="description" defaultValue={currentItem.description} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="serial_number">Serial No.</Label>
                      <Input id="serial_number" name="serial_number" defaultValue={currentItem.serial_number} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tagging_number">Tagging No.</Label>
                      <Input id="tagging_number" name="tagging_number" defaultValue={currentItem.tagging_number} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="unit_of_measure">Unit of Measure</Label>
                      <Input id="unit_of_measure" name="unit_of_measure" defaultValue={currentItem.unit_of_measure} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="unit_value">Unit Value (₱)</Label>
                      <Input id="unit_value" name="unit_value" type="number" step="0.01" defaultValue={currentItem.unit_value} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="total_cost">Total Cost (₱)</Label>
                      <Input id="total_cost" name="total_cost" type="number" step="0.01" defaultValue={currentItem.total_cost} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="qty_property_card">Qty (Card)</Label>
                      <Input id="qty_property_card" name="qty_property_card" type="number" defaultValue={currentItem.qty_property_card} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="qty_physical_count">Qty (Physical)</Label>
                      <Input id="qty_physical_count" name="qty_physical_count" type="number" defaultValue={currentItem.qty_physical_count} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="qty_shortage_overage">Shortage/Overage (Qty)</Label>
                      <Input id="qty_shortage_overage" name="qty_shortage_overage" type="number" defaultValue={currentItem.qty_shortage_overage} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="value_shortage_overage">Shortage/Overage (Value)</Label>
                      <Input id="value_shortage_overage" name="value_shortage_overage" type="number" step="0.01" defaultValue={currentItem.value_shortage_overage} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Acquisition Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal bg-card border-border",
                              !acquisitionDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {acquisitionDate ? format(acquisitionDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={acquisitionDate}
                            onSelect={setAcquisitionDate}
                            initialFocus
                            captionLayout="dropdown"
                            startMonth={new Date(1980, 0)}
                            endMonth={new Date(2040, 11)}
                          />
                        </PopoverContent>
                      </Popover>
                      <input type="hidden" name="acquisition_date" value={acquisitionDate ? format(acquisitionDate, "yyyy-MM-dd") : ""} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="condition">Condition</Label>
                      <Input id="condition" name="condition" defaultValue={currentItem.condition} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: User & Location Tracking */}
              <div style={{ display: currentStep === 3 ? 'block' : 'none' }} className="space-y-4">
                <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">User & Location Tracking</h4>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="end_user">End-User</Label>
                      <Input id="end_user" name="end_user" defaultValue={currentItem.end_user} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="actual_user">Actual User</Label>
                      <Input id="actual_user" name="actual_user" defaultValue={currentItem.actual_user} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="sub_location">Sub-Location / Whereabouts</Label>
                      <Input id="sub_location" name="sub_location" defaultValue={currentItem.sub_location} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" name="location" defaultValue={currentItem.location} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="par_ics_ro">PAR/ICS NO. (RO)</Label>
                      <Input id="par_ics_ro" name="par_ics_ro" defaultValue={currentItem.par_ics_ro} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="par_ics_pos">PAR/ICS NO. (POs)</Label>
                      <Input id="par_ics_pos" name="par_ics_pos" defaultValue={currentItem.par_ics_pos} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="par_ics_received_by">PAR/ICS Received By</Label>
                      <Input id="par_ics_received_by" name="par_ics_received_by" defaultValue={currentItem.par_ics_received_by} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Input id="remarks" name="remarks" defaultValue={currentItem.remarks} />
                  </div>
                </div>
              </div>

            </form>
          </div>

          <div className="px-6 py-4 border-t border-border flex gap-2 bg-muted/20">
            <Button 
              type="button" 
              variant="outline" 
              onClick={(e) => {
                e.preventDefault();
                setIsAdding(false); 
                setEditingItem(null); 
                setCurrentStep(1);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={(e) => {
                e.preventDefault();
                handlePrevious();
              }}
              disabled={currentStep === 1}
              variant="outline"
            >
              Previous
            </Button>
            {currentStep < 3 ? (
              <Button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  handleNext();
                }}
                className="flex-1"
              >
                Next
              </Button>
            ) : (
              <Button 
                type="submit" 
                form="record-form"
                className="flex-1"
              >
                {isAdding ? "Save New Record" : "Update Record"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmItem} onOpenChange={(open) => !open && setDeleteConfirmItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Record</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to permanently delete this record?
            </p>
            <div className="bg-muted/50 p-3 rounded-lg border border-border">
              <p className="text-sm font-semibold">{deleteConfirmItem?.article || deleteConfirmItem?.property_number || "Unknown"}</p>
              <p className="text-xs text-muted-foreground mt-1">{deleteConfirmItem?.description || "No description"}</p>
            </div>
            <p className="text-xs text-destructive mt-4">This action cannot be undone.</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setDeleteConfirmItem(null)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              disabled={isDeleting === deleteConfirmItem?.id}
              onClick={() => {
                setIsDeleting(deleteConfirmItem?.id);
                handleDelete(deleteConfirmItem?.id);
              }}
            >
              {isDeleting === deleteConfirmItem?.id ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Bulk Delete Records</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to permanently delete {selectedRowsData.length} selected records?
            </p>
            <p className="text-xs text-destructive mt-4">This action cannot be undone.</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setBulkDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              disabled={isDeleting === "bulk"}
              onClick={handleBulkDelete}
            >
              {isDeleting === "bulk" ? "Deleting..." : "Delete All Selected"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Single View Modal */}
      <Dialog open={!!viewingQr} onOpenChange={(open) => !open && setViewingQr(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Item QR Code</DialogTitle>
          </DialogHeader>
          {viewingQr && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/50">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={`${window.location.origin}/item/${viewingQr.id}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-bold text-lg">{viewingQr.article || "Unknown Article"}</h3>
                <p className="font-mono text-sm text-muted-foreground">{viewingQr.property_number || viewingQr.id}</p>
              </div>

              <div className="flex w-full gap-2 pt-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => window.open(`/item/${viewingQr.id}`, "_blank")}>
                  <Search className="w-4 h-4" /> View Page
                </Button>
                <Button className="flex-1 gap-2" onClick={handleDownloadQr}>
                  <Download className="w-4 h-4" /> Save PNG
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden Bulk Print View */}
      {isBulkPrintView && (
        <div className="fixed inset-0 z-[9999] bg-white text-black p-8 overflow-auto flex flex-wrap gap-8 content-start print:block print:bg-white pb-[200px]">
          <style>{`
            @media print {
              @page { margin: 0.5in; }
              body * { visibility: hidden; }
              #bulk-print-container, #bulk-print-container * { visibility: visible; }
              #bulk-print-container { position: absolute; left: 0; top: 0; width: 100%; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
            }
          `}</style>
          <div id="bulk-print-container" className="grid grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
            {selectedRowsData.map((item: any) => (
              <div key={item.id} className="border border-black p-4 flex flex-col items-center text-center page-break-inside-avoid">
                <QRCodeSVG
                  value={`${window.location.origin}/item/${item.id}`}
                  size={120}
                  level="M"
                />
                <h4 className="font-bold text-[11px] mt-3 uppercase tracking-wider">{item.article || "ASSET"}</h4>
                <p className="font-mono text-[10px] mt-1">{item.property_number || item.id}</p>
                <p className="text-[8px] text-gray-500 mt-2">DTI-CDO Registry</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
