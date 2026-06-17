'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut, BookOpen, User } from 'lucide-react';
import styles from './Header.module.css';

export default function Header() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo} onClick={() => router.push(userEmail ? '/dashboard' : '/')}>
          <BookOpen className={styles.logoIcon} size={28} />
          <span className={styles.logoText}>単語帳Web</span>
        </div>

        {userEmail && (
          <div className={styles.userInfo}>
            <div className={styles.userBadge}>
              <User size={16} />
              <span className={styles.emailText}>{userEmail}</span>
            </div>
            <button className={`${styles.logoutBtn} btn-secondary`} onClick={handleLogout} title="ログアウト">
              <LogOut size={18} />
              <span className={styles.logoutText}>ログアウト</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
