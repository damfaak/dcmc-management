INSERT OR IGNORE INTO `discord_settings` (`channel`, `env_key`, `enabled`) VALUES ('deposit', 'DISCORD_DEPOSIT_WEBHOOK', 1);--> statement-breakpoint
INSERT OR IGNORE INTO `discord_settings` (`channel`, `env_key`, `enabled`) VALUES ('withdraw', 'DISCORD_WITHDRAW_WEBHOOK', 1);--> statement-breakpoint
UPDATE `notification_logs`
SET `channel` = 'deposit'
WHERE `channel` = 'finance'
  AND `transaction_id` IN (
    SELECT t.id FROM transaction_logs t
    LEFT JOIN transaction_logs original ON original.id = t.reversal_of
    WHERE COALESCE(original.type, t.type) = 'Income'
  );--> statement-breakpoint
UPDATE `notification_logs`
SET `channel` = 'withdraw'
WHERE `channel` = 'finance'
  AND `transaction_id` IN (
    SELECT t.id FROM transaction_logs t
    LEFT JOIN transaction_logs original ON original.id = t.reversal_of
    WHERE COALESCE(original.type, t.type) = 'Expense'
  );--> statement-breakpoint
DELETE FROM `discord_settings` WHERE `channel` = 'finance';
