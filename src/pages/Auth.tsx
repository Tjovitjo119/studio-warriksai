import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail, UserX, Zap, Terminal } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirect = redirectAfterAuth || "/dashboard";
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirectAfterAuth]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      const redirect = redirectAfterAuth || "/dashboard";
      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      const redirect = redirectAfterAuth || "/dashboard";
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      setError(`Failed to sign in as guest: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col relative">
      {/* Ambient glow */}
      <div className="fixed top-[-30%] left-[-20%] w-[600px] h-[600px] rounded-full bg-[#00ff41] opacity-[0.02] blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-30%] right-[-20%] w-[500px] h-[500px] rounded-full bg-[#00d4ff] opacity-[0.02] blur-[120px] pointer-events-none" />

      {/* Thin top bar */}
      <div className="h-11 bg-[#05080e] border-b border-[#1a2332] flex items-center px-6 relative z-10">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 group">
          <div className="w-5 h-5 border border-[#00ff41] flex items-center justify-center">
            <Zap className="w-2.5 h-2.5 text-[#00ff41]" />
          </div>
          <span className="text-[11px] font-semibold text-white tracking-[0.1em] group-hover:text-[#00ff41] transition-colors">WARRIKS</span>
        </button>
      </div>

      {/* Auth Content */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-4">
        <Card className="w-[380px] border border-[#1a2332] shadow-none bg-[#05080e]">
          {step === "signIn" ? (
            <>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 border border-[#00ff41] flex items-center justify-center bg-[#00ff41]/5">
                    <Terminal className="w-5 h-5 text-[#00ff41]" />
                  </div>
                </div>
                <CardTitle className="text-lg font-semibold text-white">Sign in</CardTitle>
                <CardDescription className="text-[#556677] text-xs">
                  Enter your email to receive a verification code
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleEmailSubmit}>
                <CardContent className="space-y-4 pt-2">
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#556677]" />
                      <Input
                        name="email"
                        placeholder="name@example.com"
                        type="email"
                        className="pl-9 h-9 text-xs border-[#1a2332] bg-[#0a0e14] text-white placeholder:text-[#445566] focus-visible:ring-0 focus-visible:border-[#00ff41]/50"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      size="icon"
                      disabled={isLoading}
                      className="h-9 w-9 border-[#1a2332] text-[#00ff41] hover:bg-[#00ff41]/10 hover:border-[#00ff41]/30"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  {error && (
                    <p className="text-xs text-[#ff3355]">{error}</p>
                  )}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-[#1a2332]" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-[#05080e] px-2 text-[#556677]">or</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-9 text-xs border-[#1a2332] text-[#e8edf5] hover:bg-[#00ff41]/10 hover:border-[#00ff41]/30"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                  >
                    <UserX className="mr-2 h-3.5 w-3.5" />
                    Continue as Guest
                  </Button>
                </CardContent>
              </form>
            </>
          ) : (
            <>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 border border-[#00ff41] flex items-center justify-center bg-[#00ff41]/5">
                    <Terminal className="w-5 h-5 text-[#00ff41]" />
                  </div>
                </div>
                <CardTitle className="text-lg font-semibold text-white">Check your email</CardTitle>
                <CardDescription className="text-[#556677] text-xs">
                  We sent a code to {step.email}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleOtpSubmit}>
                <CardContent className="space-y-3">
                  <input type="hidden" name="email" value={step.email} />
                  <input type="hidden" name="code" value={otp} />
                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      disabled={isLoading}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && (
                    <p className="text-xs text-[#ff3355] text-center">{error}</p>
                  )}
                  <p className="text-xs text-[#556677] text-center">
                    Didn't receive a code?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-[#00d4ff] underline"
                      onClick={() => setStep("signIn")}
                    >
                      Try again
                    </Button>
                  </p>
                </CardContent>
                <CardFooter className="flex-col gap-2 pt-0">
                  <Button
                    type="submit"
                    className="w-full h-9 text-xs bg-[#00ff41] text-black hover:bg-[#00cc33] shadow-[0_0_10px_rgba(0,255,65,0.2)]"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify code
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("signIn")}
                    disabled={isLoading}
                    className="w-full h-9 text-xs text-[#556677] hover:text-white"
                  >
                    Use different email
                  </Button>
                </CardFooter>
              </form>
            </>
          )}

          <div className="py-3 px-6 text-[10px] text-center text-[#445566] border-t border-[#1a2332]">
            Secured by{" "}
            <a
              href="https://freebuff.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-[#556677] hover:text-[#00ff41] transition-colors"
            >
              freebuff.com
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
