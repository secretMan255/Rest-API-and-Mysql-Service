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

CREATE TABLE `pnk`.`userCre` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `google_id` VARCHAR(255) NOT NULL,
  `user` VARCHAR(45) NOT NULL,
  `email` VARCHAR(45) NOT NULL,
  `createAt` DATETIME NOT NULL,
  `lastLogin` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_google_id` (`google_id` ASC) VISIBLE);

ALTER TABLE `pnk`.`userCre` 
ADD COLUMN `password` VARCHAR(255) NULL AFTER `user`,
ADD COLUMN `address` VARCHAR(255) NULL AFTER `email`;

ALTER TABLE `pnk`.`userCre` 
ADD COLUMN `phone` VARCHAR(15) NULL AFTER `password`,
ADD COLUMN `opt` VARCHAR(6) NULL AFTER `address`,
ADD COLUMN `opt_expiry` DATETIME NULL AFTER `opt`;

ALTER TABLE `pnk`.`userCre` 
CHANGE COLUMN `opt` `otp` VARCHAR(6) NULL DEFAULT NULL ,
CHANGE COLUMN `opt_expiry` `otp_expiry` DATETIME NULL DEFAULT NULL ;

ALTER TABLE `pnk`.`userCre` 
ADD COLUMN `postCode` INT NULL AFTER `address`,
ADD COLUMN `country` VARCHAR(45) NULL AFTER `postCode`;

CREATE TABLE `pnk`.`emailOtp` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(45) NOT NULL,
  `otp` VARCHAR(6) NOT NULL,
  `createAt` DATETIME NOT NULL,
PRIMARY KEY (`id`));

ALTER TABLE `pnk`.`emailOtp` 
ADD UNIQUE INDEX `email_UNIQUE` (`email` ASC) VISIBLE;
;

ALTER TABLE `pnk`.`userCre` 
ADD UNIQUE INDEX `user_UNIQUE` (`user` ASC) VISIBLE,
ADD UNIQUE INDEX `google_id_UNIQUE` (`google_id` ASC) VISIBLE;
;

CREATE TABLE `pnk`.`state` (
  `id` INT NOT NULL,
  `name` VARCHAR(45) NOT NULL,
  `status` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status` ASC) VISIBLE);

ALTER TABLE `pnk`.`state` 
CHANGE COLUMN `id` `id` INT NOT NULL AUTO_INCREMENT ;

ALTER TABLE `pnk`.`userCre` 
ADD COLUMN `city` VARCHAR(45) NULL AFTER `address`;

ALTER TABLE `pnk`.`userCre` 
CHANGE COLUMN `google_id` `google_id` VARCHAR(255) NULL ;

ALTER TABLE `pnk`.`userCre` 
CHANGE COLUMN `lastLogin` `lastLogin` DATETIME NULL ;

ALTER TABLE `pnk`.`items` 
ADD COLUMN `qty` INT NOT NULL DEFAULT 0 AFTER `price`;

CREATE TABLE `pnk`.`cart` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `status` INT NOT NULL DEFAULT 1,
  `createAt` DATETIME NULL,
  `updateAt` DATETIME NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`userId` ASC) VISIBLE,
  INDEX `idx_status` (`status` ASC) VISIBLE);

CREATE TABLE `pnk`.`cart_item` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cart_id` INT NOT NULL,
  `item_id` INT NOT NULL,
  `qty` INT NOT NULL,
  `createAt` DATETIME NULL,
  `updateAt` DATETIME NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_card_id` (`cart_id` ASC) VISIBLE,
  INDEX `idx_item_id` (`item_id` ASC) VISIBLE);


CREATE TABLE `pnk`.`main_product` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `createAt` DATETIME NOT NULL,
  `status` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status` ASC) VISIBLE);

  ALTER TABLE `pnk`.`main_product` 
CHANGE COLUMN `name` `p_id` VARCHAR(45) NOT NULL ;

