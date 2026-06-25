-- Singleton watermark row — stores the cutoff date passed as $publishedAfter
-- in the articles GraphQL query. Update last_synced_at after each successful sync.
--   Read:   SELECT last_synced_at FROM article_sync_watermark WHERE id = 1
--   Update: UPDATE article_sync_watermark SET last_synced_at = GETUTCDATE() WHERE id = 1
CREATE TABLE article_sync_watermark (
    id              INT              NOT NULL DEFAULT 1,
    last_synced_at  DATETIMEOFFSET   NOT NULL,
    updated_at      DATETIMEOFFSET   DEFAULT GETUTCDATE(),
    CONSTRAINT PK_article_sync_watermark PRIMARY KEY (id),
    CONSTRAINT CK_article_sync_watermark_singleton CHECK (id = 1)
);

CREATE TABLE article (
    article_id    NVARCHAR(100)  NOT NULL,
    CONSTRAINT PK_article_status PRIMARY KEY (article_id)
);

CREATE TABLE article_details (
    id            INT            IDENTITY(1,1) NOT NULL,
    url           NVARCHAR(1000) NOT NULL,
    article_id    NVARCHAR(100)  NOT NULL,
    language_code VARCHAR(20)    NOT NULL,
    status        VARCHAR(20),   -- 'processed' | 'pending'
    title         NVARCHAR(500),
    created_at    DATETIMEOFFSET DEFAULT GETUTCDATE(),
    CONSTRAINT PK_article_details
        PRIMARY KEY (id),
    CONSTRAINT UQ_article_details_url
        UNIQUE (url),
    CONSTRAINT FK_article_details_article
        FOREIGN KEY (article_id)
        REFERENCES article(article_id)
);

-- Filtered index — only indexes 'pending' rows for fast status queue lookups
--   Query: SELECT id, article_id FROM article_details WHERE status = 'pending'
CREATE INDEX IX_article_details_pending
    ON article_details(id, article_id, language_code)
    WHERE status = 'pending';

-- Fast url lookups (url is now a unique constraint, this covers non-clustered access patterns)
CREATE INDEX IX_article_details_url
    ON article_details(url);

-- Fast title-only lookups
CREATE INDEX IX_article_details_title
    ON article_details(title);

-- Fast combined title + url lookups (also satisfies title-only via leading column)
CREATE INDEX IX_article_details_title_url
    ON article_details(title, url);