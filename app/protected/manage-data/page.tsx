"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ManageDataTable } from "@/components/manage-data-table"
import { PendingApprovalsTable } from "@/components/pending-approvals-table"
import { StaffEditsTable } from "@/components/staff-edits-table"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useProfile } from "@/hooks/use-profile"

export default function ManageDataPage() {
  const supabase = createClient()
  const { data: profile } = useProfile()
  const isAdmin = profile?.account_type === "admin"
  const isStaff = profile?.account_type === "staff"

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .order("created_at", { ascending: false })
      
      if (error) throw error
      return data || []
    },
  })

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["admin_pending_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("pending_edits")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
      
      if (error) throw error
      return count || 0
    },
    enabled: !!isAdmin,
  })

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 min-h-screen bg-background text-foreground animate-in fade-in duration-500">
      {/* --- PAGE TITLE SECTION --- */}
      <div className="space-y-2 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-extrabold tracking-tight">Manage Data</h1>
            <Badge variant="secondary" className="h-6 rounded-full px-3 font-bold bg-primary/10 text-primary border-none">
              Total Records: {inventory.length}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            View, edit, column-filter, and thoroughly manage all PPE inventory database records.
          </p>
        </div>
      </div>

      <Separator className="border-t border-border opacity-50 block h-[1px] w-full" />

      {/* --- CONTENT --- */}
      <Tabs defaultValue="active" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="active">Active Data</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="pending" className="flex items-center gap-2">
                Pending Approvals
                {pendingCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
            )}
            {isStaff && (
              <TabsTrigger value="my-edits">My Proposed Edits</TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="active" className="mt-0 outline-none">
          <ManageDataTable data={inventory} isLoading={isLoading} isAdmin={isAdmin} isStaff={isStaff} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="pending" className="mt-0 outline-none">
            <PendingApprovalsTable />
          </TabsContent>
        )}

        {isStaff && (
          <TabsContent value="my-edits" className="mt-0 outline-none">
            <StaffEditsTable />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
