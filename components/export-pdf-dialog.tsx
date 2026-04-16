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
import { toast } from "sonner";

interface ExportPdfDialogProps {
  inventory: any[];
}

export function ExportPdfDialog({ inventory }: ExportPdfDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Header state
  const [asOfDate, setAsOfDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [fundCluster, setFundCluster] = useState("101");
  const [accountabilityDate, setAccountabilityDate] = useState("2024-02-01");
  const [accountableOfficer, setAccountableOfficer] = useState(`JESUSA M. ABEAR, OIC - Provincial Director, DTI Misamis Oriental is accountable, having assumed accountability on ${format(new Date("2024-02-01"), "MMM d, yyyy")}`);

  // Footer state
  const [certName, setCertName] = useState("KRYZZA MAE C. TALON");
  const [certDesig, setCertDesig] = useState("Property Custodian / Supply Officer");

  const [appName, setAppName] = useState("JESUSA M. ABEAR");
  const [appDesig, setAppDesig] = useState("OIC - Provincial Director");

  const [verifName, setVerifName] = useState("MICHELLE J. MORANO");
  const [verifDesig, setVerifDesig] = useState("COA Representative");

  const handleExport = () => {
    const targetDate = new Date(asOfDate);
    targetDate.setHours(23, 59, 59, 999);

    const filteredInventory = inventory.filter((item) => {
      // Exclude items that are currently pending.
      if (item.status && item.status.toLowerCase() !== "approved") return false;

      if (!item.created_at) return true;
      const itemDate = new Date(item.created_at);
      return itemDate.getTime() <= targetDate.getTime();
    });

    if (filteredInventory.length === 0) {
      toast.error("No approved records found for the selected date.");
      return;
    }

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
    setCurrentStep(1);
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-rose-500" /> Generate Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate RPCPPE PDF Report</DialogTitle>
          <DialogDescription>
            Step {currentStep} of 3 - Complete each section to generate your report
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex justify-between mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-colors ${step === currentStep
                    ? "bg-blue-500 text-white"
                    : step < currentStep
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
              >
                {step < currentStep ? "✓" : step}
              </div>
              <span className="text-xs text-center font-medium">
                {step === 1 && "Report Header"}
                {step === 2 && "Officer Info"}
                {step === 3 && "Signatories"}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Report Header */}
        {currentStep === 1 && (
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
              <Label htmlFor="accountabilityDate">Accountability Date</Label>
              <Input
                id="accountabilityDate"
                type="date"
                value={accountabilityDate}
                onChange={(e) => {
                  setAccountabilityDate(e.target.value);
                  setAccountableOfficer(`JESUSA M. ABEAR, OIC - Provincial Director, DTI Misamis Oriental is accountable, having assumed accountability on ${format(new Date(e.target.value), "MMM d, yyyy")}`);
                }}
              />
            </div>
          </div>
        )}

        {/* Step 2: Officer Information */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">Accountable Officer</h4>

            <div className="grid gap-2">
              <Label htmlFor="accountableOfficer">Accountable Officer Header</Label>
              <Input
                id="accountableOfficer"
                value={accountableOfficer}
                onChange={(e) => setAccountableOfficer(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground italic">This field auto-populates based on the accountability date you selected.</p>
          </div>
        )}

        {/* Step 3: Signatories */}
        {currentStep === 3 && (
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
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            variant="outline"
            className="flex-1"
          >
            Previous
          </Button>
          {currentStep < 3 ? (
            <Button onClick={handleNext} className="flex-1">
              Next
            </Button>
          ) : (
            <Button onClick={handleExport} className="flex-1">
              <Download className="w-4 h-4 mr-2" /> Generate & Download PDF
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
