"use client";

import * as React from "react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOnlinePresence } from "@/components/online-presence-provider";
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
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Check,
  SlidersHorizontal,
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
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    id: true,
    firstname: true,
    lastname: true,
    email: true,
    account_type: true,
  });
  const onlineUserIds = useOnlinePresence();

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

  const handleDelete = async (id: string | null) => {
    if (!id) return;
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
        setDeleteConfirmUser(null);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("User completely deleted (profile + auth account)");
      setEditingItem(null);
    } catch (error) {
      toast.error("Error deleting user: " + (error as Error).message);
    }
    setIsDeleting(null);
    setDeleteConfirmUser(null);
  };

  const resolvedColumns: ColumnDef<any>[] = [
    {
      accessorKey: "id",
      header: "Profile ID",
      cell: ({ row }) => {
        const isOnline = onlineUserIds.includes(row.original.id);
        return (
          <div className="flex items-center gap-1.5">
            {isOnline && (
              <span className="relative flex h-2.5 w-2.5" title="Online">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
            <button
              onClick={() => setEditingItem(row.original)}
              className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer px-2 py-1 rounded-md transition-colors hover:bg-primary/20"
            >
              {String(row.getValue("id")).split('-')[0].toUpperCase()}
            </button>
          </div>
        );
      },
    },
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
        const isStaffCheck = role === "staff";

        return (
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isAdminCheck
            ? "bg-primary/20 text-primary border border-primary/30"
            : isStaffCheck
              ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
              : "bg-muted text-muted-foreground"
            }`}>
            {isAdminCheck ? <Shield className="w-3 h-3" /> : isStaffCheck ? <User className="w-3 h-3" /> : <User className="w-3 h-3" />}
            {role ? role.charAt(0).toUpperCase() + role.slice(1) : "User"}
          </div>
        );
      },
    },
  ];

  const toggleableColumns = [
    { id: "id", label: "Profile ID", locked: true },
    { id: "firstname", label: "First Name" },
    { id: "lastname", label: "Last Name" },
    { id: "email", label: "Email" },
    { id: "account_type", label: "Account Type" },
  ];

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-md">
        {/* Controls: Search & Toggle Columns */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 gap-4 border-b border-border/40 select-none bg-card/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
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
                      <TableHead key={header.id} className="text-xs font-semibold text-muted-foreground h-12 whitespace-nowrap">
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
                    colSpan={table.getVisibleLeafColumns().length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No user records found.
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
              {data.length} TOTAL USERS
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

      {/* Edit User Form Sheet */}
      <Sheet open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit User Profile</SheetTitle>
            <SheetDescription className="sr-only">Update user data and role access here.</SheetDescription>
          </SheetHeader>

          {editingItem && (
            <div className="flex flex-col py-6 w-full">
              <div className="flex flex-col items-center text-center space-y-4 mb-8 pb-6 border-b border-border/50">
                <div className="relative inline-block">
                  <Avatar className="w-24 h-24 border-[4px] border-background shadow-lg shadow-black/10">
                    {editingItem.avatar_url && (
                      <AvatarImage src={editingItem.avatar_url} alt="Profile Picture" className="object-cover" />
                    )}
                    <AvatarFallback className="text-3xl font-medium tracking-tight bg-primary/10 text-primary">
                      {(editingItem.firstname?.charAt(0) || "") + (editingItem.lastname?.charAt(0) || "")}
                    </AvatarFallback>
                  </Avatar>

                  {/* Online/Offline Status Indicator */}
                  <span
                    className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-[3px] border-background shadow-sm transition-colors duration-300 ${onlineUserIds.includes(editingItem.id) ? 'bg-emerald-500' : 'bg-slate-400/80'
                      }`}
                    title={onlineUserIds.includes(editingItem.id) ? 'Online' : 'Offline'}
                  >
                    {onlineUserIds.includes(editingItem.id) && (
                      <span className="inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50"></span>
                    )}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-xl tracking-tight">{editingItem.firstname} {editingItem.lastname}</h3>
                  <p className="text-sm text-muted-foreground">{editingItem.email}</p>
                </div>
              </div>

              <form onSubmit={handleEditSave} className="space-y-4 px-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstname">First Name</Label>
                    <Input id="firstname" name="firstname" defaultValue={editingItem.firstname} required disabled={!isAdmin} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastname">Last Name</Label>
                    <Input id="lastname" name="lastname" defaultValue={editingItem.lastname} required disabled={!isAdmin} />
                  </div>
                </div>

                <div className="grid gap-2 pt-2">
                  <Label htmlFor="account_type">Account Type (Role)</Label>
                  <Select name="account_type" defaultValue={editingItem.account_type || "user"} disabled={!isAdmin}>
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User (Read-only)</SelectItem>
                      <SelectItem value="staff">Staff (Semi-Access)</SelectItem>
                      <SelectItem value="admin">Administrator (Full Access)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] font-medium text-muted-foreground mt-1.5 leading-relaxed bg-muted/50 p-2.5 rounded-lg border border-border/30">
                    Administrators have full CRUD access. Staff can add data but requires an Admin to officially approve it.
                  </p>
                </div>

                <SheetFooter className="mt-8 pt-6 border-t border-border/50 block space-y-3 sm:space-y-3 sm:space-x-0 w-full px-0">
                  <div className="flex gap-3 w-full">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingItem(null)}>
                      {isAdmin ? "Cancel" : "Close"}
                    </Button>
                    {isAdmin && (
                      <Button type="submit" className="flex-1">Save Changes</Button>
                    )}
                  </div>
                  {isAdmin && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full mt-3"
                      disabled={isDeleting === editingItem.id || deleteConfirmUser === editingItem.id}
                      onClick={() => setDeleteConfirmUser(editingItem.id)}
                    >
                      {isDeleting === editingItem.id ? "Deleting..." : "Delete Profile"}
                    </Button>
                  )}
                </SheetFooter>
              </form>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete User Form Dialog */}
      <Dialog open={!!deleteConfirmUser} onOpenChange={(open) => !open && setDeleteConfirmUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete User Account</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-foreground mb-4 font-medium">
              Are you absolutely sure you want to delete this user?
            </p>
            <p className="text-[12px] font-medium text-destructive mt-4 leading-relaxed bg-destructive/10 p-3 rounded-md border border-destructive/20">
              This action cannot be undone. This will permanently remove their user profile as well as their main authentication account!
            </p>
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmUser(null)}
              disabled={!!isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!!isDeleting}
              onClick={() => handleDelete(deleteConfirmUser)}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
