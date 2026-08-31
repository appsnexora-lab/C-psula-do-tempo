'use client';

import React from 'react';
import { ActiveTab, ViewTab } from '@/types';
import { Home, BookOpen, Plus, Mail, MoreHorizontal, Lock } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab | ViewTab;
  onTabChange?: (tab: ActiveTab) => void;
  onSelectTab?: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
  unreadLettersCount?: number;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onSelectTab,
  onOpenAddModal,
  unreadLettersCount = 0,
  onLogout,
}) => {
  const handleSelect = (tab: ActiveTab) => {
    if (onTabChange) onTabChange(tab);
    if (onSelectTab) onSelectTab(tab);
  };

  const isCurrent = (tab: ActiveTab) => {
    const current = activeTab as string;
    if (current === tab) return true;
    if (tab === 'inicio' && current === 'home') return true;
    if (tab === 'memorias' && current === 'memories') return true;
    if (tab === 'cartas' && current === 'letters') return true;
    if (tab === 'mais' && current === 'more') return true;
    return false;
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-nav"
        aria-label="Navegação Principal"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FDFCF9]/95 backdrop-blur-md border-t border-[#F0EDE6] px-3 py-2 transition-all shadow-xs"
      >
        <div className="max-w-md mx-auto flex items-center justify-around relative">
          {/* Tab 1: Início */}
          <button
            id="nav-tab-home"
            type="button"
            onClick={() => handleSelect('inicio')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              isCurrent('inicio')
                ? 'text-[#4A6741] font-semibold'
                : 'text-[#8C867E] hover:text-[#4A6741]'
            }`}
          >
            <Home className={`w-5 h-5 transition-transform ${isCurrent('inicio') ? 'scale-110 stroke-[2.2]' : 'stroke-[1.6]'}`} />
            <span className="text-[10px] mt-1 tracking-tight uppercase font-medium">Início</span>
          </button>

          {/* Tab 2: Memórias */}
          <button
            id="nav-tab-memories"
            type="button"
            onClick={() => handleSelect('memorias')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              isCurrent('memorias')
                ? 'text-[#4A6741] font-semibold'
                : 'text-[#8C867E] hover:text-[#4A6741]'
            }`}
          >
            <BookOpen className={`w-5 h-5 transition-transform ${isCurrent('memorias') ? 'scale-110 stroke-[2.2]' : 'stroke-[1.6]'}`} />
            <span className="text-[10px] mt-1 tracking-tight uppercase font-medium">Memórias</span>
          </button>

          {/* Tab 3: Central Highlighted Add Button */}
          <div className="flex-1 flex justify-center -mt-6">
            <button
              id="nav-btn-add-memory"
              type="button"
              onClick={onOpenAddModal}
              aria-label="Guardar uma lembrança"
              className="w-14 h-14 rounded-full bg-[#D4AF37] hover:bg-[#C49E2C] active:scale-95 text-white shadow-xl flex items-center justify-center border-4 border-[#FDFCF9] transition-all duration-200"
            >
              <Plus className="w-7 h-7 stroke-[2.5]" />
            </button>
          </div>

          {/* Tab 4: Cartas */}
          <button
            id="nav-tab-letters"
            type="button"
            onClick={() => handleSelect('cartas')}
            className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors ${
              isCurrent('cartas')
                ? 'text-[#4A6741] font-semibold'
                : 'text-[#8C867E] hover:text-[#4A6741]'
            }`}
          >
            <div className="relative">
              <Mail className={`w-5 h-5 transition-transform ${isCurrent('cartas') ? 'scale-110 stroke-[2.2]' : 'stroke-[1.6]'}`} />
              {unreadLettersCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#D4AF37]" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight uppercase font-medium">Cartas</span>
          </button>

          {/* Tab 5: Mais */}
          <button
            id="nav-tab-more"
            type="button"
            onClick={() => handleSelect('mais')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              isCurrent('mais')
                ? 'text-[#4A6741] font-semibold'
                : 'text-[#8C867E] hover:text-[#4A6741]'
            }`}
          >
            <MoreHorizontal className={`w-5 h-5 transition-transform ${isCurrent('mais') ? 'scale-110 stroke-[2.2]' : 'stroke-[1.6]'}`} />
            <span className="text-[10px] mt-1 tracking-tight uppercase font-medium">Mais</span>
          </button>
        </div>
      </nav>

      {/* Desktop / Tablet Header Nav */}
      <header
        id="desktop-top-nav"
        className="hidden md:block sticky top-0 z-40 bg-[#FDFCF9]/90 backdrop-blur-md border-b border-[#F0EDE6]"
      >
        <div className="max-w-5xl mx-auto px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleSelect('inicio')}>
            <div className="w-10 h-10 rounded-full bg-[#A3B18A]/20 border border-[#A3B18A]/30 flex items-center justify-center text-[#4A6741] font-serif font-bold text-sm">
              PV
            </div>
            <div>
              <span className="font-serif text-xl tracking-tight text-[#3D4B38] font-normal">Para Você</span>
              <span className="hidden lg:inline-block ml-3 text-xs text-[#8C867E] italic">Uma história sendo escrita todos os dias.</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="desktop-tab-home"
              type="button"
              onClick={() => handleSelect('inicio')}
              className={`px-4 py-2 rounded-2xl text-xs uppercase tracking-wider font-semibold transition-all ${
                isCurrent('inicio')
                  ? 'bg-[#A3B18A]/20 text-[#4A6741]'
                  : 'text-[#8C867E] hover:text-[#3D4B38] hover:bg-[#F8F6F2]'
              }`}
            >
              Início
            </button>
            <button
              id="desktop-tab-memories"
              type="button"
              onClick={() => handleSelect('memorias')}
              className={`px-4 py-2 rounded-2xl text-xs uppercase tracking-wider font-semibold transition-all ${
                isCurrent('memorias')
                  ? 'bg-[#A3B18A]/20 text-[#4A6741]'
                  : 'text-[#8C867E] hover:text-[#3D4B38] hover:bg-[#F8F6F2]'
              }`}
            >
              Memórias
            </button>
            <button
              id="desktop-tab-tree"
              type="button"
              onClick={() => handleSelect('arvore')}
              className={`px-4 py-2 rounded-2xl text-xs uppercase tracking-wider font-semibold transition-all ${
                isCurrent('arvore')
                  ? 'bg-[#A3B18A]/20 text-[#4A6741]'
                  : 'text-[#8C867E] hover:text-[#3D4B38] hover:bg-[#F8F6F2]'
              }`}
            >
              Árvore
            </button>
            <button
              id="desktop-tab-letters"
              type="button"
              onClick={() => handleSelect('cartas')}
              className={`px-4 py-2 rounded-2xl text-xs uppercase tracking-wider font-semibold transition-all ${
                isCurrent('cartas')
                  ? 'bg-[#A3B18A]/20 text-[#4A6741]'
                  : 'text-[#8C867E] hover:text-[#3D4B38] hover:bg-[#F8F6F2]'
              }`}
            >
              Cartas
            </button>
            <button
              id="desktop-tab-more"
              type="button"
              onClick={() => handleSelect('mais')}
              className={`px-4 py-2 rounded-2xl text-xs uppercase tracking-wider font-semibold transition-all ${
                isCurrent('mais')
                  ? 'bg-[#A3B18A]/20 text-[#4A6741]'
                  : 'text-[#8C867E] hover:text-[#3D4B38] hover:bg-[#F8F6F2]'
              }`}
            >
              Mais
            </button>

            {onLogout && (
              <button
                id="desktop-btn-lock"
                type="button"
                onClick={onLogout}
                title="Bloquear aplicativo / Trocar Usuário"
                className="p-2.5 rounded-2xl text-[#8C867E] hover:text-[#3D4B38] hover:bg-[#F8F6F2] transition-colors ml-1"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            <button
              id="desktop-btn-add-memory"
              type="button"
              onClick={onOpenAddModal}
              className="ml-2 inline-flex items-center gap-1.5 bg-[#4A6741] hover:bg-[#3D5235] text-white text-xs uppercase tracking-wider font-semibold px-5 py-2.5 rounded-2xl shadow-lg shadow-[#4A6741]/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Guardar lembrança</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
