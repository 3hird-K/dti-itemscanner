import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as xlsx from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Read exactly row by row as arrays
    const rawData = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });

    const itemsToInsert: any[] = [];

    // The data structure of the RPCPPE document often has the headers somewhere
    // below row 5. The columns typically align to the array indexes.
    
    // Scan for the actual data rows by checking if certain columns exist.
    // In typical RPCPPE:
    // [1]: Type of Property
    // [2]: Fund Cluster
    // [3]: Article
    // [4]: Acquisition Date
    // [5]: Description
    // [6]: End-User
    // [7]: Office/Center
    // [8]: Serial No.
    // [9]: NGAS No.
    // [10]: Property Number
    // [11]: Unit of Measure
    // [12]: Unit Value
    // [13]: Total Cost
    // [14]: Qty Property Card
    // [15]: Qty Physical Count
    // [16]: Qty Shortage/Overage
    // [17]: Value Shortage/Overage
    // [18]: Remarks
    // [19]: PAR/ICS RO
    // ... [25]: Tagging number
    
    // We start from row 5 mostly, but let's loop and find valid rows.
    for (const row of rawData) {
      // Typically, an inventory row has a description or an article, let's use article (index 3) and property number (index 10) as indicators
      const article = row[3];
      const propertyNumber = row[10];

      // Skip empty headers or title rows
      if (
        !article || 
        typeof article !== 'string' || 
        article.toUpperCase().includes('ARTICLE') || 
        article.toUpperCase().includes('ENTITY') || 
        !propertyNumber
      ) {
        continue;
      }

      // Convert date string/number if needed (excel serial dates)
      let parsedDate = row[4];
      if (typeof parsedDate === 'number') {
         // Convert Excel serial date to JS Date
         const date = new Date(Math.round((parsedDate - 25569) * 86400 * 1000));
         parsedDate = date.toISOString().split('T')[0];
      }

      itemsToInsert.push({
        property_type: row[1]?.toString() || null,
        fund_cluster: row[2]?.toString() || null,
        article: row[3]?.toString() || null,
        acquisition_date: parsedDate?.toString() || null,
        description: row[5]?.toString() || null,
        end_user: row[6]?.toString() || null,
        office_center: row[7]?.toString() || null,
        serial_number: row[8]?.toString() || null,
        ngas_number: row[9]?.toString() || null,
        property_number: row[10]?.toString() || null,
        unit_of_measure: row[11]?.toString() || null,
        unit_value: parseFloat(row[12]) || 0,
        total_cost: parseFloat(row[13]) || 0,
        qty_property_card: parseInt(row[14]) || 0,
        qty_physical_count: parseInt(row[15]) || 0,
        qty_shortage_overage: parseInt(row[16]) || 0,
        value_shortage_overage: parseFloat(row[17]) || 0,
        remarks: row[18]?.toString() || null,
        par_ics_ro: row[19]?.toString() || null,
        par_ics_received_by: row[20]?.toString() || null,
        par_ics_pos: row[21]?.toString() || null,
        actual_user: row[22]?.toString() || null,
        location: row[23]?.toString() || null,
        sub_location: row[24]?.toString() || null,
        condition: row[25]?.toString() || null,
        tagging_number: row[26]?.toString() || null,
      });
    }

    if (itemsToInsert.length === 0) {
      return NextResponse.json({ error: "Could not find valid rows to import." }, { status: 400 });
    }

    // Insert to supabase
    const { error } = await supabase.from('inventory_items').insert(itemsToInsert);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully imported ${itemsToInsert.length} items.` 
    });

  } catch (error: any) {
    console.error("Data Import Error:", error);
    return NextResponse.json(
      { error: "Failed to process Excel file. " + error.message },
      { status: 500 }
    );
  }
}
