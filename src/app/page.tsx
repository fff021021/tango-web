'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BookOpen, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import Header from '@/components/Header';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); // サインインとサインアップの切り替え
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    // すでにログインしている場合はダッシュボードにリダイレクト
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      } else {
        setCheckingSession(false);
      }
    };
    checkUserSession();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        // 新規登録
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        
        if (data.user && data.session === null) {
          // メールの確認確認待ちなど（Supabaseの標準設定では確認メールが送られる）
          setSuccessMsg('アカウントを作成しました！確認用メールを送信しましたので、メール内のリンクをクリックして登録を完了してください。');
        } else if (data.session) {
          // 自動ログインされた場合
          router.push('/dashboard');
        }
      } else {
        // ログイン
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      // エラーメッセージの日本語化
      let message = err.message;
      if (message === 'Invalid login credentials') {
        message = 'メールアドレスまたはパスワードが正しくありません。';
      } else if (message === 'User already registered') {
        message = 'このメールアドレスは既に登録されています。';
      } else if (message === 'Password should be at least 6 characters') {
        message = 'パスワードは6文字以上で入力してください。';
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>接続中...</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className={`${styles.main} animate-fade-in`}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <div className={styles.iconContainer}>
              <BookOpen size={36} className={styles.logoIcon} />
            </div>
            <h1 className={styles.title}>単語帳Web</h1>
            <p className={styles.subtitle}>
              {isSignUp ? 'アカウントを作成して単語学習を始めましょう' : 'ログインして自分の単語帳にアクセス'}
            </p>
          </div>

          {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}
          {successMsg && <div className={styles.successAlert}>{successMsg}</div>}

          <form onSubmit={handleAuth} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>メールアドレス</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>パスワード</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
              </div>
            </div>

            <button type="submit" className={`${styles.submitBtn} btn-primary`} disabled={loading}>
              {loading ? (
                <div className={styles.btnSpinner}></div>
              ) : isSignUp ? (
                <>
                  <UserPlus size={18} />
                  <span>新規登録</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>ログイン</span>
                </>
              )}
            </button>
          </form>

          <div className={styles.toggleAuth}>
            <span>
              {isSignUp ? 'すでにアカウントをお持ちですか？' : 'アカウントをお持ちではありませんか？'}
            </span>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={styles.toggleBtn}
            >
              {isSignUp ? 'ログインはこちら' : 'アカウント作成はこちら'}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
