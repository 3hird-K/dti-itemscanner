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
import { useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeSVG } from "qrcode.react";
import { Checkbox } from "@/components/ui/checkbox";

interface ManageDataTableProps {
  data: any[];
  isLoading?: boolean;
  isAdmin?: boolean;
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
  { accessorKey: "property_number", header: "Property No." },
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

export function ManageDataTable({ data, isLoading = false, isAdmin = false }: ManageDataTableProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Dialog & Form states
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any | null>(null);

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
              {isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => setEditingItem(item)}>
                    <Edit className="w-4 h-4 mr-2" /> Edit Records
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                    onClick={() => setDeleteConfirmItem(item)}
                    disabled={isDeleting === item.id}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  });

  const table = useReactTable({
    data,
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
    };

    console.log("Payload being sent:", payload);

    if (isAdding) {
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

  const currentItem = isAdding ? {} : editingItem || {};

  return (
    <div className="w-full space-y-4">
      {/* Controls & Search */}
      <div className="flex items-center justify-between">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search all columns..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-9 bg-card border-border rounded-full"
          />
        </div>

        <div className="flex items-center gap-3">
          {selectedRowsData.length > 0 && (
            <Button onClick={handleBulkPrint} variant="secondary" className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20">
              <Printer className="w-4 h-4" /> Print {selectedRowsData.length} Label{selectedRowsData.length > 1 && 's'}
            </Button>
          )}

          {isAdmin && (
            <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Data
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px] max-h-[300px] overflow-y-auto">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id.replace(/_/g, " ")}
                    </DropdownMenuCheckboxItem>
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
                  <TableRow key={index} className="border-b-[#2c2d3c]">
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
                    className="border-b-[#2c2d3c] hover:bg-white/5 transition-colors"
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

        {/* Pagination Footer */}
        <div className="flex items-center justify-between py-4 px-6 text-sm text-muted-foreground bg-card border-t border-border">
          <div>
            Showing {table.getFilteredRowModel().rows.length} of {data.length} records
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="h-8 w-[70px] bg-card border-border">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top" className="bg-card border-border">
                  {[10, 20, 30, 40, 50, 100].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount() || 1}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0 lg:flex bg-card"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0 bg-card"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0 bg-card"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0 lg:flex bg-card"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="acquisition_date">Acquisition Date</Label>
                      <Input id="acquisition_date" name="acquisition_date" type="date" defaultValue={currentItem.acquisition_date} />
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
                  <div className="grid gap-2">
                    <Label htmlFor="sub_location">Sub-Location / Whereabouts</Label>
                    <Input id="sub_location" name="sub_location" defaultValue={currentItem.sub_location} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="par_ics_ro">PAR/ICS NO. (RO)</Label>
                    <Input id="par_ics_ro" name="par_ics_ro" defaultValue={currentItem.par_ics_ro} />
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
