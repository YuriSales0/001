"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // NextAuth signIn with email
    const { signIn } = await import("next-auth/react");
    await signIn("email", { email, callbackUrl: "/dashboard" });
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { signIn } = await import("next-auth/react");
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Building2 className="h-8 w-8 text-navy-900" />
            <span className="text-2xl font-bold text-navy-900">UnlockCosta</span>
          </Link>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-navy-900">Welcome Back</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={handleGoogleLogin}
            >
              <Globe className="h-5 w-5 mr-2" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-navy-900 hover:bg-navy-800"
                disabled={loading}
              >
                <Mail className="h-4 w-4 mr-2" />
                {loading ? "Sending link..." : "Send Magic Link"}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-navy-900 font-medium hover:underline">
                Get Started
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
