import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ title, onClose, children, size = 'md' }: ModalProps) {
  const sizeClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className={`relative bg-dark-700 rounded-xl border border-dark-400 shadow-2xl w-full ${sizeClass} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-500">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-dark-500">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
