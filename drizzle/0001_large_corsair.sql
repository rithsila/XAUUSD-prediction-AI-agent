CREATE TABLE `mt5Notifications` (
	`id` varchar(64) NOT NULL,
	`accountId` varchar(100) NOT NULL,
	`predictionId` varchar(64),
	`signal` json,
	`risk` json,
	`status` varchar(20) DEFAULT 'pending',
	`deliveredAt` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `mt5Notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsEvents` (
	`id` varchar(64) NOT NULL,
	`source` varchar(100) NOT NULL,
	`headline` text NOT NULL,
	`body` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`sentimentPolarity` int,
	`sentimentScore` int,
	`topic` varchar(50),
	`processed` boolean DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `newsEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` varchar(64) NOT NULL,
	`symbol` varchar(20) NOT NULL DEFAULT 'XAUUSD',
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`horizon` varchar(10) NOT NULL,
	`direction` enum('bull','bear','neutral') NOT NULL,
	`confidence` int NOT NULL,
	`rangeMin` int,
	`rangeMax` int,
	`rationale` json,
	`technicalContext` json,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `predictions_id` PRIMARY KEY(`id`)
);
