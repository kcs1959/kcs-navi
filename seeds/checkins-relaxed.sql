-- 直近20分に10件（25%・relaxed）を配置し、JSTの過去分と集計対象外の未来1件でグラフを確認する。 追加のみ。切り替える前に checkins-reset.sql を流す。

WITH RECURSIVE
  numbers(n) AS (
    SELECT 1
    UNION ALL
    SELECT n + 1 FROM numbers WHERE n < 36
  ),
  hours(hour) AS (
    SELECT 0
    UNION ALL
    SELECT hour + 1 FROM hours WHERE hour < 23
  ),
  yesterday(hour, count) AS (VALUES (9, 8), (12, 10), (15, 12)),
  earlier(checked_in_at) AS (
    SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+9 hours', 'start of day',
                    '-9 hours', '+' || hour || ' hours', '+' || n || ' minutes')
    FROM hours JOIN numbers ON n <= 3 + 2 * (hour % 4)
  )
INSERT INTO checkins (checked_in_at)
SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-' || (1 + (n - 1) % 15) || ' minutes')
FROM numbers WHERE n <= 10
UNION ALL
SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+9 hours', 'start of day', '-1 day',
                '-9 hours', '+' || hour || ' hours', '+' || n || ' minutes')
FROM yesterday JOIN numbers ON n <= count
UNION ALL
SELECT checked_in_at FROM earlier
WHERE checked_in_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 minutes')
UNION ALL
SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+10 minutes');
