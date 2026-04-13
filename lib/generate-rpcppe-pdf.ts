import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export interface PDFSignatory {
  name: string;
  designation: string;
}

export interface PDFExportOptions {
  asOfDate: string;
  fundCluster: string;
  accountableOfficer: string;
  certifiedBy: PDFSignatory;
  approvedBy: PDFSignatory;
  verifiedBy: PDFSignatory;
  data: any[]; // The inventory items array
}

export const generateRpcppePdf = (options: PDFExportOptions) => {
  const {
    asOfDate,
    fundCluster,
    accountableOfficer,
    certifiedBy,
    approvedBy,
    verifiedBy,
    data,
  } = options;

  // Initialize jsPDF (landscape, millimeters, legal size paper provides good space)
  const doc = new jsPDF("landscape", "mm", "legal");

  // Title & Headers
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(
    "REPORT ON THE PHYSICAL COUNT OF PROPERTY, PLANT AND EQUIPMENT - SEMI-EXPENDABLE PROPERTIES",
    doc.internal.pageSize.width / 2,
    15,
    { align: "center" }
  );

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  // doc.text("(APPENDIX 73)", doc.internal.pageSize.width - 15, 15, { align: "right" });

  doc.text("As of " + format(new Date(asOfDate), "MMMM dd, yyyy"), doc.internal.pageSize.width / 2, 22, {
    align: "center",
  });

  doc.text(`Fund Cluster:`, 15, 30);
  doc.setFont("helvetica", "bold");
  doc.text(`${fundCluster}`, 45, 30);

  doc.setFont("helvetica", "normal");
  doc.text(`For which`, 15, 36);
  doc.setFont("helvetica", "bold");
  doc.text(`${accountableOfficer}`, 45, 36);
  doc.setFont("helvetica", "normal");
  // doc.text(`is accountable.`, 45 + doc.getTextWidth(accountableOfficer) + 1, 36);

  // Table Setup
  const tableColumn = [
    "TYPE OF\nPROPERTY, PLANT\nAND EQUIPMENT", // 0
    "ARTICLE", // 1
    "DESCRIPTION (Brand, Model, Size, Color,\nSN No., etc.)", // 2
    "End-User", // 3
    "PROPERTY NUMBER", // 4
    "UNIT OF\nMEASURE", // 5
    "UNIT VALUE", // 6
    "QUANTITY per\nPROPERTY\nCARD", // 7
    "QUANTITY\nper\nPHYSICAL\nCOUNT", // 8
    "SHORTAGE/OVERAGE\nQUANTITY", // 9
    "SHORTAGE/OVERAGE\nVALUE", // 10
    "REMARKS", // 11
  ];

  const tableRows = data.map((item) => {
    return [
      item.property_type || "",
      item.article || "",
      item.description || "",
      item.end_user || "",
      item.property_number || "",
      item.unit_of_measure || "unit",
      item.unit_value ? Number(item.unit_value).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00",
      item.qty_property_card !== null ? String(item.qty_property_card) : "1",
      item.qty_physical_count !== null ? String(item.qty_physical_count) : "1",
      item.qty_shortage_overage !== null ? String(item.qty_shortage_overage) : "",
      item.value_shortage_overage ? Number(item.value_shortage_overage).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "",
      item.remarks || "",
    ];
  });

  // Table Generation
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 42,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
      font: "helvetica",
    },
    headStyles: {
      fillColor: [220, 224, 232], // Light grey-blue for header
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 30 },
      2: { cellWidth: 50 },
      3: { cellWidth: 30 },
      4: { cellWidth: 40 },
      5: { cellWidth: 15, halign: "center" },
      6: { cellWidth: 25, halign: "right" },
      7: { cellWidth: 20, halign: "center" },
      8: { cellWidth: 20, halign: "center" },
      9: { cellWidth: 20, halign: "center" },
      10: { cellWidth: 20, halign: "right" },
      // 11 (Remarks) takes the rest
    },
    didDrawPage: function (data) {
      // Add Footer on every page or only last page? Realistically, the "Certified by" is at the end of the document.
      // We will draw it at the very bottom of the last page, or if `data.pageNumber === data.pageCount`.
      // autoTable doesn't strictly provide `isLastPage` generically out of the box in `didDrawPage` without tracking, 
      // but we can append it after autoTable finishes based on doc.lastAutoTable.finalY.
    },
  });

  // Footer Generation (Signatories)
  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY || 42;
  const pageHeight = doc.internal.pageSize.height;

  // If there's not enough space for the footer (need ~40mm), add a new page
  let currentY = finalY + 15;
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = 20; // reset Y
  }

  doc.setFontSize(9);

  // Three columns for signatories
  const pageWidth = doc.internal.pageSize.width;
  const colWidth = pageWidth / 3;

  // Row 1: Titles
  doc.setFont("helvetica", "normal");
  doc.text("Certified Correct by:", 20, currentY);
  doc.text("Approved by:", colWidth + 10, currentY);
  doc.text("Verified by:", colWidth * 2 + 10, currentY);

  currentY += 15;

  // Row 2: Names
  doc.setFont("helvetica", "bold");
  doc.text(certifiedBy.name.toUpperCase(), 20, currentY);
  doc.text(approvedBy.name.toUpperCase(), colWidth + 10, currentY);
  doc.text(verifiedBy.name.toUpperCase(), colWidth * 2 + 10, currentY);

  currentY += 5;

  // Row 3: Designations
  doc.setFont("helvetica", "normal");
  doc.text(certifiedBy.designation, 20, currentY);
  doc.text(approvedBy.designation, colWidth + 10, currentY);
  doc.text(verifiedBy.designation, colWidth * 2 + 10, currentY);

  // Download the PDF
  doc.save(`RPCPPE-Inventory-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};
