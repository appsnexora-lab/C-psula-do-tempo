'use client';

import React from 'react';
import { ChildProfile, AuthorProfile, SecuritySettings, SubView } from '@/types';
import { calculateAgePortuguese } from '@/lib/dateUtils';
import { 
  Trees, 
  Star, 
  TrendingUp, 
  Lock, 
  ShieldCheck, 
  Download, 
  Trash2, 
  Database, 
  RefreshCw, 
  ChevronRight,
  Edit3,
  LogOut
} from 'lucide-react';
import Image from 'next/image';

interface MoreViewProps {
  childProfile: ChildProfile;
  authorProfile: AuthorProfile;
  authors?: AuthorProfile[];
  securitySettings: SecuritySettings;
  trashCount: number;
  onNavigateSubView: (subView: SubView) => void;
  onResetDemoData: (reloadDemo: boolean) => void;
  onLogout?: () => void;
}

export const MoreView: React.FC<MoreViewProps> = ({
  childProfile,
  authorProfile,
  authors,
  securitySettings,
  trashCount,
  onNavigateSubView,
  onResetDemoData,
  onLogout,
}) => {
  const childAge = calculateAgePortuguese(childProfile.birthDate);

  const authorsText = React.useMemo(() => {
    if (authors && authors.length > 0) {
      if (authors.length === 1) return `Escrito com amor por ${authors[0].name} (${authors[0].relation})`;
      if (authors.length === 2) return `Escrito com amor por ${authors[0].name} (${authors[0].relation}) e ${authors[1].name} (${authors[1].relation})`;
      return `Escrito com amor por ${authors.map((a) => a.name).join(', ')}`;
    }
    return `Escrito com amor por ${authorProfile.name || 'Papai'} (${authorProfile.relation})`;
  }, [authors, authorProfile]);

  return (
    <div id="more-view-hub" className="space-y-6">
      {/* Top Header */}
      <div>
        <span className="text-[10px] font-serif uppercase tracking-widest text-[#8C867E] font-bold block mb-0.5">
          Configurações & Coleções
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl text-[#3D4B38] font-normal">Mais opções</h1>
      </div>

      {/* Profiles Card */}
      <div className="bg-white border border-[#F0EDE6] rounded-[32px] p-5 shadow-xs">
        <div
          id="btn-more-edit-profile"
          onClick={() => onNavigateSubView('profile')}
          className="cursor-pointer flex items-center justify-between group"
          title="Clique para alterar nome, idade e gerenciar perfis do Papai e Mamãe"
        >
          <div className="flex items-center gap-3.5">
            <div className="relative w-14 h-14 rounded-full overflow-hidden bg-[#E5E1D8] border border-[#F0EDE6] shrink-0 group-hover:scale-105 transition-transform">
              {childProfile.profilePhoto && childProfile.profilePhoto.trim() !== '' ? (
                <Image
                  src={childProfile.profilePhoto}
                  alt={childProfile.name}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-serif text-[#4A6741] bg-[#A3B18A]/20 font-bold">
                  {childProfile.name ? childProfile.name[0] : 'O'}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-[#8C867E] font-bold block">
                  Perfil de {childProfile.name || 'Olívia'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-[#4A6741] font-semibold bg-[#A3B18A]/15 px-2 py-0.5 rounded-full">
                  <Edit3 className="w-2.5 h-2.5" />
                  <span>Editar Perfis</span>
                </span>
              </div>
              <h3 className="font-serif text-lg text-[#3D4B38] font-semibold group-hover:text-[#4A6741] transition-colors">
                {childProfile.name || 'Olívia'}
                {childAge && <span className="text-xs font-normal text-[#8C867E] ml-2" suppressHydrationWarning>({childAge})</span>}
              </h3>
              <p className="text-xs text-[#8C867E]">
                {authorsText}
              </p>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-[#8C867E] group-hover:text-[#4A6741] group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Stories & Special Sections */}
      <div className="space-y-2.5">
        <span className="text-[10px] font-serif uppercase tracking-wider text-[#8C867E] font-bold px-1">
          História & Coleções
        </span>

        <div className="bg-white border border-[#F0EDE6] rounded-[32px] overflow-hidden divide-y divide-[#F0EDE6] shadow-xs">
          {/* Minha Árvore */}
          <button
            type="button"
            onClick={() => onNavigateSubView('tree')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#FDFCF9] transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-[#A3B18A]/15 text-[#4A6741] flex items-center justify-center">
                <Trees className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-[#4A443F]">Minha árvore da vida</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C867E]" />
          </button>

          {/* Primeiras Vezes */}
          <button
            type="button"
            onClick={() => onNavigateSubView('milestones')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#FDFCF9] transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
                <Star className="w-4 h-4 fill-current" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-[#4A443F]">Primeiras vezes</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C867E]" />
          </button>

          {/* Seu Crescimento */}
          <button
            type="button"
            onClick={() => onNavigateSubView('growth')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#FDFCF9] transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-[#A3B18A]/15 text-[#4A6741] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-[#4A443F]">Seu crescimento</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C867E]" />
          </button>

          {/* Cápsula do Tempo */}
          <button
            type="button"
            onClick={() => onNavigateSubView('capsule')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#FDFCF9] transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-[#F2F0EB] text-[#8C6D1F] flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-[#4A443F]">Cápsula do tempo</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C867E]" />
          </button>
        </div>
      </div>

      {/* Privacy, Storage & Security */}
      <div className="space-y-2.5">
        <span className="text-[10px] font-serif uppercase tracking-wider text-[#8C867E] font-bold px-1">
          Privacidade & Dados
        </span>

        <div className="bg-white border border-[#F0EDE6] rounded-[32px] overflow-hidden divide-y divide-[#F0EDE6] shadow-xs">
          {/* Segurança & PIN */}
          <button
            type="button"
            onClick={() => onNavigateSubView('security')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#FDFCF9] transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-[#F2F0EB] text-[#4A443F] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-xs sm:text-sm font-semibold text-[#4A443F] block">Privacidade e segurança</span>
                <span className="text-[10px] text-[#8C867E]">
                  {securitySettings.pinEnabled ? 'PIN ativado' : 'PIN desativado'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C867E]" />
          </button>

          {/* Exportar Dados */}
          <button
            type="button"
            onClick={() => onNavigateSubView('export')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#FDFCF9] transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-[#A3B18A]/15 text-[#4A6741] flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-xs sm:text-sm font-semibold text-[#4A443F] block">Exportar minha história</span>
                <span className="text-[10px] text-[#8C867E]">Backup em JSON e formato de livro</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C867E]" />
          </button>

          {/* Lixeira */}
          <button
            type="button"
            onClick={() => onNavigateSubView('trash')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#FDFCF9] transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-[#FDECEC] text-[#B83A3A] flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-xs sm:text-sm font-semibold text-[#4A443F] block">Lixeira</span>
                <span className="text-[10px] text-[#8C867E]">
                  {trashCount} {trashCount === 1 ? 'item excluído' : 'itens excluídos'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C867E]" />
          </button>

          {/* Sair / Bloquear Aplicativo */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#FDFCF9] transition-colors text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-2xl bg-[#8C867E]/10 text-[#4A443F] flex items-center justify-center">
                  <LogOut className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-[#4A443F] block">
                    Bloquear Diário / Trocar Usuário
                  </span>
                  <span className="text-[10px] text-[#8C867E]">
                    Exigir senha para desbloquear
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8C867E]" />
            </button>
          )}
        </div>
      </div>

      {/* Demo Data Management */}
      <div className="bg-[#FDFBF7] border border-[#F0EDE6] rounded-[32px] p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#4A6741]" />
          <h3 className="text-[10px] font-serif uppercase tracking-wider text-[#8C867E] font-bold">
            Dados de Demonstração
          </h3>
        </div>
        <p className="text-xs text-[#8C867E] leading-relaxed">
          Você pode alternar entre os dados de exemplo para testar a experiência ou limpar para começar seu diário pessoal totalmente em branco.
        </p>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja recarregar os dados de demonstração?')) {
                onResetDemoData(true);
              }
            }}
            className="px-4 py-2 rounded-2xl text-xs font-semibold bg-white border border-[#F0EDE6] text-[#4A6741] hover:bg-[#F8F6F2] inline-flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recarregar exemplos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja limpar todos os dados e começar um diário em branco?')) {
                onResetDemoData(false);
              }
            }}
            className="px-4 py-2 rounded-2xl text-xs font-semibold bg-white border border-[#F0EDE6] text-[#B83A3A] hover:bg-[#FDECEC] shadow-2xs"
          >
            Começar do zero
          </button>
        </div>
      </div>

      {/* About App Section */}
      <div className="text-center py-6 space-y-1">
        <h4 className="font-serif text-lg text-[#3D4B38]">Para Você</h4>
        <p className="font-serif text-xs text-[#8C867E] italic">
          &ldquo;Um lugar para guardar os pequenos momentos que um dia contarão uma grande história.&rdquo;
        </p>
        <span className="text-[10px] text-[#8C867E] block pt-1 font-medium">Versão 1.0.0 • Feito com amor</span>
      </div>
    </div>
  );
};
