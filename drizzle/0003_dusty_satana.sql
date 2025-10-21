CREATE TABLE `sentimentData` (
	`id` varchar(64) NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`source` varchar(50) NOT NULL,
	`longPercentage` int NOT NULL,
	`shortPercentage` int NOT NULL,
	`volume` int,
	`longPositions` int,
	`shortPositions` int,
	`timestamp` timestamp NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `sentimentData_id` PRIMARY KEY(`id`)
);
