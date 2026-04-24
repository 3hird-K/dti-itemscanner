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

  const { data: pendingTasks = [], isLoading } = useQuery({
    queryKey: ["admin_pending_tasks"],
    queryFn: async () => {
      const { data: editsData, error: editsError } = await supabase
        .from("pending_edits")
        .select(`
          *,
          inventory_items:item_id (*),
          profiles:submitted_by (firstname, lastname, email)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      
      if (editsError) throw editsError;

      const { data: newData, error: newError } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (newError) throw newError;

      const tasks = [
        ...(editsData || []).map(edit => ({
          type: "edit",
          id: edit.id,
          item_id: edit.item_id,
          property_number: edit.inventory_items?.property_number || "-",
          article: edit.inventory_items?.article || "-",
          submitted_by: edit.profiles ? `${edit.profiles.firstname || ""} ${edit.profiles.lastname || ""}`.trim() : "Unknown",
          created_at: edit.created_at,
          changes: edit.changes,
          inventory_items: edit.inventory_items
        })),
        ...(newData || []).map(item => ({
          type: "new",
          id: item.id,
          property_number: item.property_number || "-",
          article: item.article || "-",
          submitted_by: "Staff (New Record)",
          created_at: item.created_at,
          changes: item,
          inventory_items: {}
        }))
      ];

      return tasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
  });

  const handleApprove = async (task: any) => {
    if (task.type === "edit") {
      const { data: updateData, error: updateError } = await supabase
        .from("inventory_items")
        .update({ ...task.changes, status: "approved" })
        .eq("id", task.item_id)
        .select();

      if (updateError || !updateData || updateData.length === 0) {
        toast.error("Failed to update item. You might not have permission.");
        return;
      }

      const { data: statusData, error: statusError } = await supabase
        .from("pending_edits")
        .update({ status: "approved" })
        .eq("id", task.id)
        .select();

      if (statusError || !statusData || statusData.length === 0) {
        toast.error("Item updated but failed to mark edit as approved due to permissions.");
      } else {
        toast.success("Edit approved successfully!");
      }
    } else {
      const { error } = await supabase
        .from("inventory_items")
        .update({ status: "approved" })
        .eq("id", task.id);

      if (error) {
        toast.error("Failed to approve new item: " + error.message);
      } else {
        toast.success("New record approved successfully!");
      }
    }

    setReviewingEdit(null);
    queryClient.invalidateQueries({ queryKey: ["admin_pending_tasks"] });
    queryClient.invalidateQueries({ queryKey: ["admin_pending_count"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["pending_edits"] });
  };

  const handleReject = async (task: any) => {
    if (task.type === "edit") {
      const { data, error } = await supabase
        .from("pending_edits")
        .update({ status: "rejected" })
        .eq("id", task.id)
        .select();

      if (error || !data || data.length === 0) {
        toast.error("Failed to reject edit. You might not have permission.");
      } else {
        toast.success("Edit rejected.");
      }
    } else {
      const { error } = await supabase
        .from("inventory_items")
        .update({ status: "rejected" })
        .eq("id", task.id);

      if (error) {
        toast.error("Failed to reject new item: " + error.message);
      } else {
        toast.success("New record rejected.");
      }
    }

    setReviewingEdit(null);
    queryClient.invalidateQueries({ queryKey: ["admin_pending_tasks"] });
    queryClient.invalidateQueries({ queryKey: ["admin_pending_count"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["pending_edits"] });
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
              ) : pendingTasks.length > 0 ? (
                pendingTasks.map((task: any) => (
                  <TableRow key={task.id} className="border-b-[#2c2d3c] hover:bg-white/5 transition-colors">
                    <TableCell className="font-medium">{task.property_number}</TableCell>
                    <TableCell>{task.article}</TableCell>
                    <TableCell>
                      {task.type === "new" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-500 border border-blue-500/30 mr-2">
                          New
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-500 border border-purple-500/30 mr-2">
                          Edit
                        </span>
                      )}
                      {task.submitted_by}
                    </TableCell>
                    <TableCell>
                      {task.created_at ? format(new Date(task.created_at), "PPp") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setReviewingEdit(task)} className="flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No pending items to review.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!reviewingEdit} onOpenChange={(open) => !open && setReviewingEdit(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <DialogHeader>
              <DialogTitle>Review Proposed Changes</DialogTitle>
            </DialogHeader>
          </div>
          
          {reviewingEdit && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-4 overflow-y-auto flex-1 space-y-6">
                <div className="bg-muted/20 p-4 rounded-lg border border-border">
                  <h4 className="text-sm font-semibold mb-2">Item Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Property No:</span> {reviewingEdit.property_number}</div>
                    <div><span className="text-muted-foreground">Article:</span> {reviewingEdit.article}</div>
                    <div><span className="text-muted-foreground">Submitted By:</span> {reviewingEdit.submitted_by}</div>
                    <div><span className="text-muted-foreground">Date:</span> {format(new Date(reviewingEdit.created_at), "PPp")}</div>
                    <div><span className="text-muted-foreground">Type:</span> {reviewingEdit.type === "new" ? "New Record" : "Edit Request"}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">{reviewingEdit.type === "new" ? "Provided Data" : "Changes"}</h4>
                  <div className="max-h-[40vh] overflow-y-auto border border-border rounded-md">
                    <Table>
                      <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                        <TableRow>
                          <TableHead>Field</TableHead>
                          {reviewingEdit.type === "edit" && <TableHead className="w-1/3">Current Value</TableHead>}
                          <TableHead className={reviewingEdit.type === "edit" ? "w-1/3" : ""}>{reviewingEdit.type === "new" ? "Value" : "Proposed Value"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reviewingEdit.type === "edit" ? (
                          getChangedFields(reviewingEdit.inventory_items, reviewingEdit.changes).length > 0 ? (
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
                          )
                        ) : (
                          Object.entries(reviewingEdit.changes).map(([key, value]) => {
                            if (value === null || value === undefined || value === "" || key === "id" || key === "created_at" || key === "updated_at" || key === "status") return null;
                            return (
                              <TableRow key={key}>
                                <TableCell className="font-medium capitalize">{key.replace(/_/g, " ")}</TableCell>
                                <TableCell className="text-green-400 font-semibold">{String(value)}</TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-muted/10 shrink-0">
                <Button variant="outline" onClick={() => setReviewingEdit(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => handleReject(reviewingEdit)} className="flex items-center gap-2">
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
