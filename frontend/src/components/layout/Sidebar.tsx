import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  ClipboardList, 
  UserCheck, 
  Award, 
  LogOut,
  Calendar,
  Layers,
  GraduationCap
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'materi' | 'tugas' | 'nilai' | 'jadwal';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  onOpenBranchInfo: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
  onOpenBranchInfo,
}) => {
  const menuItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'materi' as ActiveTab, label: 'Materi', icon: BookOpen },
    { id: 'tugas' as ActiveTab, label: 'Tugas', icon: ClipboardList },
    { id: 'nilai' as ActiveTab, label: 'Nilai', icon: Award },
    { id: 'jadwal' as ActiveTab, label: 'Jadwal KBM', icon: Calendar },
  ];

  return (
    <aside className="w-64 bg-[#142d72] text-white flex flex-col justify-between shrink-0 min-h-screen border-r border-blue-900/40 select-none">
      <div>
        <div className="p-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-blue-300 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#142d72] rounded-[10px] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-tight">
              SMAN 2 Padalarang
            </h1>
            <p className="text-xs text-blue-200/80 font-medium">LMS Terpadu</p>
          </div>
        </div>

        <div className="mx-4 mt-3 mb-2">
          <button
            onClick={onOpenBranchInfo}
            className="w-full text-left bg-blue-950/60 hover:bg-blue-900/60 border border-blue-400/30 rounded-lg p-2.5 transition-colors group cursor-pointer"
            title="Klik untuk melihat detail pembagian modul Praktikum"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-blue-200">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Modul Guru Mapel
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono">
                branch: guru
              </span>
            </div>
            <p className="text-[10px] text-blue-300/70 mt-1 line-clamp-1">
              Khusus pengampu mata pelajaran
            </p>
          </button>
        </div>

        <nav className="p-3 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#142d72] shadow-sm translate-x-0.5'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-[#142d72]' : 'text-blue-200'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-white/10 space-y-3">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
            <LogOut className="w-3.5 h-3.5 text-blue-200" />
          </div>
          <span>Keluar</span>
        </button>

        <div className="px-2 pt-1 text-[11px] text-blue-300/60 leading-relaxed">
          <p className="font-semibold text-blue-200/80">Praktikum IPSI 2026</p>
          <p>Modul Guru • PRD v1.0.0</p>
        </div>
      </div>
    </aside>
  );
};
