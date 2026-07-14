import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-radial from-neutral-50 to-neutral-200 dark:from-neutral-900 dark:to-neutral-950 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              ContactFlow
            </span>
          </div>
          <React.Suspense fallback={<div className="flex justify-center p-4">Cargando...</div>}>
            {children}
          </React.Suspense>
        </div>
      </div>
    </main>
  );
}
