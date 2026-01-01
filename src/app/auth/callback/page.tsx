"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase";

function AuthCallbackInner() {
  const router = useRouter();

  useEffect(() => {
    const completeSignIn = async () => {
      try {
        // Try code flow first: ?code=...
        const currentUrl = new URL(window.location.href);
        const code = currentUrl.searchParams.get("code");

        let session = null;

        if (code) {
          const { data, error } = await supabaseClient.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("Error exchanging code for session:", error);
          } else {
            session = data.session;
          }
        }

        // If there was no code (or no session yet), fall back to hash tokens: #access_token=...&refresh_token=...
        if (!session) {
          const hash = window.location.hash.startsWith("#")
            ? window.location.hash.slice(1)
            : window.location.hash;

          const params = new URLSearchParams(hash);
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (accessToken && refreshToken) {
            const { data, error } = await supabaseClient.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error("Error setting session from hash tokens:", error);
            } else {
              session = data.session;
            }
          }
        }

        if (session) {
          router.replace("/dashboard");
          return;
        }

        console.error("No session after OAuth callback");
        router.replace("/login");
      } catch (err) {
        console.error("Unexpected error in auth callback:", err);
        router.replace("/login");
      }
    };

    completeSignIn();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <p className="text-gray-900 text-base font-medium">Completing sign in with Google...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <p className="text-gray-900 text-base font-medium">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
