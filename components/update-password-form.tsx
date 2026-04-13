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
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import Logo from "@/assets/image.jpg";
import LogoDark from "@/assets/image-dark.png";
import { Loader2, Eye, EyeOff } from "lucide-react";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const router = useRouter();

  // Safely capture PKCE codes or implicit access tokens from the URL when redirecting from email
  // Without this, the session won't immediately register and will throw "Auth session missing!"
  useEffect(() => {
    const processSession = async () => {
      const supabase = createClient();

      // Get all URL parameters
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      // Check if Supabase passed an explicit error to us (e.g., clicked an expired link)
      const urlError = searchParams.get("error_description") || hashParams.get("error_description");
      if (urlError) {
        const errorMsg = urlError.replace(/\+/g, ' ');
        if (errorMsg.includes("expired") || errorMsg.includes("invalid")) {
          setError(`${errorMsg}. Please request a new password reset link.`);
        } else {
          setError(errorMsg);
        }
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }

      // Try PKCE flow first (?code=...)
      const code = searchParams.get("code");
      if (code) {
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(`Session error: ${exchangeError.message}. Please request a new password reset link.`);
            return;
          }
          if (data.session) {
            setIsSessionValid(true);
          }
        } catch (err) {
          setError("Failed to establish session. Please request a new password reset link.");
          return;
        }
      }
      // Fall back to implicit flow (#access_token=...)
      else if (hashParams.has("access_token")) {
        const access_token = hashParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token");
        if (access_token && refresh_token) {
          try {
            const { error: setSessionError } = await supabase.auth.setSession({ access_token, refresh_token });
            if (setSessionError) {
              setError(`Session error: ${setSessionError.message}. Please request a new password reset link.`);
              return;
            }
            setIsSessionValid(true);
          } catch (err) {
            setError("Failed to establish session. Please request a new password reset link.");
            return;
          }
        }
      } else {
        // No valid auth tokens found
        setError("No valid password reset link found. Please request a new one.");
      }

      window.history.replaceState(null, "", window.location.pathname);
    };
    
    processSession();
  }, []);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSessionValid) {
      setError("Your password reset session is invalid or expired. Please request a new link.");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/protected");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred. Please try requesting a new reset link.");
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
              <div className="mb-2">
                <Image src={Logo} alt="DTI Logo" width={60} height={60} className="block dark:hidden" />
                <Image src={LogoDark} alt="DTI Logo" width={60} height={60} className="hidden dark:block" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">
                {error ? "Reset Link Invalid" : "Setup New Password"}
              </CardTitle>

              <CardDescription className="text-base pb-2">
                {error 
                  ? "Your password reset link has expired or is invalid." 
                  : "Please enter your new password below."}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleForgotPassword} className="space-y-6 w-full">
              {!error && (
                <div className="grid gap-2">
                  <Label htmlFor="password" className="font-semibold text-left ml-1 text-[1rem]">New password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading || !isSessionValid}
                      className="bg-transparent border-input/50 pr-10 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={!isSessionValid}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-[0.8rem] font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3 text-center">
                  {error}
                </p>
              )}

              {error ? (
                <Link 
                  href="/auth/forgot-password" 
                  className="block"
                >
                  <Button 
                    type="button" 
                    className="w-full font-semibold mt-2"
                  >
                    Request New Reset Link
                  </Button>
                </Link>
              ) : (
                <Button 
                  type="submit" 
                  className="w-full font-semibold mt-2" 
                  disabled={isLoading || password.length < 6 || !isSessionValid}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Saving..." : "Save new password"}
                </Button>
              )}

              {!error && (
                <Link 
                  href="/auth/forgot-password" 
                  className="text-center text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Request a new link if this one expires
                </Link>
              )}
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
