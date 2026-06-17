'use client';

import { useState, useEffect } from 'react';
import styles from './Flashcard.module.css';

interface FlashcardProps {
  front: string;
  back: string;
  isFlippedExternal?: boolean; // 外部からの反転制御（任意）
  onFlip?: (isFlipped: boolean) => void;
}

export default function Flashcard({ front, back, isFlippedExternal, onFlip }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // 外部からの制御が変更された場合に同期する
  useEffect(() => {
    if (isFlippedExternal !== undefined) {
      setIsFlipped(isFlippedExternal);
    }
  }, [isFlippedExternal]);

  const handleCardClick = () => {
    const nextState = !isFlipped;
    setIsFlipped(nextState);
    if (onFlip) {
      onFlip(nextState);
    }
  };

  return (
    <div className={styles.cardContainer} onClick={handleCardClick} role="button" tabIndex={0}
         onKeyDown={(e) => e.key === ' ' && handleCardClick()}>
      <div className={`${styles.cardInner} ${isFlipped ? styles.isFlipped : ''}`}>
        
        {/* 表面 (単語) */}
        <div className={`${styles.cardFace} ${styles.cardFront}`}>
          <div className={styles.cardLabel}>おもて</div>
          <div className={styles.cardContent}>
            <p className={styles.cardText}>{front}</p>
          </div>
          <div className={styles.cardHint}>クリックでめくる</div>
        </div>

        {/* 裏面 (意味/解説) */}
        <div className={`${styles.cardFace} ${styles.cardBack}`}>
          <div className={styles.cardLabel}>うら</div>
          <div className={styles.cardContent}>
            <p className={styles.cardText}>{back}</p>
          </div>
          <div className={styles.cardHint}>クリックで戻る</div>
        </div>

      </div>
    </div>
  );
}
