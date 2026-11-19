-- 未割当の作品も登録できるよう、exhibitions.desk_key を NULL 許容にする。
-- SQLite はカラム制約の変更ができないため、テーブルを再作成してデータを移行する。
PRAGMA foreign_keys = OFF;

CREATE TABLE exhibitions_new (
  id INTEGER PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  desk_key TEXT CHECK (desk_key IN ('desk-a', 'desk-b', 'desk-c')),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 1 AND 10000),
  creator TEXT NOT NULL DEFAULT '',
  creator_comment TEXT NOT NULL CHECK (length(creator_comment) <= 5000)
);

INSERT INTO exhibitions_new (id, team_id, desk_key, title, description, creator, creator_comment)
SELECT id, team_id, desk_key, title, description, creator, creator_comment
FROM exhibitions;

DROP TABLE exhibitions;
ALTER TABLE exhibitions_new RENAME TO exhibitions;

CREATE INDEX exhibitions_team_id_idx ON exhibitions(team_id);
CREATE INDEX exhibitions_desk_key_idx ON exhibitions(desk_key);

PRAGMA foreign_keys = ON;
