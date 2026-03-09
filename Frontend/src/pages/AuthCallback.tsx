// src/pages/AuthCallback.tsx
// This page handles the redirect from Google OAuth
// Backend redirects here with: /auth/callback?token=xxx&role=xxx

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getDashboardPath, UserRole } from "@/lib/auth";
import { toast } from "sonner";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const role = searchParams.get("role") as UserRole;
    const error = searchParams.get("error");

    if (error) {
      toast.error("Google login failed. Please try again.");
      navigate("/login");
      return;
    }

    if (token && role) {
      // Store token — auth.tsx will pick it up on next render
      localStorage.setItem("pglens_token", token);
      toast.success("Logged in with Google!");
      // Force page reload so AuthProvider re-reads token
      window.location.href = getDashboardPath(role);
    } else {
      toast.error("Login failed. Please try again.");
      navigate("/login");
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">Completing login...</p>
      </div>
    </div>
  );
};

export default AuthCallback;