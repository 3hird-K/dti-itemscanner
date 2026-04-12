"use client";

import * as React from "react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
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
  MoreHorizontal, 
  Edit, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  QrCode,
  Download,
  Search,
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

  let resolvedColumns = [...columns];
  resolvedColumns.push({
    id: "actions",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
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
                    <Edit className="w-4 h-4 mr-2" /> Edit Item
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                    onClick={() => handleDelete(item.id)}
                    disabled={isDeleting === item.id}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  });

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-md">
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
                <TableRow key={index} className="border-b-[#2c2d3c]">
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
                  className="border-b-[#2c2d3c] hover:bg-white/5 transition-colors"
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
      <div className="flex items-center justify-between py-4 px-6 text-sm text-muted-foreground bg-card border-t border-border">
        <div>
          Showing {table.getFilteredRowModel().rows.length} of {data.length} items
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-8 w-[70px] bg-card border-border">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top" className="bg-card border-border text-muted-foreground">
                {[10, 20, 30, 40, 50].map((pageSize) => (
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
              className="hidden h-8 w-8 p-0 lg:flex bg-card border-border"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0 bg-card border-border"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0 bg-card border-border"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex bg-card border-border"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
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
