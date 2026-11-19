-- 地図の固定9枠（机6台、ボード2枚、スマホ）
-- D1では foreign_keys を無効化できず、defer_foreign_keys でもCASCADEは止まらない。
-- https://developers.cloudflare.com/d1/sql-api/foreign-keys/
-- https://developers.cloudflare.com/d1/sql-api/sql-statements/#pragma-defer_foreign_keys--onoff
-- 作品と、それを参照するいいねを共にコピーしてから、旧子テーブルを先に破棄する。
-- 作品の改名時に likes_new の外部キー参照も更新される（SQLite ALTER TABLE RENAME）。
-- 作品の割当・ID、いいねのID・日時は変更しない。

CREATE TABLE exhibitions_new (
  id INTEGER PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  desk_key TEXT CHECK (desk_key IN (
      'desk-a',
      'desk-b',
      'desk-c',
      'desk-d',
      'desk-e',
      'desk-f',
      'board-wall',
      'board-stand',
      'smartphone'
  )),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 1 AND 10000),
  creator TEXT NOT NULL DEFAULT '',
  creator_comment TEXT NOT NULL CHECK (length(creator_comment) <= 5000)
);

CREATE TABLE likes_new (
  id INTEGER PRIMARY KEY,
  exhibition_id INTEGER NOT NULL REFERENCES exhibitions_new(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    CHECK (
      strftime('%Y-%m-%dT%H:%M:%fZ', created_at) IS NOT NULL
      AND created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at)
    )
);

INSERT INTO exhibitions_new (id, team_id, desk_key, title, description, creator, creator_comment)
SELECT id, team_id, desk_key, title, description, creator, creator_comment
FROM exhibitions;

INSERT INTO likes_new (id, exhibition_id, created_at)
SELECT id, exhibition_id, created_at FROM likes;

DROP TABLE likes;
DROP TABLE exhibitions;

ALTER TABLE exhibitions_new RENAME TO exhibitions;
ALTER TABLE likes_new RENAME TO likes;

CREATE INDEX exhibitions_team_id_idx ON exhibitions(team_id);
CREATE INDEX exhibitions_desk_key_idx ON exhibitions(desk_key);
CREATE INDEX likes_exhibition_id_idx ON likes(exhibition_id);
