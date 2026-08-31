'use client';

import React, { useState } from 'react';
import { SecuritySettings } from '@/types';
import { ShieldCheck, Lock, X, KeyRound, Eye, EyeOff } from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SecuritySettings;
  onSave: (settings: SecuritySettings) => void;
  onLockNow: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onLockNow,
}) => {
  const [passwordEnabled, setPasswordEnabled] = useState(
    settings.passwordEnabled !== undefined ? settings.passwordEnabled : true
  );
  const [password, setPassword] = useState(settings.password || settings.pinCode || '1234');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState(settings.passwordHint || '');
  const [showPassword, setShowPassword] = useState(false);
  const [hideSensitive] = useState(settings.hideSensitivePreview);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordEnabled) {
      const cleanPass = password.trim();
      if (!cleanPass || cleanPass.length < 3) {
        setErrorMsg('A senha deve ter pelo menos 3 caracteres.');
        return;
      }
      if (confirmPassword && cleanPass !== confirmPassword.trim()) {
        setErrorMsg('As senhas digitadas não coincidem.');
        return;
      }
    }

    onSave({
      pinEnabled: passwordEnabled,
      pinCode: passwordEnabled ? password.trim() : '',
      passwordEnabled,
      password: passwordEnabled ? password.trim() : '',
      passwordHint: passwordHint.trim(),
      hideSensitivePreview: hideSensitive,
    });
    onClose();
  };

  return (
    <div
      id="security-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
    >
      <div className="bg-[#FDFCF9] border border-[#F0EDE6] rounded-[32px] max-w-md w-full shadow-2xl overflow-hidden my-auto">
        <div className="px-6 py-4 border-b border-[#F0EDE6] flex items-center justify-between bg-white/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#4A6741]" />
            <h3 className="font-serif text-lg text-[#3D4B38] font-normal">Privacidade e Segurança</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8C867E] hover:text-[#3D4B38] hover:bg-[#F8F6F2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Password Enable Toggle */}
          <div className="flex items-center justify-between bg-white p-4.5 rounded-2xl border border-[#F0EDE6] shadow-2xs">
            <div>
              <span className="text-xs font-semibold text-[#4A443F] block">Bloqueio com Senha de Login</span>
              <span className="text-[10px] text-[#8C867E]">Exigir senha da família ao abrir o app</span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={passwordEnabled}
                onChange={(e) => setPasswordEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-[#E5E1D8] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4A6741]"></div>
            </label>
          </div>

          {/* Password Inputs */}
          {passwordEnabled && (
            <div className="space-y-3.5 bg-white p-4.5 rounded-2xl border border-[#F0EDE6] shadow-2xs">
              <div>
                <label className="block text-xs font-semibold text-[#4A443F] mb-1">
                  Definir Senha do Diário
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C867E]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setErrorMsg('');
                      setPassword(e.target.value);
                    }}
                    placeholder="Ex: olivia2026 ou 1234"
                    className="w-full pl-9 pr-10 py-2.5 bg-[#FDFCF9] border border-[#F0EDE6] rounded-xl text-sm text-[#3D4B38] focus:outline-none focus:border-[#4A6741]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8C867E] hover:text-[#3D4B38]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A443F] mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setErrorMsg('');
                    setConfirmPassword(e.target.value);
                  }}
                  placeholder="Digite novamente para confirmar..."
                  className="w-full px-3 py-2.5 bg-[#FDFCF9] border border-[#F0EDE6] rounded-xl text-sm text-[#3D4B38] focus:outline-none focus:border-[#4A6741]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A443F] mb-1">
                  Dica de Senha (opcional)
                </label>
                <input
                  type="text"
                  value={passwordHint}
                  onChange={(e) => setPasswordHint(e.target.value)}
                  placeholder="Ex: Data de nascimento ou nome do bebê"
                  className="w-full px-3 py-2 bg-[#FDFCF9] border border-[#F0EDE6] rounded-xl text-xs text-[#3D4B38] focus:outline-none focus:border-[#4A6741]"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-[#B83A3A] font-medium">{errorMsg}</p>
              )}
            </div>
          )}

          {/* Lock Now Button */}
          {passwordEnabled && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLockNow();
              }}
              className="w-full py-2.5 rounded-2xl bg-[#FDFCF9] border border-[#F0EDE6] text-xs font-semibold text-[#4A443F] hover:bg-[#F8F6F2] flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Bloquear aplicativo agora (Fazer Logout)</span>
            </button>
          )}

          <div className="pt-2 flex justify-end gap-2.5 border-t border-[#F0EDE6]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-[#8C867E] hover:bg-[#F8F6F2] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#4A6741] text-white rounded-2xl text-xs font-semibold hover:bg-[#3D5235] shadow-md shadow-[#4A6741]/20 transition-all active:scale-95"
            >
              Salvar preferências
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
