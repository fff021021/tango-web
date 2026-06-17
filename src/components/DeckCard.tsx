'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, Edit, Trash2, ArrowRight } from 'lucide-react';
import styles from './DeckCard.module.css';

interface DeckCardProps {
  id: string;
  title: string;
  cardCount: number;
  onDelete: (id: string) => void;
}

export default function DeckCard({ id, title, cardCount, onDelete }: DeckCardProps) {
  const router = useRouter();

  const handleStudy = (e: React.MouseEvent) => {
    // 編集ボタンや削除ボタンがクリックされた時の伝播を防ぐ
    e.stopPropagation();
    router.push(`/deck/${id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/deck/${id}/edit`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`単語帳「${title}」を削除してもよろしいですか？\n※中のカードもすべて削除されます。`)) {
      onDelete(id);
    }
  };

  return (
    <div className={styles.deckCard} onClick={handleStudy}>
      {/* 本の背表紙のような色付きアクセントバー */}
      <div className={styles.accentBar}></div>
      
      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <div className={styles.iconWrapper}>
            <BookOpen size={20} className={styles.bookIcon} />
          </div>
          <div className={styles.actions}>
            <button className={`${styles.actionBtn} btn-icon`} onClick={handleEdit} title="編集">
              <Edit size={16} />
            </button>
            <button className={`${styles.actionBtn} ${styles.deleteBtn} btn-icon`} onClick={handleDeleteClick} title="削除">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <h3 className={styles.title}>{title}</h3>
        <p className={styles.count}>{cardCount} 枚のカード</p>

        <div className={styles.cardFooter}>
          <span className={styles.studyLink}>
            学習をはじめる
            <ArrowRight size={16} className={styles.arrowIcon} />
          </span>
        </div>
      </div>
    </div>
  );
}
