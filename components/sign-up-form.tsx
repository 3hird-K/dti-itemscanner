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
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

import Logo from "@/assets/image.jpg";
import LogoDark from "@/assets/image-dark.png"
import RightImage from "@/assets/team-cdo.jpg";
import { Eye, EyeOff, Loader2, ArrowRight, ArrowLeft } from "lucide-react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleNextStep = () => {
    if (!firstName || !lastName) {
      setError("Please fill in your first and last name.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-none shadow-xl bg-background">
        <CardContent className="grid p-0 md:grid-cols-2">

          {/* --- Left Side (Form) --- */}
          <div className="p-6 md:p-8 flex flex-col justify-center bg-transparent">
            <CardHeader className="flex flex-col items-center space-y-2 text-center p-0 mb-6">
              <Link href={"/"} className="mb-2">
                {/* Light mode logo */}
                <Image
                  src={Logo}
                  alt="DTI offset"
                  width={80}
                  height={80}
                  className="block dark:hidden"
                />

                {/* Dark mode logo */}
                <Image
                  src={LogoDark}
                  alt="DTI offset"
                  width={80}
                  height={80}
                  className="hidden dark:block"
                />
              </Link>
              <CardTitle className="text-2xl font-bold tracking-tight">
                Create Account
              </CardTitle>

              <CardDescription>
                Register to access the DTI Inventory Management System
              </CardDescription>

              {/* Stepper */}
              <div className="flex items-center justify-center w-full max-w-[300px] my-0">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-300 ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    1
                  </div>
                  <span className={`text-xs mt-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>Personal</span>
                </div>

                <div className="h-[1px] w-20 mx-4 bg-muted relative">
                  <div className="absolute top-0 left-0 h-full bg-primary transition-all duration-300" style={{ width: step === 2 ? '100%' : '0%' }}></div>
                </div>

                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-300 ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    2
                  </div>
                  <span className={`text-xs mt-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>Credentials</span>
                </div>
              </div>
            </CardHeader>

            <div className="w-full max-w-sm mx-auto">
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="firstName" className="font-semibold ml-1">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        autoComplete="given-name"
                        type="text"
                        placeholder="Juan"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="bg-transparent border-input/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastName" className="font-semibold ml-1">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        autoComplete="family-name"
                        type="text"
                        placeholder="Dela Cruz"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="bg-transparent border-input/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                      />
                    </div>
                  </div>

                  {error && step === 1 && (
                    <p className="text-[0.8rem] font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3 text-center">
                      {error}
                    </p>
                  )}

                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <form onSubmit={handleSignUp} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="font-semibold ml-1">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      autoComplete="email"
                      type="email"
                      placeholder="example@dti.gov.ph"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="bg-transparent border-input/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="password" className="font-semibold ml-1">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        autoComplete="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        required
                        className="bg-transparent border-input/50 pr-10 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password" className="font-semibold ml-1">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="repeat-password"
                        name="repeatPassword"
                        autoComplete="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        required
                        className="bg-transparent border-input/50 pr-10 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && step === 2 && (
                    <p className="text-[0.8rem] font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3 text-center">
                      {error}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setError(null); setStep(1); }}
                      className="w-full bg-transparent border-border/50 hover:bg-muted font-semibold flex items-center justify-center gap-2"
                      disabled={isLoading}
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button
                      type="submit"
                      className="w-full font-semibold"
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isLoading ? "Creating..." : "Create Account"}
                    </Button>
                  </div>
                </form>
              )}

              <p className="mt-8 text-center text-sm font-medium text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary font-bold hover:underline transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* --- Right Side (Image) --- */}
          <div className="relative hidden md:flex items-center justify-center h-full min-h-[600px] overflow-hidden bg-muted/20">
            <Image
              src={RightImage}
              alt="Community Service"
              fill
              className="object-fit"
              sizes="(max-width: 768px) 0vw, 50vw"
              quality={95}
              priority
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}