import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-900 text-white shadow-md">
          <GraduationCap className="w-9 h-9" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">SMAN 2 Padalarang</h1>
          <p className="text-sm text-slate-600 mt-1">Learning Management System Terpadu</p>
        </div>

        <div className="pt-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-900 rounded-xl hover:bg-blue-950 transition-all shadow-sm"
          >
            <span>Masuk ke Portal LMS</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
