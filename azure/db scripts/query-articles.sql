-- ============================================================
-- query-articles.sql
-- Common queries against the article table
-- ============================================================

-- Get all articles
SELECT article_id
FROM article;

-- Get a single article by ID
SELECT article_id
FROM article
WHERE article_id = '<article_id>';

-- Check whether an article exists
SELECT COUNT(1) AS exists_flag
FROM article
WHERE article_id = '<article_id>';
