'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Plus, FolderPlus, Loader2, BookOpen } from 'lucide-react';
import Header from '@/components/Header';
import DeckCard from '@/components/DeckCard';
import styles from './page.module.css';

interface DeckWithCards {
  id: string;
  title: string;
  cards: { id: string }[];
}

export default function Dashboard() {
  const router = useRouter();
  const [decks, setDecks] = useState<DeckWithCards[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // ログイン状態を確認し、データをロードする
    const initDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // 未ログイン時はトップへ
        router.push('/');
        return;
      }
      setUserId(user.id);
      await fetchDecks();
    };

    initDashboard();
  }, [router]);

  const fetchDecks = async () => {
    try {
      setLoading(true);
      // decksとそれに紐づくcardsを取得
      const { data, error } = await supabase
        .from('decks')
        .select('id, title, cards(id)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDecks(data || []);
    } catch (err: any) {
      console.error('データの取得に失敗しました:', err.message);
      setErrorMsg('単語帳の取得中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckTitle.trim() || !userId) return;

    setCreating(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase
        .from('decks')
        .insert({
          title: newDeckTitle.trim(),
          user_id: userId,
        })
        .select();

      if (error) throw error;

      setNewDeckTitle('');
      setIsModalOpen(false);
      // 再取得
      await fetchDecks();
    } catch (err: any) {
      console.error('作成失敗:', err.message);
      setErrorMsg('単語帳の作成に失敗しました。');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDeck = async (id: string) => {
    try {
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // ローカルのステートを更新
      setDecks(decks.filter(deck => deck.id !== id));
    } catch (err: any) {
      console.error('削除失敗:', err.message);
      alert('削除に失敗しました。');
    }
  };

  return (
    <>
      <Header />
      <main className={`${styles.main} animate-fade-in`}>
        <div className={styles.container}>
          
          {/* ダッシュボードヘッダー */}
          <div className={styles.dashboardHeader}>
            <div>
              <h1 className={styles.title}>マイ単語帳</h1>
              <p className={styles.subtitle}>学習する単語帳を選択するか、新しく作成します。</p>
            </div>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} />
              <span>新規単語帳</span>
            </button>
          </div>

          {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

          {/* ローディング状態 */}
          {loading ? (
            <div className={styles.loadingState}>
              <Loader2 className={styles.spinner} size={40} />
              <p>単語帳を読み込んでいます...</p>
            </div>
          ) : decks.length === 0 ? (
            /* 空の状態 */
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrapper}>
                <BookOpen size={48} />
              </div>
              <h3>単語帳がまだありません</h3>
              <p>新しい単語帳を作成して、覚えたい言葉を登録しましょう！</p>
              <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                <Plus size={18} />
                <span>最初の単語帳を作る</span>
              </button>
            </div>
          ) : (
            /* 単語帳グリッド */
            <div className={styles.deckGrid}>
              {decks.map((deck) => (
                <DeckCard
                  key={deck.id}
                  id={deck.id}
                  title={deck.title}
                  cardCount={deck.cards ? deck.cards.length : 0}
                  onDelete={handleDeleteDeck}
                />
              ))}
            </div>
          )}
        </div>

        {/* 新規作成モーダル */}
        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div className={styles.modalIconWrapper}>
                  <FolderPlus size={24} className={styles.modalIcon} />
                </div>
                <h2>新規単語帳の作成</h2>
              </div>
              
              <form onSubmit={handleCreateDeck}>
                <div className={styles.modalBody}>
                  <label htmlFor="deckTitle" className={styles.modalLabel}>単語帳の名前 (カテゴリ)</label>
                  <input
                    id="deckTitle"
                    type="text"
                    placeholder="例: 英単語、日本史、プログラミング用語"
                    value={newDeckTitle}
                    onChange={(e) => setNewDeckTitle(e.target.value)}
                    required
                    maxLength={50}
                    autoFocus
                  />
                </div>
                
                <div className={styles.modalFooter}>
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={creating}>
                    キャンセル
                  </button>
                  <button type="submit" className="btn-primary" disabled={creating || !newDeckTitle.trim()}>
                    {creating ? '作成中...' : '作成する'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
