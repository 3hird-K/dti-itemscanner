"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

import Logo from "@/assets/image.jpg";
import LogoDark from "@/assets/image-dark.png";
import { Loader2, ArrowLeft } from "lucide-react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-6 border-none shadow-xl bg-background">
        <CardContent className="p-0">
          <div className="flex flex-col justify-center bg-transparent relative">
            <CardHeader className="flex flex-col items-center space-y-2 text-center p-0 mb-8 mt-2">
              <Link href={"/"} className="mb-2">
                <Image src={Logo} alt="DTI Logo" width={60} height={60} className="block dark:hidden" />
                <Image src={LogoDark} alt="DTI Logo" width={60} height={60} className="hidden dark:block" />
              </Link>
              <CardTitle className="text-3xl font-bold tracking-tight">
                {success ? "Check Your Email" : "Reset Password"}
              </CardTitle>
              <CardDescription className="text-base pb-2 max-w-sm">
                {success 
                  ? "We've sent password reset instructions to your inbox." 
                  : "Type in your email and we'll send you a link to reset your password."}
              </CardDescription>
            </CardHeader>

            <div className="w-full">
              {!success ? (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="font-semibold text-left ml-1 text-[1rem]">Official Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@dti.gov.ph"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="bg-transparent border-input/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                    />
                  </div>

                  {error && (
                    <p className="text-[0.8rem] font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3 text-center">
                      {error}
                    </p>
                  )}

                  <Button type="submit" className="w-full font-semibold mt-2" disabled={isLoading || !email}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? "Sending email..." : "Send reset email"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-6 flex flex-col items-center justify-center">
                  <div className="h-16 w-16 mb-2 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail-check"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="m16 19 2 2 4-4"/></svg>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => { setSuccess(false); setEmail(""); }}>
                    Send again
                  </Button>
                </div>
              )}

              <div className="flex justify-center mt-8">
                 <Link href="/auth/login" className="text-primary font-bold hover:underline py-2 flex items-center justify-center gap-2 transition-colors text-sm">
                   <ArrowLeft className="w-4 h-4" /> Back to Sign In
                 </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
