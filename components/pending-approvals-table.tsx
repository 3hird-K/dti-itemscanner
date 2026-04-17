"use client";

import * as React from "react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function PendingApprovalsTable() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [reviewingEdit, setReviewingEdit] = useState<any | null>(null);

  const { data: pendingEdits = [], isLoading } = useQuery({
    queryKey: ["admin_pending_edits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_edits")
        .select(`
          *,
          inventory_items:item_id (*),
          profiles:submitted_by (firstname, lastname, email)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const handleApprove = async (edit: any) => {
    // 1. Update the inventory item with changes
    const { data: updateData, error: updateError } = await supabase
      .from("inventory_items")
      .update({ ...edit.changes, status: "approved" })
      .eq("id", edit.item_id)
      .select();

    if (updateError || !updateData || updateData.length === 0) {
      toast.error("Failed to update item. You might not have permission.");
      return;
    }

    // 2. Mark pending edit as approved
    const { data: statusData, error: statusError } = await supabase
      .from("pending_edits")
      .update({ status: "approved" })
      .eq("id", edit.id)
      .select();

    if (statusError || !statusData || statusData.length === 0) {
      toast.error("Item updated but failed to mark edit as approved due to permissions.");
    } else {
      toast.success("Edit approved successfully!");
      setReviewingEdit(null);
      queryClient.invalidateQueries({ queryKey: ["admin_pending_edits"] });
      queryClient.invalidateQueries({ queryKey: ["admin_pending_count"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["pending_edits"] });
    }
  };

  const handleReject = async (id: string) => {
    const { data, error } = await supabase
      .from("pending_edits")
      .update({ status: "rejected" })
      .eq("id", id)
      .select();

    if (error || !data || data.length === 0) {
      toast.error("Failed to reject edit. You might not have permission.");
    } else {
      toast.success("Edit rejected.");
      setReviewingEdit(null);
      queryClient.invalidateQueries({ queryKey: ["admin_pending_edits"] });
      queryClient.invalidateQueries({ queryKey: ["admin_pending_count"] });
      queryClient.invalidateQueries({ queryKey: ["pending_edits"] });
    }
  };

  // Helper to get formatted changes
  const getChangedFields = (current: any, proposed: any) => {
    const changes: any[] = [];
    for (const key in proposed) {
      if (proposed[key] !== current[key] && proposed[key] !== null && proposed[key] !== undefined) {
        changes.push({
          field: key.replace(/_/g, " "),
          old: current[key] || "None",
          new: proposed[key]
        });
      }
    }
    return changes;
  };

  return (
    <div className="w-full space-y-4">
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border">
              <TableRow className="border-none">
                <TableHead className="font-semibold text-muted-foreground h-10">Item Property No.</TableHead>
                <TableHead className="font-semibold text-muted-foreground h-10">Article</TableHead>
                <TableHead className="font-semibold text-muted-foreground h-10">Submitted By</TableHead>
                <TableHead className="font-semibold text-muted-foreground h-10">Date Submitted</TableHead>
                <TableHead className="font-semibold text-muted-foreground h-10 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="border-b-[#2c2d3c]">
                    {Array.from({ length: 5 }).map((_, cellIdx) => (
                      <TableCell key={cellIdx} className="py-3">
                        <Skeleton className="h-6 w-full opacity-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : pendingEdits.length > 0 ? (
                pendingEdits.map((edit: any) => (
                  <TableRow key={edit.id} className="border-b-[#2c2d3c] hover:bg-white/5 transition-colors">
                    <TableCell className="font-medium">{edit.inventory_items?.property_number || "-"}</TableCell>
                    <TableCell>{edit.inventory_items?.article || "-"}</TableCell>
                    <TableCell>
                      {edit.profiles ? `${edit.profiles.firstname || ""} ${edit.profiles.lastname || ""}`.trim() : "Unknown"}
                    </TableCell>
                    <TableCell>
                      {edit.created_at ? format(new Date(edit.created_at), "PPp") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setReviewingEdit(edit)} className="flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No pending edits to review.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!reviewingEdit} onOpenChange={(open) => !open && setReviewingEdit(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Proposed Changes</DialogTitle>
          </DialogHeader>
          
          {reviewingEdit && (
            <div className="space-y-6 mt-4">
              <div className="bg-muted/20 p-4 rounded-lg border border-border">
                <h4 className="text-sm font-semibold mb-2">Item Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Property No:</span> {reviewingEdit.inventory_items?.property_number || "-"}</div>
                  <div><span className="text-muted-foreground">Article:</span> {reviewingEdit.inventory_items?.article || "-"}</div>
                  <div><span className="text-muted-foreground">Submitted By:</span> {reviewingEdit.profiles ? `${reviewingEdit.profiles.firstname || ""} ${reviewingEdit.profiles.lastname || ""}` : "Unknown"}</div>
                  <div><span className="text-muted-foreground">Date:</span> {format(new Date(reviewingEdit.created_at), "PPp")}</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3">Changes</h4>
                <ScrollArea className="max-h-[300px]">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Field</TableHead>
                        <TableHead className="w-1/3">Current Value</TableHead>
                        <TableHead className="w-1/3">Proposed Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getChangedFields(reviewingEdit.inventory_items, reviewingEdit.changes).length > 0 ? (
                        getChangedFields(reviewingEdit.inventory_items, reviewingEdit.changes).map((change, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium capitalize">{change.field}</TableCell>
                            <TableCell className="text-red-400 line-through">{String(change.old)}</TableCell>
                            <TableCell className="text-green-400 font-semibold">{String(change.new)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                            No modifications detected compared to current data.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
                <Button variant="outline" onClick={() => setReviewingEdit(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => handleReject(reviewingEdit.id)} className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Reject
                </Button>
                <Button onClick={() => handleApprove(reviewingEdit)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle className="w-4 h-4" /> Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
