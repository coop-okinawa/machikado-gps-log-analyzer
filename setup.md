
# セットアップ手順

## 1. Supabaseプロジェクトの作成
Supabaseで新しいプロジェクトを作成し、以下のSQLをSQL Editorで実行してください。

```sql
-- 1. 車両マスタ
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 1号車, 2号車, etc.
  active BOOLEAN DEFAULT true,
  code4_hash TEXT NOT NULL, -- ナンバーコード4桁のハッシュ（今回は簡易的に平文でも可だがハッシュ推奨）
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. 地点マスタ（停留所）
CREATE TABLE stops_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  type TEXT CHECK (type IN ('BASE', 'STOP')),
  radius_m INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. GPS生ログ
CREATE TABLE gps_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  speed DOUBLE PRECISION
);

-- 4. 判定済み停留ログ
CREATE TABLE detected_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id),
  stop_master_id UUID REFERENCES stops_master(id),
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_sec INTEGER NOT NULL,
  center_lat DOUBLE PRECISION,
  center_lon DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. 管理者設定
CREATE TABLE admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 初期データ投入
INSERT INTO admin_settings (key, value) VALUES ('admin_password', '0000');
INSERT INTO vehicles (name, code4_hash) VALUES 
('1号車', '0000'), 
('2号車', '0000'), 
('3号車', '0000');

-- RLS (Row Level Security) 
-- 本番運用ではさらに絞り込みが必要ですが、プロトタイプ用に全許可の設定例：
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON vehicles FOR ALL USING (true);
ALTER TABLE stops_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON stops_master FOR ALL USING (true);
ALTER TABLE gps_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON gps_points FOR ALL USING (true);
ALTER TABLE detected_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON detected_stops FOR ALL USING (true);
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON admin_settings FOR ALL USING (true);
```

## 2. 環境変数の設定
`.env` ファイルに以下を設定してください。
- `VITE_SUPABASE_URL`: SupabaseのURL
- `VITE_SUPABASE_ANON_KEY`: SupabaseのAnon Key

## 3. 確認項目
- ドライバー画面で車両を選択し、正しい4桁コードを入力すると「出発」が可能か。
- GPSが10m以内の移動で3分経過したとき、かつ停留所マスタ(30m以内)に地点がある場合にのみログが記録されるか。
- 管理者画面で「CSV出力」が正しく動作するか。
