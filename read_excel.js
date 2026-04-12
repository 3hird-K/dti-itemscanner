const xlsx = require('xlsx');

try {
  const filePath = String.raw`c:\Users\Admin\Desktop\dti-qrscanner\dti\assets\DTI MOR Database2026_Inventory Report on the PPE_Physical Count of Property, Plant and Equipment (Appendix) 73_PPE_Semi-Expendable Properties_RPCPPE_Appendix 73_One Database👍.xlsx`;
  const workbook = xlsx.readFile(filePath);
  
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log("=== First 10 rows of the Excel file ===");
  data.slice(0, 50).forEach((row, index) => {
    const filledCells = row.map(cell => cell ? cell.toString().substring(0, 50).trim() : "").filter(Boolean);
    if (filledCells.length > 0) {
      console.log(`\nRow ${index + 1}:`);
      console.log(filledCells.join(' || '));
    }
  });
} catch(e) {
  console.error(e);
}
