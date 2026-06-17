'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Edit, Shuffle, RotateCcw, Check, HelpCircle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import Header from '@/components/Header';
import Flashcard from '@/components/Flashcard';
import styles from './page.module.css';

interface Card {
  id: string;
  front: string;
  back: string;
  status: 'learning' | 'memorized';
}

export default function StudyDeck() {
  const router = useRouter();
  const params = useParams();
  const deckId = params.id as string;

  const [deckTitle, setDeckTitle] = useState('');
  const [originalCards, setOriginalCards] = useState<Card[]>([]); // 元のカードリスト
  const [displayCards, setDisplayCards] = useState<Card[]>([]);  // 現在表示対象のカードリスト (シャッフル・フィルタ後)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 学習設定のステート
  const [isShuffled, setIsShuffled] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'learning'>('all'); // 'all': すべて, 'learning': 「まだ」のみ

  useEffect(() => {
    const initStudyPage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      await fetchDeckAndCards();
    };

    initStudyPage();
  }, [deckId, router]);

  const fetchDeckAndCards = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // デッキの取得と所有権確認
      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .select('title')
        .eq('id', deckId)
        .single();

      if (deckError || !deck) {
        throw new Error('単語帳が見つかりません。');
      }

      setDeckTitle(deck.title);

      // カードの取得
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('id, front, back, status')
        .eq('deck_id', deckId)
        .order('created_at', { ascending: true });

      if (cardsError) throw cardsError;

      const typedCards = (cardsData || []).map(card => ({
        ...card,
        status: card.status as 'learning' | 'memorized'
      }));

      setOriginalCards(typedCards);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // カードリストにシャッフルやフィルタを適用する関数
  const applySettings = useCallback((cardsList: Card[], shuffle: boolean, filter: 'all' | 'learning') => {
    let result = [...cardsList];

    // 1. フィルタ適用 (「まだ」のカードのみ)
    if (filter === 'learning') {
      result = result.filter(card => card.status === 'learning');
    }

    // 2. シャッフル適用
    if (shuffle) {
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
    }

    setDisplayCards(result);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);

  // 設定（シャッフル・フィルタ）が変更されたら適用する
  useEffect(() => {
    if (originalCards.length > 0) {
      applySettings(originalCards, isShuffled, filterMode);
    } else {
      setDisplayCards([]);
    }
  }, [originalCards, isShuffled, filterMode, applySettings]);

  const handleNext = () => {
    if (currentIndex < displayCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  // カードのステータス更新 (「まだ」または「覚えた」)
  const updateCardStatus = async (status: 'learning' | 'memorized') => {
    if (displayCards.length === 0) return;

    const currentCard = displayCards[currentIndex];
    
    // UIを素早く更新するための楽観的UI更新
    const updatedOriginalCards = originalCards.map(card => 
      card.id === currentCard.id ? { ...card, status } : card
    );
    
    // 先に元の配列をアップデート（useEffectによりdisplayCardsも更新されるが、
    // インデックスや反転状態が急に壊れないようにタイミングを制御）
    setOriginalCards(updatedOriginalCards);

    try {
      const { error } = await supabase
        .from('cards')
        .update({ status })
        .eq('id', currentCard.id);

      if (error) throw error;
    } catch (err) {
      console.error('ステータスの更新に失敗しました:', err);
      // エラーが起きた場合はデータを再取得してリセット
      fetchDeckAndCards();
    }

    // 自動的に次のカードへ進む（最後のカードでなければ）
    if (currentIndex < displayCards.length - 1) {
      setTimeout(() => {
        handleNext();
      }, 200); // わずかな遅延を入れて、ボタンのインタラクションを感じさせる
    }
  };

  // キーボード操作への対応
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (displayCards.length === 0) return;

      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === '1') {
        // 「1」キーで「まだ」
        updateCardStatus('learning');
      } else if (e.key === '2') {
        // 「2」キーで「覚えた」
        updateCardStatus('memorized');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, displayCards, originalCards]);

  const activeCard = displayCards[currentIndex];
  const totalCount = displayCards.length;
  const progressPercent = totalCount > 0 ? ((currentIndex + 1) / totalCount) * 100 : 0;

  // 覚えたカードの統計情報
  const memorizedCount = originalCards.filter(c => c.status === 'memorized').length;
  const originalTotalCount = originalCards.length;
  const overallProgressPercent = originalTotalCount > 0 ? (memorizedCount / originalTotalCount) * 100 : 0;

  if (loading) {
    return (
      <>
        <Header />
        <div className={styles.loadingContainer}>
          <Loader2 className={styles.spinner} size={40} />
          <p>単語帳を読み込んでいます...</p>
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
              <span>単語帳一覧へ</span>
            </button>
            <h2 className={styles.deckTitle}>{deckTitle}</h2>
            <button className="btn-secondary" onClick={() => router.push(`/deck/${deckId}/edit`)}>
              <Edit size={16} />
              <span>カード編集</span>
            </button>
          </div>

          {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

          {originalTotalCount === 0 ? (
            /* カードが1枚もない場合 */
            <div className={styles.emptyState}>
              <HelpCircle size={48} className={styles.emptyIcon} />
              <h3>カードが登録されていません</h3>
              <p>この単語帳で学習を始めるには、カードを登録する必要があります。</p>
              <button className="btn-primary" onClick={() => router.push(`/deck/${deckId}/edit`)}>
                カードを登録する
              </button>
            </div>
          ) : (
            <div className={styles.studyLayout}>
              
              {/* 学習コントロールパネル */}
              <div className={styles.controlPanel}>
                <div className={styles.statsCard}>
                  <div className={styles.statsHeader}>
                    <span>全体の進捗</span>
                    <span className={styles.statsNumber}>
                      {memorizedCount} / {originalTotalCount} ({Math.round(overallProgressPercent)}%)
                    </span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div className={styles.progressBarFill} style={{ width: `${overallProgressPercent}%` }}></div>
                  </div>
                </div>

                <div className={styles.settingsGroup}>
                  {/* シャッフルトグル */}
                  <button 
                    className={`${styles.settingBtn} ${isShuffled ? styles.settingActive : ''} btn-secondary`}
                    onClick={() => setIsShuffled(!isShuffled)}
                  >
                    <Shuffle size={16} />
                    <span>シャッフル: {isShuffled ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* フィルタトグル */}
                  <button 
                    className={`${styles.settingBtn} ${filterMode === 'learning' ? styles.settingActive : ''} btn-secondary`}
                    onClick={() => setFilterMode(filterMode === 'all' ? 'learning' : 'all')}
                  >
                    <RotateCcw size={16} />
                    <span>復習モード(未習得のみ): {filterMode === 'learning' ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* カード表示エリア */}
              <div className={styles.cardArea}>
                {totalCount === 0 ? (
                  /* フィルタで該当カードがない場合 */
                  <div className={styles.completedState}>
                    <Check size={48} className={styles.completedIcon} />
                    <h3>すべてのカードを覚えました！</h3>
                    <p>復習モードをOFFにするか、シャッフルしてもう一度学習しましょう。</p>
                    <button className="btn-secondary" onClick={() => setFilterMode('all')}>
                      すべてのカードを表示
                    </button>
                  </div>
                ) : (
                  <>
                    {/* 進捗表示 */}
                    <div className={styles.cardProgress}>
                      <span className={styles.progressText}>
                        カード: {currentIndex + 1} / {totalCount}
                      </span>
                      <div className={styles.tinyBarBg}>
                        <div className={styles.tinyBarFill} style={{ width: `${progressPercent}%` }}></div>
                      </div>
                    </div>

                    {/* 3Dフラッシュカード */}
                    <div className={styles.cardWrapper}>
                      <Flashcard
                        front={activeCard.front}
                        back={activeCard.back}
                        isFlippedExternal={isFlipped}
                        onFlip={setIsFlipped}
                      />
                    </div>

                    {/* カード個別判定ボタン */}
                    <div className={styles.judgeActions}>
                      <button 
                        className={`${styles.judgeBtn} ${styles.btnLearning} ${activeCard.status === 'learning' ? styles.activeStatus : ''}`}
                        onClick={() => updateCardStatus('learning')}
                        title="まだ覚えていない (ショートカット: 1)"
                      >
                        <HelpCircle size={20} />
                        <span>まだ</span>
                      </button>
                      
                      <button 
                        className={`${styles.judgeBtn} ${styles.btnMemorized} ${activeCard.status === 'memorized' ? styles.activeStatus : ''}`}
                        onClick={() => updateCardStatus('memorized')}
                        title="覚えた！ (ショートカット: 2)"
                      >
                        <Check size={20} />
                        <span>覚えた</span>
                      </button>
                    </div>

                    {/* 前後ナビゲーション */}
                    <div className={styles.navActions}>
                      <button 
                        className="btn-secondary" 
                        onClick={handlePrev} 
                        disabled={currentIndex === 0}
                      >
                        <ArrowLeft size={16} />
                        <span>前へ</span>
                      </button>

                      <div className={styles.shortcutGuide}>
                        スペースキー: 反転 | 左右キー: 移動
                      </div>

                      <button 
                        className="btn-secondary" 
                        onClick={handleNext} 
                        disabled={currentIndex === totalCount - 1}
                      >
                        <span>次へ</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>
          )}
        </div>
      </main>
    </>
  );
}
