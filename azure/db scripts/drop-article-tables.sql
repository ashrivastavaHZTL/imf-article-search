-- Drop child tables first to respect FK dependencies

DROP TABLE IF EXISTS article_details;

DROP TABLE IF EXISTS article;

DROP TABLE IF EXISTS article_sync_watermark;
