import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield, Users2, Workflow } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-radial from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 font-sans flex flex-col justify-between">
      {/* Navbar */}
      <header className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between border-b border-neutral-200/50 dark:border-neutral-800/40">
        <span className="text-xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
          ContactFlow
        </span>
        <Link
          href="/login"
          className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:text-indigo-650 transition-colors"
        >
          Iniciar Sesión
        </Link>
      </header>

      {/* Hero section */}
      <main className="max-w-4xl mx-auto px-6 py-16 text-center space-y-12">
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
            Gestiona tus contactos de manera{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              inteligente
            </span>
          </h1>
          <p className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed">
            ContactFlow permite a equipos y vendedores organizar clientes, proveedores, interacciones y recordatorios en un solo flujo seguro y colaborativo.
          </p>
        </div>

        <div className="flex justify-center">
          <Link
            href="/login"
            className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-sm transition-all shadow-md hover:scale-[1.02] cursor-pointer"
          >
            <span>Comenzar ahora</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left pt-12">
          <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xs space-y-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 w-fit rounded-lg">
              <Users2 size={20} />
            </div>
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Equipo y Colaboración</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Define roles de administrador, miembro o visor y comparte interacciones y notas de clientes.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xs space-y-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 text-purple-500 w-fit rounded-lg">
              <Workflow size={20} />
            </div>
            <h3 className="text-sm font-bold text-neutral-850 dark:text-neutral-200">Flujo de Trabajo</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Registra llamadas, WhatsApps, reuniones y tareas pendientes para no perder ningún seguimiento.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xs space-y-3">
            <div className="p-2.5 bg-green-50 dark:bg-green-950/20 text-green-500 w-fit rounded-lg">
              <Shield size={20} />
            </div>
            <h3 className="text-sm font-bold text-neutral-850 dark:text-neutral-200">Seguridad RLS Real</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Tus datos protegidos a nivel de base de datos. Ninguna organización puede acceder a información ajena.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200/50 dark:border-neutral-800/40 py-6 text-center text-xs text-neutral-450 dark:text-neutral-550">
        &copy; {new Date().getFullYear()} ContactFlow. Diseñado para NexusCorp.
      </footer>
    </div>
  );
}
