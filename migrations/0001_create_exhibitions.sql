-- D1 / SQLite schema. requirements.md §3 supersedes the older PostgreSQL/desks design.
-- All timestamps are canonical UTC ISO 8601 (millisecond precision), allowing indexed
-- string range comparisons. Visitors, desks and creator names have no separate table/column.
CREATE TABLE teams (
  id INTEGER PRIMARY KEY,
  key TEXT NOT NULL UNIQUE CHECK (length(key) BETWEEN 1 AND 40),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 1 AND 5000)
);

CREATE TABLE exhibitions (
  id INTEGER PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  desk_key TEXT NOT NULL CHECK (desk_key IN ('desk-a', 'desk-b', 'desk-c')),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 1 AND 10000),
  creator_comment TEXT NOT NULL CHECK (length(creator_comment) <= 5000)
);

-- desk_key intentionally is not UNIQUE: a map desk can show several works in its popup.
CREATE INDEX exhibitions_team_id_idx ON exhibitions(team_id);
CREATE INDEX exhibitions_desk_key_idx ON exhibitions(desk_key);

CREATE TABLE checkins (
  id INTEGER PRIMARY KEY,
  checked_in_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    CHECK (
      strftime('%Y-%m-%dT%H:%M:%fZ', checked_in_at) IS NOT NULL
      AND checked_in_at = strftime('%Y-%m-%dT%H:%M:%fZ', checked_in_at)
    )
);
CREATE INDEX checkins_checked_in_at_idx ON checkins(checked_in_at);

CREATE TABLE likes (
  id INTEGER PRIMARY KEY,
  exhibition_id INTEGER NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    CHECK (
      strftime('%Y-%m-%dT%H:%M:%fZ', created_at) IS NOT NULL
      AND created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at)
    )
);
CREATE INDEX likes_exhibition_id_idx ON likes(exhibition_id);
