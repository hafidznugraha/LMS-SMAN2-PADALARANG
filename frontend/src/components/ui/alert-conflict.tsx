import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

interface AlertConflictProps {
  guru: string;
  mapelKelas: string;
  waktu: string;
  onFix?: () => void;
}

export function AlertConflict({ guru, mapelKelas, waktu, onFix }: AlertConflictProps) {
  return (
    <div className="bg-[#FEF08A] border border-[#FDE047] rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2.5 text-amber-800 font-semibold text-sm">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <span>Peringatan Bentrok Jadwal</span>
      </div>
      <div className="bg-white rounded-xl p-3.5 flex items-center justify-between gap-4 shadow-xs">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">{guru}</h4>
          <p className="text-xs text-slate-600 mt-0.5">{mapelKelas}</p>
          <p className="text-xs text-amber-700 font-medium mt-1">{waktu}</p>
        </div>
        <Button variant="pill" size="sm" onClick={onFix}>
          Perbaiki
        </Button>
      </div>
    </div>
  );
}
