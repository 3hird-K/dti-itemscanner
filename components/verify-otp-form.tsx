"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

import Logo from "@/assets/image.jpg";
import LogoDark from "@/assets/image-dark.png";
import SideImage from "@/assets/team-cdo.jpg";
import { Loader2 } from "lucide-react";

export function VerifyOtpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "signup",
        // No redirect config here, verifyOtp signs you in natively
      });
      if (error) throw error;

      router.push("/protected");
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Unable to verify code. Please check and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-none shadow-xl bg-background">
        <CardContent className="grid p-0 md:grid-cols-2">

          {/* --- Left Side (Image) --- */}
          <div className="relative hidden md:flex items-center justify-center h-full min-h-[500px] overflow-hidden bg-muted/20">
            <Image
              src={SideImage}
              alt="Service Portal Background"
              fill
              className="object-fit"
              sizes="(max-width: 768px) 0vw, 50vw"
              quality={95}
              priority
            />
          </div>

          {/* --- Right Side (Form) --- */}
          <div className="p-6 md:p-12 flex flex-col justify-center bg-transparent relative">
            <CardHeader className="flex flex-col items-center space-y-2 text-center p-0 mb-8 mt-4">
              <Link href={"/"} className="mb-2">
                {/* Light mode logo */}
                <Image
                  src={Logo}
                  alt="DTI Logo"
                  width={80}
                  height={80}
                  className="block dark:hidden"
                />

                {/* Dark mode logo */}
                <Image
                  src={LogoDark}
                  alt="DTI Logo"
                  width={80}
                  height={80}
                  className="hidden dark:block"
                />
              </Link>
              <CardTitle className="text-3xl font-bold tracking-tight">
                Create Account
              </CardTitle>

              <CardDescription className="text-base pb-4">
                Join our community today
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleVerify} className="space-y-6 w-full max-w-sm mx-auto">
              <div className="grid gap-2">
                <Label htmlFor="token" className="font-semibold text-left ml-1 text-[1rem]">Verification Code</Label>
                <div className="text-sm text-muted-foreground mb-1 ml-1 text-left">
                  Enter the 8-digit code sent to {email || "your email"}
                </div>
                <Input
                  id="token"
                  type="text"
                  placeholder="00000000"
                  required
                  maxLength={8}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={isLoading}
                  className="bg-transparent border-input/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary text-center tracking-[0.5em] font-mono text-lg"
                />
              </div>

              {error && (
                <p className="text-[0.8rem] font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3 text-center">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full font-semibold mt-2" disabled={isLoading || token.length < 8}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Verifying..." : "Verify & Sign Up"}
              </Button>

              <div className="flex justify-center mt-6">
                <Link href="/auth/sign-up" className="text-primary font-bold hover:underline transition-colors text-sm">
                  Back to Credentials
                </Link>
              </div>

              <div className="flex justify-center pt-4">
                <p className="text-center text-sm font-medium text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-primary font-bold hover:underline transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>

            </form>

          </div>

        </CardContent>
      </Card>
    </div>
  );
}
