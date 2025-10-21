CREATE TABLE `economicEvents` (
	`id` varchar(64) NOT NULL,
	`source` varchar(50) NOT NULL,
	`title` text NOT NULL,
	`country` varchar(10),
	`impact` enum('high','medium','low'),
	`eventTime` timestamp NOT NULL,
	`forecast` varchar(50),
	`previous` varchar(50),
	`actual` varchar(50),
	`analyzed` boolean DEFAULT false,
	`goldImpact` enum('bullish','bearish','neutral','unknown'),
	`predictionId` varchar(64),
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `economicEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsSources` (
	`id` varchar(64) NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('twitter','facebook','website','rss','calendar') NOT NULL,
	`url` text,
	`handle` varchar(100),
	`keywords` json,
	`enabled` boolean NOT NULL DEFAULT true,
	`lastScraped` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `newsSources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scrapedArticles` (
	`id` varchar(64) NOT NULL,
	`sourceId` varchar(64) NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`url` text,
	`author` varchar(200),
	`publishedAt` timestamp,
	`scrapedAt` timestamp NOT NULL DEFAULT (now()),
	`analyzed` boolean DEFAULT false,
	`goldImpact` enum('bullish','bearish','neutral','unknown'),
	`impactScore` int,
	`sentiment` int,
	`summary` text,
	`predictionId` varchar(64),
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `scrapedArticles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemSettings` (
	`id` varchar(64) NOT NULL,
	`autoScrapingEnabled` boolean DEFAULT false,
	`scrapingInterval` int DEFAULT 60,
	`autoPredictionEnabled` boolean DEFAULT false,
	`predictionInterval` int DEFAULT 60,
	`telegramEnabled` boolean DEFAULT false,
	`telegramBotToken` text,
	`telegramChannelId` varchar(100),
	`telegramAlertOnPrediction` boolean DEFAULT true,
	`telegramAlertOnNews` boolean DEFAULT false,
	`minImpactScore` int DEFAULT 50,
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `systemSettings_id` PRIMARY KEY(`id`)
);
