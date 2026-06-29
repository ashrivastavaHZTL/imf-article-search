-- ============================================================
-- query-article-details.sql
-- Common queries against the article_details table
-- Set the DECLARE values before running each section
-- ============================================================

-- Get all article details
SELECT id, url, article_id, language_code, status, title, created_at
FROM article_details;

-- -------------------------------------------------------
-- Get a single record by surrogate id
-- -------------------------------------------------------
DECLARE @id INT = 1;

SELECT id, url, article_id, language_code, status, title, created_at
FROM article_details
WHERE id = @id;

-- -------------------------------------------------------
-- Get a single record by url
-- -------------------------------------------------------
DECLARE @url NVARCHAR(1000) = 'https://example.com/article';

SELECT id, url, article_id, language_code, status, title, created_at
FROM article_details
WHERE url = @url;

-- -------------------------------------------------------
-- Get all records for a given article_id (all language variants)
-- -------------------------------------------------------
DECLARE @article_id NVARCHAR(100) = 'A647D7330E5F43748071DB4B258E3AF5';

SELECT id, url, article_id, language_code, status, title, created_at
FROM article_details
WHERE article_id = @article_id;

-- -------------------------------------------------------
-- Get all pending records (uses IX_article_details_pending filtered index)
-- -------------------------------------------------------
SELECT id, url, article_id, language_code, status, title, created_at
FROM article_details
WHERE status = 'pending';

-- -------------------------------------------------------
-- Get all processed records
-- -------------------------------------------------------
SELECT id, url, article_id, language_code, status, title, created_at
FROM article_details
WHERE status = 'processed';

-- -------------------------------------------------------
-- Get records by language
-- -------------------------------------------------------
DECLARE @language_code VARCHAR(20) = 'en';

SELECT id, url, article_id, language_code, status, title, created_at
FROM article_details
WHERE language_code = @language_code;

-- -------------------------------------------------------
-- Get records by title (exact match)
-- -------------------------------------------------------
DECLARE @title NVARCHAR(500) = 'My Article Title';

SELECT id, url, article_id, language_code, status, title, created_at
FROM article_details
WHERE title = @title;

-- -------------------------------------------------------
-- Get records by title (partial match)
-- -------------------------------------------------------
DECLARE @search_term NVARCHAR(500) = 'monetary policy';

SELECT id, url, article_id, language_code, status, title, created_at
FROM article_details
WHERE title LIKE '%' + @search_term + '%';
