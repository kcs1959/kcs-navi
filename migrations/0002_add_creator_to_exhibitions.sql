-- exhibition テーブルに「制作者」カラムを追加する。
ALTER TABLE exhibitions ADD COLUMN creator TEXT NOT NULL DEFAULT '';
