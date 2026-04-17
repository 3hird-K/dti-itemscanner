"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useProfile } from "@/hooks/use-profile";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export function StaffEditsTable() {
  const supabase = createClient();
  const { data: profile } = useProfile();

  const { data: myEdits = [], isLoading } = useQuery({
    queryKey: ["staff_edits", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from("pending_edits")
        .select(`
          *,
          inventory_items:item_id (property_number, article)
        `)
        .eq("submitted_by", profile.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
    }
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
                <TableHead className="font-semibold text-muted-foreground h-10">Date Submitted</TableHead>
                <TableHead className="font-semibold text-muted-foreground h-10">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="border-b-[#2c2d3c]">
                    {Array.from({ length: 4 }).map((_, cellIdx) => (
                      <TableCell key={cellIdx} className="py-3">
                        <Skeleton className="h-6 w-full opacity-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : myEdits.length > 0 ? (
                myEdits.map((edit: any) => (
                  <TableRow key={edit.id} className="border-b-[#2c2d3c] hover:bg-white/5 transition-colors">
                    <TableCell className="font-medium">{edit.inventory_items?.property_number || "-"}</TableCell>
                    <TableCell>{edit.inventory_items?.article || "-"}</TableCell>
                    <TableCell>
                      {edit.created_at ? format(new Date(edit.created_at), "PPp") : "-"}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(edit.status)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    You have not submitted any edits yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
