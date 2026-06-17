'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut, BookOpen, User, ChevronDown } from 'lucide-react';
import styles from './Header.module.css';

export default function Header() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 現在のユーザー情報を取得
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };

    getUser();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserEmail(session?.user?.email || null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ドロップダウンの外側をクリックしたときに閉じる処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    router.push('/');
  };

  // メールアドレスを伏字マスクする関数 (例: user@example.com -> us***@example.com)
  const maskEmail = (email: string | null) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
      return `${local.charAt(0)}*@${domain}`;
    }
    return `${local.slice(0, 2)}***@${domain}`;
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo} onClick={() => router.push(userEmail ? '/dashboard' : '/')}>
          <BookOpen className={styles.logoIcon} size={28} />
          <span className={styles.logoText}>単語帳Web</span>
        </div>

        {userEmail && (
          <div className={styles.userMenuContainer} ref={dropdownRef}>
            {/* トリガーとなるユーザーアバターボタン */}
            <button 
              className={styles.avatarBtn} 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="ユーザーメニュー"
            >
              <div className={styles.avatarIconWrapper}>
                <User size={18} />
              </div>
              <ChevronDown size={14} className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`} />
            </button>

            {/* ドロップダウンメニュー */}
            {dropdownOpen && (
              <div className={`${styles.dropdownMenu} animate-fade-in`}>
                <div className={styles.dropdownHeader}>
                  <span className={styles.emailLabel}>ログイン中</span>
                  <span className={styles.maskedEmail} title={userEmail}>
                    {maskEmail(userEmail)}
                  </span>
                </div>
                <div className={styles.dropdownDivider}></div>
                <button className={styles.dropdownItem} onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>ログアウト</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
