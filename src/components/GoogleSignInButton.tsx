import React, { useState } from 'react';
import { googleSignIn, getCurrentUser, logout } from '../services/auth.ts';
import { useToast } from './Toast.tsx';
import { LogOut, CheckCircle2, User } from 'lucide-react';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onSuccess, className = '' }) => {
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();
  const currentUser = getCurrentUser();

  const handleSignIn = async () => {
    try {
      setLoading(true);
      const res = await googleSignIn();
      success(`Đã đăng nhập thành công với tài khoản Google: ${res.user.displayName || res.user.email}`);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Sign in failed:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        error('Cửa sổ đăng nhập Google đã bị đóng');
      } else {
        error(err.message || 'Đăng nhập Google thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      success('Đã đăng xuất tài khoản Google');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      error('Lỗi khi đăng xuất');
    }
  };

  if (currentUser) {
    return (
      <div className={`flex items-center gap-2 p-1.5 bg-emerald-50 border border-emerald-200 rounded-xl ${className}`}>
        {currentUser.photoURL ? (
          <img 
            src={currentUser.photoURL} 
            alt={currentUser.displayName || 'Google User'} 
            className="w-8 h-8 rounded-full border border-emerald-300 object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-xs font-bold text-emerald-950 truncate leading-tight">
            {currentUser.displayName || 'Người dùng Google'}
          </p>
          <p className="text-[10px] text-emerald-700 truncate leading-tight">
            {currentUser.email}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          type="button"
          title="Đăng xuất Google"
          className="p-1.5 text-emerald-700 hover:text-red-600 hover:bg-emerald-100/60 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={loading}
      className={`relative inline-flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-slate-300 rounded-xl shadow-xs hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 transition-all font-medium text-xs text-slate-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      <div className="w-4 h-4 shrink-0">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-full h-full block">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          <path fill="none" d="M0 0h48v48H0z"></path>
        </svg>
      </div>
      <span>{loading ? 'Đang kết nối Google...' : 'Đăng nhập bằng Google'}</span>
    </button>
  );
};
