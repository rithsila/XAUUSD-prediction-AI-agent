CREATE TABLE `apiKeys` (
	`id` varchar(64) NOT NULL,
	`apiKey` varchar(64) NOT NULL,
	`name` varchar(100) NOT NULL,
	`username` varchar(100) NOT NULL,
	`type` enum('MT5','TradingView') NOT NULL,
	`status` enum('active','revoked','expired') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp,
	`lastUsedAt` timestamp,
	`requestCount` int DEFAULT 0,
	`createdBy` varchar(64),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `apiKeys_id` PRIMARY KEY(`id`),
	CONSTRAINT `apiKeys_apiKey_unique` UNIQUE(`apiKey`)
);
