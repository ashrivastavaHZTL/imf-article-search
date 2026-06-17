-- Watermark / job state table
CREATE TABLE sync_watermark (
    id INT PRIMARY KEY DEFAULT 1, -- singleton row
    last_synced_at DATETIMEOFFSET NOT NULL,
    last_job_status VARCHAR(20), -- 'success' | 'failed' | 'running'
    last_job_run_at DATETIMEOFFSET,
    total_articles_processed INT DEFAULT 0
);

-- Child table for GUIDs processed in each job run
CREATE TABLE sync_watermark_articles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    watermark_id INT NOT NULL DEFAULT 1,
    article_id NVARCHAR(100) NOT NULL,
    processed_at DATETIMEOFFSET DEFAULT GETUTCDATE(),
    CONSTRAINT FK_sync_watermark_articles_watermark 
        FOREIGN KEY (watermark_id) REFERENCES sync_watermark(id),
    CONSTRAINT UQ_sync_watermark_article 
        UNIQUE (watermark_id, article_id) -- prevent duplicate entries per run
);

-- Index for fast lookup by article_id
CREATE INDEX IX_sync_watermark_articles_article_id 
    ON sync_watermark_articles(article_id);

-- Article metadata mirror (for URL resolution in Job 2)
CREATE TABLE articles (
    article_id NVARCHAR(100) PRIMARY KEY,
    title NVARCHAR(500),
    url NVARCHAR(1000),
    publish_date DATETIMEOFFSET,
    status VARCHAR(20), -- 'active' | 'deleted'
    last_synced_at DATETIMEOFFSET,
    created_at DATETIMEOFFSET DEFAULT GETUTCDATE(),
    updated_at DATETIMEOFFSET DEFAULT GETUTCDATE(),
    description NVARCHAR(MAX)
);