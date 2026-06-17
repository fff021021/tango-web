import { createClient } from '@supabase/supabase-js';

// 環境変数からSupabaseのURLとパブリックAnonキーを取得
// ビルド時（環境変数が存在しない場合）のプレレンダリングエラーを防ぐため、プレースホルダーをデフォルト値として設定します。
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// 開発時に環境変数が設定されていない場合に警告を表示
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    '警告: Supabaseの環境変数が設定されていません。.env.local ファイルを作成し、NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。'
  );
}

// Supabaseクライアントのインスタンスを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
