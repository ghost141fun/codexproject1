'use client';

import React, { useEffect } from 'react';
import { LoginForm } from "@/components/auth/login-form";
import { useUser } from '@/database';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If user is already logged in, redirect to the workspace
    if (user && !isUserLoading) {
      router.push('/workspace');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0c]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return <LoginForm />;
}
