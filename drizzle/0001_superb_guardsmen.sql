CREATE TABLE `proof_files` (
	`key` text PRIMARY KEY NOT NULL,
	`content_type` text NOT NULL,
	`data` blob NOT NULL,
	FOREIGN KEY (`key`) REFERENCES `proofs`(`key`) ON UPDATE no action ON DELETE no action
);
