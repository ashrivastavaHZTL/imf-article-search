-- ============================================================
-- query-article-details-all.sql
-- Pull all article_details records joined to article
-- ============================================================

SELECT
    ad.id,
    ad.url,
    ad.article_id,
    ad.language_code,
    ad.status,
    ad.title,
    ad.created_at
FROM article_details ad
INNER JOIN article a ON a.article_id = ad.article_id
ORDER BY ad.created_at DESC;
