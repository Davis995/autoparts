'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase';
import { Shield, Loader2 } from 'lucide-react';

interface AdminAuthProps {
  children: (props: { user: any }) => React.ReactNode;
}

export default function AdminAuth({ children }: AdminAuthProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = supabaseClient;

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          // No session, redirect to admin login
          const currentPath = window.location.pathname;
          router.push(`/admin/login?redirect=${encodeURIComponent(currentPath)}`);
          return;
        }

        // Check if user is admin
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('isAdmin, role, email, firstName, lastName')
          .eq('id', session.user.id)
          .single();

        if (error || !profile?.isAdmin) {
          // User is not admin, redirect to admin login with error
          const currentPath = window.location.pathname;
          router.push(`/admin/login?redirect=${encodeURIComponent(currentPath)}&error=admin_required`);
          return;
        }

        // User is authorized
        setIsAuthorized(true);
        setUser({
          id: session.user.id,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          role: profile.role
        });
      } catch (error) {
        console.error('Admin auth check failed:', error);
        router.push('/admin/login?error=auth_failed');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();
  }, [router, supabase]);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/admin/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Admin Access</h2>
          <p className="text-gray-600">Please wait while we verify your permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in the useEffect
  }

  return <>{children({ user })}</>;
}
