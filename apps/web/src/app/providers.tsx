"use client";

import { AuthProvider } from "@/contexts/auth-context";
import Navbar from "@/components/layout/navbar";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      {children}
    </AuthProvider>
  );
}
