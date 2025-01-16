DELIMITER $$
CREATE PPROCEDURE `sp_get_product_list`(
	IN p_status INT
)
BEGIN
	IF p_status = 0 THEN
		SELECT id, name, p_id, icon, status
		FROM pnk.products;
	ELSEIF p_status = 1 THEN
		SELECT id, name, p_id, icon, status
		FROM pnk.products
		WHERE status = 1;
	END IF;
END $$    
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `sp_get_item`(
)
BEGIN
	SELECT IT.id, IT.name, IT.price, IT.describe, IT.p_id
    FROM items IT
    INNER JOIN products PD ON IT.p_id = PD.id
    WHERE PD.status = 1;
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `sp_err`(
    IN p_err_code VARCHAR(5),
    IN p_err_msg VARCHAR(255)
)
BEGIN
	DECLARE error_message VARCHAR(255);
    SET error_message = IFNULL(p_err_msg, 'Unknown error code');
    
    -- Missing params
    IF p_err_code = '-1203' THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
	-- Duplicate 
	ELSEIF p_err_code = '-205' THEN
		SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = error_message;
	ELSE 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
    END IF;
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `sp_insert_subscribe`(
	IN p_email VARCHAR(100)
)
Main: BEGIN
		IF EXISTS (SELECT id FROM pnk.subscribe WHERE email = p_email) THEN
			CALL pnk.sp_err('-205', 'Duplicate email detected');
			LEAVE Main;
		END IF;

		INSERT INTO pnk.subscribe(email, createAt)
		VALUES (p_email, CURRENT_TIMESTAMP()); 
END Main $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `sp_user_login`(
	IN p_sub VARCHAR(45),
    IN p_name VARCHAR(45),
    IN p_email VARCHAR(45)
)
Main: BEGIN
	IF (p_email IS NULL OR p_name IS NULL OR p_sub IS NULL) THEN
		CALL pnk.sp_err('-1203', 'Missing params');
		LEAVE Main;
	END IF;
    
	IF EXISTS (SELECT * FROM pnk.userCre WHERE google_id = p_sub) THEN 
		UPDATE pnk.userCre
        SET lastLogin = utc_timestamp()
        WHERE google_id = p_sub;
	ELSE
		INSERT INTO pnk.userCre(google_id, user, email, createAt, lastLogin)
        VALUES (p_sub, p_name, p_email, utc_timestamp(), utc_timestamp());
    END IF;
    
END Main $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `sp_check_user_exists`(
	IN p_email VARCHAR(50),
    IN p_opt VARCHAR(6)
)
Main: BEGIN
	
    IF (p_email IS NULL OR p_email = '') THEN
		CALL pnk.sp_err('-1203', 'Param email is missing');
        LEAVE Main;
    END IF;
    
    IF NOT EXISTS (SELECT * FROM pnk.userCre WHERE email = p_email) THEN
		SELECT 'User does not Exists' AS ErrorMsg;
        LEAVE Main;
    END IF;
    
    UPDATE pnk.userCre
    SET opt = p_opt, opt_expiry = utc_timestamp()
    WHERE email = p_email;
END Main $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `sp_update_user_last_login`(
	IN p_id INT
)
Main: BEGIN
    IF (p_id IS NULL OR p_id = '') THEN
		CALL pnk.sp_err('-1203', 'Id param is missing');
        LEAVE Main;
    END IF;
	
	UPDATE pnk.userCre
    SET lastLogin = utc_timestamp()
    WHERE id = p_id;    
END Main $$
DELIMITER ;