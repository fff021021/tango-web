-- ==========================================
-- 単語帳Web Supabase データベースセットアップ SQL
-- Supabaseの「SQL Editor」にコピー＆ペーストして実行してください。
-- ==========================================

-- 1. decks (単語帳) テーブルの作成
CREATE TABLE IF NOT EXISTS public.decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. cards (単語カード) テーブルの作成
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'learning' CHECK (status IN ('learning', 'memorized')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Row Level Security (RLS) の有効化
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- 4. decks テーブルのセキュリティポリシー設定
-- 自分の所有する単語帳のみを操作可能にする

CREATE POLICY "ユーザーは自分の単語帳を参照できる" 
    ON public.decks FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは単語帳を作成できる" 
    ON public.decks FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分の単語帳を更新できる" 
    ON public.decks FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分の単語帳を削除できる" 
    ON public.decks FOR DELETE 
    USING (auth.uid() = user_id);

-- 5. cards テーブルのセキュリティポリシー設定
-- 自分が所有する単語帳に属するカードのみを操作可能にする

CREATE POLICY "ユーザーは自分の単語カードを参照できる" 
    ON public.cards FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.decks 
            WHERE public.decks.id = public.cards.deck_id 
            AND public.decks.user_id = auth.uid()
        )
    );

CREATE POLICY "ユーザーは自分の単語カードを作成できる" 
    ON public.cards FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.decks 
            WHERE public.decks.id = public.cards.deck_id 
            AND public.decks.user_id = auth.uid()
        )
    );

CREATE POLICY "ユーザーは自分の単語カードを更新できる" 
    ON public.cards FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.decks 
            WHERE public.decks.id = public.cards.deck_id 
            AND public.decks.user_id = auth.uid()
        )
    );

CREATE POLICY "ユーザーは自分の単語カードを削除できる" 
    ON public.cards FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.decks 
            WHERE public.decks.id = public.cards.deck_id 
            AND public.decks.user_id = auth.uid()
        )
    );
