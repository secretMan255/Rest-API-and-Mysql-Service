CREATE TABLE `pnk`.`products` (
  `id` INT NOT NULL,
  `name` VARCHAR(45) NOT NULL,
  `status` INT NOT NULL,
  PRIMARY KEY (`id`));

ALTER TABLE `pnk`.`products` 
ADD COLUMN `p_id` INT NULL AFTER `status`;

ALTER TABLE `pnk`.`products` 
ADD INDEX `idx_p_id` (`p_id` ASC) VISIBLE;
;

ALTER TABLE `pnk`.`products` 
CHANGE COLUMN `name` `name` VARCHAR(70) NOT NULL ;

CREATE TABLE `pnk`.`items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(75) NOT NULL,
  `describe` VARCHAR(200) NULL,
  `p_id` INT NOT NULL,
  `status` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_p_id` (`p_id` ASC) VISIBLE,
  INDEX `idx_name` (`name` ASC) VISIBLE,
  INDEX `idx_status` (`status` ASC) VISIBLE);

ALTER TABLE `pnk`.`items` 
ADD COLUMN `price` DECIMAL(7,2) NOT NULL AFTER `status`;
ALTER TABLE `pnk`.`items` 
CHANGE COLUMN `price` `price` DECIMAL(7,2) NOT NULL AFTER `describe`;


ALTER TABLE `pnk`.`items` 
CHANGE COLUMN `describe` `describe` VARCHAR(350) NULL DEFAULT NULL ;

ALTER TABLE `pnk`.`products` 
ADD COLUMN `icon` VARCHAR(45) NULL DEFAULT NULL AFTER `p_id`;

CREATE TABLE `pnk`.`subscribe` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(100) NOT NULL,
  `createAt` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`));
