"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileText } from "lucide-react";
import { generateRpcppePdf } from "@/lib/generate-rpcppe-pdf";
import { format } from "date-fns";

interface ExportPdfDialogProps {
  inventory: any[];
}

export function ExportPdfDialog({ inventory }: ExportPdfDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Header state
  const [asOfDate, setAsOfDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [fundCluster, setFundCluster] = useState("101");
  const [accountableOfficer, setAccountableOfficer] = useState("JESUSA M. ABEAR, OIC - Provincial Director, DTI Misamis Oriental is accountable.");

  // Footer state
  const [certName, setCertName] = useState("KRYZZA MAE C. TALON");
  const [certDesig, setCertDesig] = useState("Property Custodian / Supply Officer");

  const [appName, setAppName] = useState("JESUSA M. ABEAR");
  const [appDesig, setAppDesig] = useState("OIC - Provincial Director");

  const [verifName, setVerifName] = useState("MICHELLE J. MORANO");
  const [verifDesig, setVerifDesig] = useState("COA Representative");

  const handleExport = () => {
    // Filter inventory based on created_at or just use all if not strictly filtering
    // Since user specified filtering by "created_at", we filter items that were created on or before the selected date
    const targetDate = new Date(asOfDate);
    targetDate.setHours(23, 59, 59, 999); // End of the selected day

    const filteredInventory = inventory.filter((item) => {
      if (!item.created_at) return true; // Include if no date
      const itemDate = new Date(item.created_at);
      return itemDate.getTime() <= targetDate.getTime();
    });

    generateRpcppePdf({
      asOfDate,
      fundCluster,
      accountableOfficer,
      certifiedBy: { name: certName, designation: certDesig },
      approvedBy: { name: appName, designation: appDesig },
      verifiedBy: { name: verifName, designation: verifDesig },
      data: filteredInventory,
    });

    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-rose-500" /> Export PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate RPCPPE PDF Report</DialogTitle>
          <DialogDescription>
            Configure the header, date, and signatories for your PDF report. The report will include items existing as of the selected date.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">Report Header</h4>

            <div className="grid gap-2">
              <Label htmlFor="asOfDate">As of Date (Filters items created on/before)</Label>
              <Input
                id="asOfDate"
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fundCluster">Fund Cluster</Label>
              <Input
                id="fundCluster"
                value={fundCluster}
                onChange={(e) => setFundCluster(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="accountableOfficer">Accountable Officer Header</Label>
              <Input
                id="accountableOfficer"
                value={accountableOfficer}
                onChange={(e) => setAccountableOfficer(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">Signatories (Footer)</h4>

            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg border border-border/50">
              <div className="col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground">Certified Correct by:</Label>
              </div>
              <div className="grid gap-1.5">
                <Input value={certName} onChange={(e) => setCertName(e.target.value)} placeholder="Name" className="h-8 text-sm" />
              </div>
              <div className="grid gap-1.5">
                <Input value={certDesig} onChange={(e) => setCertDesig(e.target.value)} placeholder="Designation" className="h-8 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg border border-border/50">
              <div className="col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground">Approved by:</Label>
              </div>
              <div className="grid gap-1.5">
                <Input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="Name" className="h-8 text-sm" />
              </div>
              <div className="grid gap-1.5">
                <Input value={appDesig} onChange={(e) => setAppDesig(e.target.value)} placeholder="Designation" className="h-8 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg border border-border/50">
              <div className="col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground">Verified by:</Label>
              </div>
              <div className="grid gap-1.5">
                <Input value={verifName} onChange={(e) => setVerifName(e.target.value)} placeholder="Name (Optional)" className="h-8 text-sm" />
              </div>
              <div className="grid gap-1.5">
                <Input value={verifDesig} onChange={(e) => setVerifDesig(e.target.value)} placeholder="Designation" className="h-8 text-sm" />
              </div>
            </div>

          </div>

          <Button onClick={handleExport} className="w-full mt-2">
            <Download className="w-4 h-4 mr-2" /> Generate & Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
