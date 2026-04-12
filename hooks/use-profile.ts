import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface ProfileWithEmail extends Profile {
  email: string,
  firstname: string,
  lastname: string
}

// export async function getProfile(): Promise<ProfileWithEmail> {
//   const supabase = createClient();

//   const { data: { user } } = await supabase.auth.getUser();
//   if (!user) throw new Error("Not authenticated");

//   const { data, error } = await supabase
//     .from("profiles")
//     .select("*")
//     .eq("id", user.id)
//     .single();

//   if (error) throw error;

//   return { ...data, email: user.email };
// }

type SafeProfile = {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  avatar_url: string;
  account_type: string;
  updated_at: Date;
};

export async function getProfile(): Promise<SafeProfile> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    email: user.email ?? "",
    firstname: data.firstname ?? "",
    lastname: data.lastname ?? "",
    avatar_url: data.avatar_url ?? "",
    account_type: data.account_type ?? "User",
    updated_at: data.updated_at ? new Date(data.updated_at) : new Date(),
  };
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });
}

// export function useProfile() {
//   return useQuery({
//     queryKey: ["profile"],
//     queryFn: getProfile,
//   });
// }