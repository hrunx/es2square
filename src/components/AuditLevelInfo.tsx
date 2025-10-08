import React from 'react';
import { Info } from 'lucide-react';

interface AuditLevelInfoProps {
  level: 'I' | 'II' | 'III';
  isoStandard: string;
  className?: string;
}

export function AuditLevelInfo({ level, isoStandard, className = '' }: AuditLevelInfoProps) {
  const getLevelDescription = (level: 'I' | 'II' | 'III') => {
    switch (level) {
      case 'I':
        return 'Preliminary Energy Audit';
      case 'II':
        return 'Energy Survey and Analysis';
      case 'III':
        return 'Investment Grade Audit';
      default:
        return '';
    }
  };

  return (
    <div className={`flex items-center gap-2 p-4 bg-blue-50 rounded-lg ${className}`}>
      <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
      <div>
        <div className="font-medium text-blue-900">ASHRAE Level {level}</div>
        <div className="text-sm text-blue-700">{getLevelDescription(level)}</div>
        <div className="text-xs text-blue-600 mt-1">Compliant with {isoStandard}</div>
      </div>
    </div>
  );
}