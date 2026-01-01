"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabase";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const completeSignIn = async () => {
      try {
        // First, handle the code flow if a `code` query param exists
        const code = searchParams.get("code");

        if (code) {
          const { error } = await supabaseClient.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("Error exchanging code for session:", error);
          }
        }

        // Whether or not a code was present, check if we now have a valid session.
        const { data, error: sessionError } = await supabaseClient.auth.getSession();

        if (!sessionError && data.session) {
          router.replace("/dashboard");
          return;
        }

        console.error("No session after OAuth callback:", sessionError);
        router.replace("/login");
      } catch (err) {
        console.error("Unexpected error in auth callback:", err);
        router.replace("/login");
      }
    };

    completeSignIn();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-gray-600 text-sm">Completing sign in with Google...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-gray-600 text-sm">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
