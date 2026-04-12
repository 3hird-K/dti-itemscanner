import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Create admin client with service role key (has full access)
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Delete the user's profile first
    const { error: profileError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
      return NextResponse.json(
        { error: "Failed to delete user profile" },
        { status: 500 }
      );
    }

    // Delete the auth user completely
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Error deleting auth user:", authError);
      return NextResponse.json(
        { error: "Failed to delete auth user" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in delete-user route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
