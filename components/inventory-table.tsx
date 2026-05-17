"use client";

import * as React from "react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Download,
  Search,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";

interface InventoryTableProps {
  data: any[];
  isLoading?: boolean;
  isAdmin?: boolean;
}

export function InventoryTable({ data, isLoading = false, isAdmin = false }: InventoryTableProps) {
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [viewingQr, setViewingQr] = useState<any | null>(null);
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    property_number: true,
    article: true,
    description: true,
    end_user: true,
    unit_value: true,
    qty_physical_count: true,
  });
  const [globalFilter, setGlobalFilter] = useState("");

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const updates = {
      article: formData.get("article"),
      description: formData.get("description"),
      property_number: formData.get("property_number"),
      unit_value: parseFloat(formData.get("unit_value") as string) || 0,
      qty_physical_count: parseInt(formData.get("qty_physical_count") as string) || 0,
    };

    const { error } = await supabase
      .from("inventory_items")
      .update(updates)
      .eq("id", editingItem.id);

    if (!error) {
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Record updated successfully");
    } else {
      toast.error("Error updating item: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;
    setIsDeleting(id);
    const { error } = await supabase.from("inventory_items").delete().eq("id", id);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Record deleted");
    } else {
      toast.error("Failed to delete item: " + error.message);
    }
    setIsDeleting(null);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "property_number",
      header: "Property No.",
      cell: ({ row }) => <div className="font-medium text-muted-foreground">{row.getValue("property_number") || "-"}</div>,
    },
    {
      accessorKey: "article",
      header: "Article",
      cell: ({ row }) => <div>{row.getValue("article") || "-"}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate" title={row.getValue("description")}>
          {row.getValue("description") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "end_user",
      header: "End-User",
      cell: ({ row }) => <div>{row.getValue("end_user") || "-"}</div>,
    },
    {
      accessorKey: "unit_value",
      header: () => <div className="text-right">Unit Value</div>,
      cell: ({ row }) => (
        <div className="text-right whitespace-nowrap">
          ₱{Number(row.getValue("unit_value") || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      accessorKey: "qty_physical_count",
      header: () => <div className="text-right">Qty (Physical)</div>,
      cell: ({ row }) => <div className="text-right font-semibold">{row.getValue("qty_physical_count") || 0}</div>,
    },
  ];

  const toggleableColumns = [
    { id: "property_number", label: "Property No.", locked: true },
    { id: "article", label: "Article" },
    { id: "description", label: "Description" },
    { id: "end_user", label: "End-User" },
    { id: "unit_value", label: "Unit Value" },
    { id: "qty_physical_count", label: "Qty (Physical)" },
  ];

  const table = useReactTable({
    data,
    columns, // Passed raw columns directly (no action column)
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      columnVisibility,
      globalFilter,
    },
  });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-md">
      {/* Controls: Search & Toggle Columns */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 gap-4 border-b border-border/40 select-none bg-card/50">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search records, locations, or users..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 pr-4 bg-card border-border rounded-full w-full h-10 shadow-sm"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 rounded-full bg-card border-border px-5 py-2 font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-muted/50 cursor-pointer shadow-sm">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <span>FILTER</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 bg-popover border border-border shadow-xl">
            <div className="px-3 py-2 text-[10px] font-extrabold text-muted-foreground tracking-widest uppercase border-b border-border/20 mb-1.5 select-none">
              TOGGLE COLUMNS
            </div>
            {toggleableColumns.map((col) => {
              const isVisible = columnVisibility[col.id] ?? true;
              return (
                <DropdownMenuItem
                  key={col.id}
                  disabled={col.locked}
                  onClick={(e) => {
                    if (col.locked) return;
                    e.preventDefault();
                    setColumnVisibility(prev => ({
                      ...prev,
                      [col.id]: !prev[col.id]
                    }));
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide cursor-pointer transition-colors ${
                    col.locked ? "opacity-45 cursor-not-allowed" : "hover:bg-muted"
                  }`}
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    {isVisible && <Check className="w-4 h-4 text-foreground stroke-[3px]" />}
                  </div>
                  <span className={isVisible ? "text-foreground" : "text-muted-foreground"}>
                    {col.label}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50 border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-xs font-semibold text-muted-foreground h-12">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="border-b border-border/40">
                  {table.getVisibleLeafColumns().map((column) => (
                    <TableCell key={column.id} className="py-4">
                      <Skeleton className="h-5 w-full opacity-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-border/40 hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No inventory items found. Upload an Excel file to get started.
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
              {[10, 20, 30, 40, 50].map((size) => (
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

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleEditSave} className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="property_number">Property Number</Label>
                <Input id="property_number" name="property_number" defaultValue={editingItem.property_number} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="article">Article</Label>
                <Input id="article" name="article" defaultValue={editingItem.article} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Brand, Model, Serial, etc.)</Label>
                <Input id="description" name="description" defaultValue={editingItem.description} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="unit_value">Unit Value (₱)</Label>
                  <Input id="unit_value" name="unit_value" type="number" step="0.01" defaultValue={editingItem.unit_value} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="qty_physical_count">Qty Physical Count</Label>
                  <Input id="qty_physical_count" name="qty_physical_count" type="number" defaultValue={editingItem.qty_physical_count} required />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
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
                  id="qr-code-svg-dashboard"
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
                <Button className="flex-1 gap-2" onClick={() => {
                  const svg = document.getElementById("qr-code-svg-dashboard");
                  if (!svg) return;
                  const svgData = new XMLSerializer().serializeToString(svg);
                  const canvas = document.createElement("canvas");
                  const ctx = canvas.getContext("2d");
                  const img = new Image();
                  img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height + 40;
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
                }}>
                  <Download className="w-4 h-4" /> Save PNG
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
