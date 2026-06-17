'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, BookOpen, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import styles from './page.module.css';

interface Card {
  id: string;
  front: string;
  back: string;
  status: string;
}

export default function EditDeck() {
  const router = useRouter();
  const params = useParams();
  const deckId = params.id as string;

  const [deckTitle, setDeckTitle] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 新規追加フォームのステート
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  // 編集中のカード情報
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');

  useEffect(() => {
    const initEditPage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      await fetchDeckAndCards();
    };

    initEditPage();
  }, [deckId, router]);

  const fetchDeckAndCards = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // デッキ自体の取得（所有権チェックを兼ねる）
      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .select('title, user_id')
        .eq('id', deckId)
        .single();

      if (deckError || !deck) {
        throw new Error('単語帳が見つからないか、アクセス権限がありません。');
      }

      setDeckTitle(deck.title);

      // カード一覧の取得
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('id, front, back, status')
        .eq('deck_id', deckId)
        .order('created_at', { ascending: true });

      if (cardsError) throw cardsError;

      setCards(cardsData || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'データの読み込み中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // 新しいカードの追加
  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase
        .from('cards')
        .insert({
          deck_id: deckId,
          front: newFront.trim(),
          back: newBack.trim(),
          status: 'learning',
        })
        .select();

      if (error) throw error;

      // ローカルのカード一覧に追加
      if (data) {
        setCards([...cards, data[0] as Card]);
      }
      setNewFront('');
      setNewBack('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('カードの追加に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  // カード編集の開始
  const startEdit = (card: Card) => {
    setEditingCardId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  };

  // カード編集のキャンセル
  const cancelEdit = () => {
    setEditingCardId(null);
    setEditFront('');
    setEditBack('');
  };

  // カード編集内容の保存
  const handleSaveEdit = async (cardId: string) => {
    if (!editFront.trim() || !editBack.trim()) return;

    try {
      const { error } = await supabase
        .from('cards')
        .update({
          front: editFront.trim(),
          back: editBack.trim(),
        })
        .eq('id', cardId);

      if (error) throw error;

      // ローカルステートの更新
      setCards(cards.map(card => 
        card.id === cardId ? { ...card, front: editFront.trim(), back: editBack.trim() } : card
      ));
      setEditingCardId(null);
    } catch (err: any) {
      console.error(err);
      alert('カードの更新に失敗しました。');
    }
  };

  // カードの削除
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('このカードを削除してもよろしいですか？')) return;

    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      // ローカルステートの更新
      setCards(cards.filter(card => card.id !== cardId));
    } catch (err: any) {
      console.error(err);
      alert('カードの削除に失敗しました。');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className={styles.loadingContainer}>
          <Loader2 className={styles.spinner} size={40} />
          <p>データを読み込んでいます...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={`${styles.main} animate-fade-in`}>
        <div className={styles.container}>
          
          {/* 上部ナビゲーション */}
          <div className={styles.topNav}>
            <button className="btn-secondary" onClick={() => router.push('/dashboard')}>
              <ArrowLeft size={16} />
              <span>ダッシュボードへ戻る</span>
            </button>
            {cards.length > 0 && (
              <button className="btn-primary" onClick={() => router.push(`/deck/${deckId}`)}>
                <BookOpen size={16} />
                <span>この単語帳で学習する</span>
              </button>
            )}
          </div>

          {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

          {/* 単語帳タイトルと概要 */}
          <div className={styles.deckHeader}>
            <h1 className={styles.title}>{deckTitle} の編集</h1>
            <p className={styles.subtitle}>登録されている単語カードの追加、編集、削除を行います。</p>
          </div>

          <div className={styles.layoutGrid}>
            
            {/* 新規追加フォーム */}
            <div className={styles.formCard}>
              <h2>カードを追加する</h2>
              <form onSubmit={handleAddCard} className={styles.addForm}>
                <div className={styles.inputGroup}>
                  <label htmlFor="front" className={styles.label}>おもて（単語・質問など）</label>
                  <textarea
                    id="front"
                    placeholder="例: apple"
                    value={newFront}
                    onChange={(e) => setNewFront(e.target.value)}
                    required
                    rows={3}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="back" className={styles.label}>うら（意味・解説など）</label>
                  <textarea
                    id="back"
                    placeholder="例: りんご"
                    value={newBack}
                    onChange={(e) => setNewBack(e.target.value)}
                    required
                    rows={3}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={submitting || !newFront.trim() || !newBack.trim()}>
                  <Plus size={18} />
                  <span>{submitting ? '追加中...' : 'カードを追加'}</span>
                </button>
              </form>
            </div>

            {/* 登録カード一覧 */}
            <div className={styles.listCard}>
              <div className={styles.listHeader}>
                <h2>カード一覧 ({cards.length}枚)</h2>
              </div>

              {cards.length === 0 ? (
                <div className={styles.emptyList}>
                  <p>登録されているカードがありません。</p>
                  <p>左のフォームから最初のカードを登録してください！</p>
                </div>
              ) : (
                <div className={styles.cardList}>
                  {cards.map((card) => (
                    <div key={card.id} className={styles.cardItem}>
                      
                      {editingCardId === card.id ? (
                        /* 編集中のUI */
                        <div className={styles.editCardForm}>
                          <div className={styles.editInputs}>
                            <textarea
                              value={editFront}
                              onChange={(e) => setEditFront(e.target.value)}
                              placeholder="おもて"
                              rows={2}
                            />
                            <textarea
                              value={editBack}
                              onChange={(e) => setEditBack(e.target.value)}
                              placeholder="うら"
                              rows={2}
                            />
                          </div>
                          <div className={styles.editActions}>
                            <button className="btn-primary" onClick={() => handleSaveEdit(card.id)} title="保存">
                              <Save size={16} />
                              <span>保存</span>
                            </button>
                            <button className="btn-secondary" onClick={cancelEdit} title="キャンセル">
                              <X size={16} />
                              <span>キャンセル</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* 通常表示のUI */
                        <>
                          <div className={styles.cardTexts}>
                            <div className={styles.textBlock}>
                              <span className={styles.badgeFront}>おもて</span>
                              <p className={styles.cardText}>{card.front}</p>
                            </div>
                            <div className={styles.textBlock}>
                              <span className={styles.badgeBack}>うら</span>
                              <p className={styles.cardText}>{card.back}</p>
                            </div>
                            <div className={styles.statusBlock}>
                              <span className={`${styles.statusBadge} ${card.status === 'memorized' ? styles.statusMemorized : styles.statusLearning}`}>
                                {card.status === 'memorized' ? '覚えた' : 'まだ'}
                              </span>
                            </div>
                          </div>
                          
                          <div className={styles.cardItemActions}>
                            <button className="btn-secondary btn-icon" onClick={() => startEdit(card)} title="編集">
                              <Edit2 size={16} />
                            </button>
                            <button className="btn-danger btn-icon" onClick={() => handleDeleteCard(card.id)} title="削除">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                      
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
