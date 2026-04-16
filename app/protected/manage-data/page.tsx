"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ManageDataTable } from "@/components/manage-data-table"
import { createClient } from "@/lib/supabase/client"
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

      {/* --- TABLE CONTENT --- */}
      <ManageDataTable data={inventory} isLoading={isLoading} isAdmin={isAdmin} isStaff={isStaff} />
    </div>
  )
}
