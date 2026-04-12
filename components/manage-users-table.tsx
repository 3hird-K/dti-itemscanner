"use client";

import * as React from "react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ColumnDef,
  ColumnFiltersState,
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Shield,
  User,
} from "lucide-react";

interface ManageUsersTableProps {
  data: any[];
  isLoading?: boolean;
  isAdmin?: boolean;
}

export function ManageUsersTable({ data, isLoading = false, isAdmin = false }: ManageUsersTableProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const updates = {
      firstname: formData.get("firstname"),
      lastname: formData.get("lastname"),
      account_type: formData.get("account_type"),
    };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", editingItem.id);

    if (!error) {
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("User profile updated safely");
    } else {
      toast.error("Error updating user: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to completely delete this user? This will remove both the profile AND authentication account permanently.")) return;
    setIsDeleting(id);
    
    try {
      const response = await fetch("/api/users/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error("Failed to delete user: " + (errorData.error || "Unknown error"));
        setIsDeleting(null);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("User completely deleted (profile + auth account)");
    } catch (error) {
      toast.error("Error deleting user: " + (error as Error).message);
    }
    setIsDeleting(null);
  };

  const baseColumns: ColumnDef<any>[] = [
    {
      accessorKey: "firstname",
      header: "First Name",
      cell: ({ row }) => (
        <div className="font-medium text-foreground">{row.getValue("firstname") || "-"}</div>
      ),
    },
    {
      accessorKey: "lastname",
      header: "Last Name",
      cell: ({ row }) => <div>{row.getValue("lastname") || "-"}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("email") || "-"}</div>,
    },
    {
      accessorKey: "account_type",
      header: "Account Type",
      cell: ({ row }) => {
        const role = row.getValue("account_type") as string;
        const isAdminCheck = role === "admin";
        
        return (
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            isAdminCheck 
              ? "bg-primary/20 text-primary border border-primary/30" 
              : "bg-muted text-muted-foreground"
          }`}>
            {isAdminCheck ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
            {role ? role.charAt(0).toUpperCase() + role.slice(1) : "User"}
          </div>
        );
      },
    },
  ];

  let resolvedColumns = [...baseColumns];

  if (isAdmin) {
    resolvedColumns.push({
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
                <DropdownMenuItem onClick={() => setEditingItem(item)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit Permissions
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                  onClick={() => handleDelete(item.id)}
                  disabled={isDeleting === item.id}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    });
  }

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      columnFilters,
      globalFilter,
    },
  });

  return (
    <div className="w-full space-y-4">
      {/* Search Input */}
      <div className="flex items-center justify-between">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-9 bg-card border-border rounded-full"
          />
        </div>
      </div>

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
                Array.from({ length: 5 }).map((_, index) => (
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
                    colSpan={resolvedColumns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No user records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between py-4 px-6 text-sm text-muted-foreground bg-card border-t border-border">
          <div>
            Showing {table.getFilteredRowModel().rows.length} of {data.length} users
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

      {/* Edit User Form Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleEditSave} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstname">First Name</Label>
                  <Input id="firstname" name="firstname" defaultValue={editingItem.firstname} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastname">Last Name</Label>
                  <Input id="lastname" name="lastname" defaultValue={editingItem.lastname} required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" defaultValue={editingItem.email} disabled className="opacity-50 cursor-not-allowed" title="Emails must be maintained through secure auth endpoints." />
              </div>
              <div className="grid gap-2 mt-4">
                <Label htmlFor="account_type">Account Type (Role)</Label>
                <Select name="account_type" defaultValue={editingItem.account_type || "user"}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User (Read-only)</SelectItem>
                    <SelectItem value="admin">Administrator (Full Access)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Administrators have full CRUD access across all tables automatically.
                </p>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
