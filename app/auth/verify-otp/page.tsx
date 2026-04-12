import { VerifyOtpForm } from "@/components/verify-otp-form"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export default function VerifyOtpPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>}>
          <VerifyOtpForm />
        </Suspense>
      </div>
    </div>
  )
}
