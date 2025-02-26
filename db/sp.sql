USE `pnk`;

DELIMITER $$
DROP PROCEDURE IF EXISTS `pnk`.`sp_get_product_list` $$
CREATE PROCEDURE `pnk`.`sp_get_product_list`(
	IN p_status INT
)
BEGIN
	IF p_status = 0 THEN
		SELECT PRO.id, PRO.name, PRO.p_id, PRO.icon, PRO.describe, PRO.status
		FROM pnk.products PRO;
	ELSEIF p_status = 1 THEN
		SELECT PRO.id, PRO.name, PRO.p_id, PRO.icon, PRO.describe, PRO.status
		FROM pnk.products PRO
		WHERE PRO.status = 1;
	END IF;
END $$    
DELIMITER ;


DELIMITER $$
DROP PROCEDURE IF EXISTS `pnk`.`sp_get_item` $$
CREATE PROCEDURE `pnk`.`sp_get_item`(
)
BEGIN
	SELECT IT.id, IT.name, IT.price, IT.describe, IT.img, IT.p_id, IT.qty
    FROM items IT
    INNER JOIN products PD ON IT.p_id = PD.id
    WHERE PD.status = 1 AND IT.status = 1;
END $$
DELIMITER ;


DELIMITER $$
DROP PROCEDURE IF EXISTS `pnk`.`sp_err` $$
CREATE PROCEDURE `pnk`.`sp_err`(
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
DROP PROCEDURE IF EXISTS `pnk`.`sp_insert_subscribe` $$
CREATE PROCEDURE `pnk`.`sp_insert_subscribe`(
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
DROP PROCEDURE IF EXISTS `pnk`.`sp_user_login` $$
CREATE PROCEDURE `pnk`.`sp_user_login`(
	IN p_sub VARCHAR(255),
    IN p_name VARCHAR(45),
    IN p_email VARCHAR(45),
    IN p_password VARCHAR(255)
)
Main: BEGIN
	IF (p_email IS NULL) THEN
		CALL pnk.sp_err('-1203', 'Missing params');
		LEAVE Main;
	END IF;
    
	-- Google login
	IF (p_sub IS NOT NULL AND p_sub != '') THEN
		IF EXISTS (SELECT 1 FROM pnk.userCre WHERE email = p_email) THEN 
			SELECT CRE.id, CRE.google_id, CRE.user, CRE.password, CRE.phone, CRE.email, CRE.address, CRE.postCode, STATE.name AS city, CRE.country 
            FROM pnk.userCre CRE 
            JOIN pnk.state STATE ON STATE.id = CRE.city
            WHERE CRE.email = p_email;
		ELSE 
			INSERT INTO pnk.userCre(google_id, user, email, createAt, lastLogin)
			VALUES (p_sub, p_name, p_email, utc_timestamp(), utc_timestamp());
			SELECT id, google_id, user, password, phone, email, address, postCode, city, country FROM pnk.userCre WHERE id = last_insert_id();
        END IF;
    ELSE 
		IF NOT EXISTS (SELECT * FROM pnk.userCre WHERE email = p_email) THEN
			SELECT 'Email does not exists' AS noTExists;
		ELSE 
			SELECT CRE.id, CRE.google_id, CRE.user, CRE.password, CRE.phone, CRE.email, CRE.address, CRE.postCode, STATE.name AS city, CRE.country 
            FROM pnk.userCre CRE 
            JOIN pnk.state STATE ON STATE.id = CRE.city
            WHERE CRE.email = p_email;
        END IF;
    END IF;
END Main $$
DELIMITER ;


DELIMITER $$
DROP PROCEDURE IF EXISTS `pnk`.`sp_check_user_exists` $$
CREATE PROCEDURE `pnk`.`sp_check_user_exists`(
	IN p_email VARCHAR(50),
    IN p_otp VARCHAR(6)
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
    SET otp = p_otp, otp_expiry = utc_timestamp()
    WHERE email = p_email;
END Main $$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `pnk`.`sp_update_user_last_login` $$
CREATE PROCEDURE `pnk`.`sp_update_user_last_login`(
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


DELIMITER $$
DROP PROCEDURE IF EXISTS `pnk`.`sp_update_password` $$
CREATE PROCEDURE `pnk`.`sp_update_password`(
	IN p_email VARCHAR(50),
    IN p_password VARCHAR(255),
    IN p_otp INT(6)
)
Main: BEGIN
	DECLARE OtpExpiry DATETIME;
    DECLARE storedOtp INT;
    
    IF (p_email IS NULL OR p_email = '' OR p_password IS NULL OR p_password = '' OR p_otp IS NULL OR p_otp = '') THEN
		CALL pnk.sp_err('-1203', 'Invalid params');
        LEAVE Main;
    END IF;
    
    IF NOT EXISTS (SELECT * FROM pnk.userCre WHERE email = p_email) THEN
		SELECT 'Invalid email' AS ErrorMsg;
		LEAVE Main;
    END IF;
    
    SELECT otp, otp_expiry INTO storedOtp, OtpExpiry FROM pnk.userCre WHERE email = p_email;
    
    IF (OtpExpiry IS NULL OR utc_timestamp() > DATE_ADD(OtpExpiry, INTERVAL 5 MINUTE)) THEN
		SELECT 'OTP expired' AS ErrorMsg;
		LEAVE Main;
    END IF;
    
    IF (OtpExpiry IS NULL OR storedOtp != p_otp) THEN
		SELECT 'Invalid OTP' AS ErrorMsg;
        LEAVE Main;
    END IF;
    
    UPDATE pnk.userCre
    SET password = p_password, otp = null, otp_expiry = null
    WHERE email = p_email;
END Main $$
DELIMITER ;


DELIMITER $$
DROP PROCEDURE IF EXISTS `pnk`.`sp_save_email_otp` $$
CREATE PROCEDURE `pnk`.`sp_save_email_otp`(
	IN p_email VARCHAR(45),
    IN p_otp VARCHAR(6)
)
Main: BEGIN
	IF (p_email IS NULL OR p_email = '' OR p_otp IS NULL OR p_otp = '') THEN
		CALL pnk.sp_err('-1203', 'Invalid Param');
        LEAVE Main;
    END IF;
    
    IF EXISTS (SELECT * FROM pnk.userCre WHERE email = p_email) THEN
		SELECT 'Email have been registered.' AS errorMsg;
        LEAVE Main;
    END IF;
    
	IF EXISTS (SELECT * FROM pnk.emailOtp WHERE email = p_email) THEN
		SELECT 'OTP sent. Please request again after 5 min.' AS errorMsg;
        LEAVE Main;
    END IF;
	
    INSERT INTO emailOtp (email, otp, createAt) 
    VALUES (p_email, p_otp, utc_timestamp());
END Main $$
DELIMITER ;


DELIMITER $$
DROP PROCEDURE IF EXISTS `pnk`.`sp_get_state` $$
CREATE PROCEDURE `pnk`.`sp_get_state`(
	IN p_status INT
)
Main: BEGIN
	IF (p_status is NULL OR p_status = '') THEN
		CALL pnk.sp_err('-1209', 'Invalid param');
        LEAVE Main;
	END IF;
    
    SELECT name FROM pnk.state WHERE status = 1;
END Main $$
DELIMITER ;


DELIMITER $$
DROP PROCEDURE IF EXISTS `pnk`.`sp_create_account` $$
CREATE PROCEDURE `pnk`.`sp_create_account`(
	IN p_email VARCHAR(45),
    IN p_name VARCHAR(45),
    IN p_password VARCHAR(255),
    IN p_phone VARCHAR(15),
    IN p_address VARCHAR(255),
    IN p_postcode INT(6),
	IN p_city VARCHAR(45),
    IN p_country VARCHAR(45),
    IN p_otp VARCHAR(6)
)
Main: BEGIN
	DECLARE savedOtp VARCHAR(6);
    DECLARE otpExpiry DATETIME;
    DECLARE otpId INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SELECT '-1' AS ret, 'Transaction failed. Changes have been rolled back.' AS msg;
    END;
    
    START TRANSACTION;

	IF (p_email = '' OR p_email IS NULL 
		OR p_name = '' OR p_name IS NULL 
        OR p_password = '' OR p_password IS NULL 
        OR p_phone = '' OR p_phone IS NULL 
        OR p_address = '' OR p_address IS NULL
        OR p_postcode = '' OR p_postcode IS NULL
        OR p_city = '' OR p_city IS NULL
        OR p_country = '' OR p_country IS NULL
        OR p_otp = '' OR p_otp IS NULL) THEN
		CALL pnk.sp_err('-1209', 'Missing params');
		LEAVE Main;
    END IF;
    
    IF EXISTS (SELECT * FROM pnk.userCre WHERE email = p_email) THEN 
		SELECT 'Email have been registered.' AS errorMsg;
        LEAVE Main;
    END IF;
    
	IF NOT EXISTS (SELECT * FROM pnk.emailOtp WHERE email = p_email) THEN
		SELECT 'Please request OTP again.' AS errorMsg;
        LEAVE Main;
    END IF;
    
    SELECT id, otp, createAt INTO otpId, savedOtp, otpExpiry FROM pnk.emailOtp WHERE email = p_email;
    
	IF (otpExpiry IS NULL OR utc_timestamp() > DATE_ADD(otpExpiry, INTERVAL 5 MINUTE)) THEN
		DELETE FROM pnk.emailOtp 
        WHERE id = otpId;
        
		SELECT 'OTP expired, please request OTP again.' AS errorMsg;
		LEAVE Main;
    END IF;
    
    IF (savedOtp != p_otp) THEN 
		SELECT 'Invalid OTP' AS errorMsg;
        LEAVE Main; 
    END IF;
    
    INSERT INTO pnk.userCre(user, password, phone, email, address, city, postCode, country, createAt) 
    VALUES (p_name, p_password, p_phone, p_email, p_address, p_city, p_postcode, p_country, utc_timestamp());
    
    INSERT INTO pnk.cart(userId, status, createAt, updateAt) 
    VALUES (LAST_INSERT_ID(), 1, utc_timestamp(), utc_timestamp());	
    
	DELETE FROM pnk.emailOtp WHERE id = otpId;
    
    COMMIT;
END Main $$
DELIMITER ;


DELIMITER $$
DROP PROCEDURE IF EXISTS `pnk`.`sp_user_login` $$
CREATE PROCEDURE `pnk`.`sp_user_login`(
	IN p_sub VARCHAR(255),
    IN p_name VARCHAR(45),
    IN p_email VARCHAR(45),
    IN p_password VARCHAR(255)
)
Main: BEGIN
	DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SELECT '-1' AS ret, 'Transaction failed. Changes have been rolled back.' AS msg;
    END;

	IF (p_email IS NULL OR p_email = '') THEN
		CALL pnk.sp_err('-1203', 'Missing params');
		LEAVE Main;
	END IF;
    
	START TRANSACTION;
    
	-- Google login
	IF (p_sub IS NOT NULL AND p_sub != '') THEN
		IF EXISTS (SELECT 1 FROM pnk.userCre WHERE email = p_email) THEN
			SELECT CRE.id, CRE.google_id, CRE.user, CRE.password, CRE.phone, CRE.email, CRE.address, CRE.postCode, STATE.name AS city, CRE.country 
            FROM pnk.userCre CRE 
            LEFT JOIN pnk.state STATE ON STATE.id = CRE.city
            WHERE CRE.email = p_email;
		ELSE 
			INSERT INTO pnk.userCre(google_id, user, email, createAt, lastLogin)
			VALUES (p_sub, p_name, p_email, utc_timestamp(), utc_timestamp());
            
			SELECT id, google_id, user, password, phone, email, address, postCode, city, country FROM pnk.userCre WHERE id = last_insert_id();
            
            INSERT INTO pnk.cart(userId, status, createAt, updateAt)
			SELECT id, 1, utc_timestamp(), utc_timestamp()
			FROM pnk.userCre
			WHERE id = last_insert_id();
        END IF;
    ELSE 
		IF NOT EXISTS (SELECT * FROM pnk.userCre WHERE email = p_email) THEN
			SELECT 'Email does not exists' AS noTExists;
		ELSE 
			SELECT CRE.id, CRE.google_id, CRE.user, CRE.password, CRE.phone, CRE.email, CRE.address, CRE.postCode, STATE.name AS city, CRE.country 
            FROM pnk.userCre CRE 
            LEFT JOIN pnk.state STATE ON STATE.id = CRE.city
            WHERE CRE.email = p_email;
        END IF;
    END IF;
    
    COMMIT;    
END Main $$
DELIMITER ; 


DELIMITER $$
DROP PROCEDURE IF EXISTS `pnk`.`sp_add_item_cart_qty` $$
CREATE PROCEDURE `pnk`.`sp_add_item_cart_qty`(
    IN p_user_id INT,
    IN p_item_id INT
)
    SQL SECURITY INVOKER
Main: BEGIN
	DECLARE cartId INT DEFAULT 0;
    DECLARE stock INT DEFAULT 0;
    DECLARE cartQty INT DEFAULT 0;
    
    START TRANSACTION;
    
	IF (p_user_id IS NULL OR p_user_id = '' OR p_item_id IS NULL OR p_item_id = '') THEN
		ROLLBACK;
		CALL pnk.sp_err('-1209', 'Missing params');
        LEAVE Main;
    END IF;
    
     -- Check if the item exists and has sufficient quantity
    SELECT qty INTO stock FROM pnk.items WHERE id = p_item_id;
    IF stock <= 0 THEN
        ROLLBACK;
        SELECT 'Out of stock' AS msg;
        LEAVE Main;
    END IF;
    
    -- Get current quantity in the user's cart
    SELECT ITEM.qty INTO cartQty
    FROM pnk.cart_item ITEM
    INNER JOIN pnk.cart CART ON ITEM.cart_id = CART.id
    WHERE CART.userId = p_user_id AND ITEM.item_id = p_item_id;
    
    -- check if no more stock that user can add to cart
    IF (cartQty >= stock) THEN
		SELECT 'Out of stock' AS msg;
        LEAVE Main;
    END IF;
    
    -- Check if the cart and item already exist, then update the quantity
    IF EXISTS (
        SELECT 1
        FROM pnk.cart_item ITEM
        INNER JOIN pnk.cart CART ON ITEM.cart_id = CART.id
        WHERE CART.userId = p_user_id AND ITEM.item_id = p_item_id
    ) THEN
		-- Update item qty
		UPDATE pnk.cart_item ITEM
		INNER JOIN pnk.cart CART ON ITEM.cart_id = CART.id
		SET ITEM.qty = ITEM.qty + 1, ITEM.updateAt = utc_timestamp()
		WHERE CART.userId = p_user_id AND ITEM.item_id = p_item_id;
    ELSE 
		-- If the cart does not exist, create a new cart
		SELECT id INTO cartId FROM pnk.cart WHERE userId = p_user_id; 
			
		IF cartId IS NULL THEN
            INSERT INTO pnk.cart(userId, createAt, updateAt)
            VALUES (p_user_id, UTC_TIMESTAMP(), UTC_TIMESTAMP());
            SET cartId = LAST_INSERT_ID();
        END IF;
        
        -- Insert the item into the cart
		INSERT INTO pnk.cart_item(cart_id, item_id, qty, createAt, updateAt)
		VALUES (cartId, p_item_id, 1, UTC_TIMESTAMP(), UTC_TIMESTAMP());
    END IF;
    
    COMMIT;
    
    -- Return the updated cart items for the user
    SELECT ITEM.item_id AS id, NA.name, ITEM.qty, NA.qty AS stock_remain, NA.price
    FROM pnk.userCre CRE
    INNER JOIN pnk.cart CART ON CART.userId = CRE.id
    INNER JOIN pnk.cart_item ITEM ON ITEM.cart_id = CART.id
    INNER JOIN pnk.items NA ON ITEM.item_id = NA.id
    WHERE CRE.id = p_user_id;
END Main $$
DELIMITER ;


DELIMITER $$
DROP PROCEDURE IF EXISTS `pnk`.`sp_minus_item_cart_qty` $$
CREATE PROCEDURE `pnk`.`sp_minus_item_cart_qty`(
	IN p_user_id INT,
    IN p_item_id INT
)
Main: BEGIN
	DECLARE itemQty INT;
    DECLARE cartId INT DEFAULT 0;	
	
	START TRANSACTION;
    
	IF (p_user_id IS NULL OR p_user_id = '' OR p_item_id IS NULL OR p_item_id = '') THEN
		ROLLBACK;
        CALL pnk.sp_err('-1209', 'Missing params');
        LEAVE Main;
    END IF;
    
    SELECT id INTO cartId 
    FROM pnk.cart 
    WHERE userId = p_user_id;
    
    IF cartId IS NULL THEN
        INSERT INTO pnk.cart(userId, createAt, updateAt)
        VALUES (p_user_id, UTC_TIMESTAMP(), UTC_TIMESTAMP());
        SET cartId = LAST_INSERT_ID();
    END IF;
    
    SELECT ITEM.qty INTO itemQty
    FROM pnk.cart_item ITEM 
    INNER JOIN pnk.cart CART ON ITEM.cart_id = CART.id 
    WHERE CART.userId = p_user_id AND ITEM.item_id = p_item_id;
    
    IF itemQty = 1 THEN
		DELETE ITEM.* 
        FROM pnk.cart_item ITEM
        INNER JOIN pnk.cart CART ON ITEM.cart_id = CART.id
        WHERE CART.userId = p_user_id AND ITEM.item_id = p_item_id;
	ELSE
		UPDATE pnk.cart_item ITEM
        INNER JOIN pnk.cart CART ON ITEM.cart_id = CART.id
        SET ITEM.qty = ITEM.qty - 1, ITEM.updateAt = UTC_TIMESTAMP()
        WHERE CART.userId = p_user_id AND ITEM.item_id = p_item_id;
	END IF;
    
    COMMIT;
    
    SELECT ITEM.item_id AS id, NA.name, ITEM.qty, NA.qty AS stock_remain, NA.price
    FROM pnk.userCre CRE
    INNER JOIN pnk.cart CART ON CART.userId = CRE.id
    INNER JOIN pnk.cart_item ITEM ON ITEM.cart_id = CART.id
    INNER JOIN pnk.items NA ON ITEM.item_id = NA.id
    WHERE CRE.id = p_user_id;
END Main $$
DELIMITER ;


DELIMITER $$
DROP PROCEDURE IF EXISTS `pnk`.`sp_get_cart` $$
CREATE PROCEDURE `pnk`.`sp_get_cart`(
	IN p_user_id INT
)
Main: BEGIN
	IF (p_user_id IS NULL OR p_user_id = '') THEN
		CALL pnk.sp_err('-1209', 'Invalid param');
        LEAVE Main;
    END IF;
    
    SELECT ITEM.item_id AS id, NA.name, ITEM.qty, NA.qty AS stock_remain, NA.price
    FROM pnk.userCre CRE
    INNER JOIN pnk.cart CART ON CART.userId = CRE.id
    INNER JOIN pnk.cart_item ITEM ON ITEM.cart_id = CART.id
    INNER JOIN pnk.items NA ON ITEM.item_id = NA.id
    WHERE CRE.id = p_user_id;
END Main $$
DELIMITER ;


DELIMITER $$
DROP PROCEDURE IF EXISTS `pnk`.`sp_remove_item_cart` $$
CREATE PROCEDURE `pnk`.`sp_remove_item_cart`(
	IN p_user_id INT,
    IN p_item_id INT
)
Main: BEGIN
	DECLARE cartId INT DEFAULT 0;
	
    IF (p_user_id IS NULL OR p_user_id = '' OR p_item_id IS NULL OR p_item_id = '') THEN
		CALL pnk.sp_err('-1209', 'Missing params');
		LEAVE Main;
	END IF;
    
    SELECT id INTO cartId 
    FROM pnk.cart 
    WHERE userId = p_user_id;
    
    IF cartId IS NULL THEN
        INSERT INTO pnk.cart(userId, createAt, updateAt)
        VALUES (p_user_id, UTC_TIMESTAMP(), UTC_TIMESTAMP());
        SET cartId = LAST_INSERT_ID();
    END IF;
    
    DELETE ITEM.* 
	FROM pnk.cart_item ITEM
	INNER JOIN pnk.cart CART ON ITEM.cart_id = CART.id
	WHERE CART.userId = p_user_id AND ITEM.item_id = p_item_id;
    
    SELECT ITEM.item_id AS id, NA.name, ITEM.qty, NA.price
    FROM pnk.userCre CRE
    INNER JOIN pnk.cart CART ON CART.userId = CRE.id
    INNER JOIN pnk.cart_item ITEM ON ITEM.cart_id = CART.id
    INNER JOIN pnk.items NA ON ITEM.item_id = NA.id
    WHERE CRE.id = p_user_id;
END Main $$
DELIMITER ;

DROP PROCEDURE IF EXISTS `pnk`.`sp_get_main_product`;
DELIMITER $$
CREATE PROCEDURE `pnk`.`sp_get_main_product`()
BEGIN
	SELECT PDT.name
    FROM pnk.main_product MA
    INNER JOIN pnk.products PDT ON MA.p_id = PDT.id
    WHERE MA.status = 1 AND PDT.status = 1;
END $$
DELIMITER ;


DELIMITER $$
DROP PROCEDURE IF EXISTS `pnk`.`sp_insert_pending_checkout` $$
CREATE PROCEDURE `pnk`.`sp_insert_pending_checkout`(
	IN p_user_id INT,
    IN p_item_id INT,
    IN p_qty INT,
    IN p_amt INT
)
    SQL SECURITY INVOKER
Main: BEGIN
	DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; END;
    
	IF (p_user_id IS NULL OR p_user_id = ''OR p_item_id IS NULL OR p_item_id = '' OR p_qty IS NULL OR p_qty = '' OR p_amt IS NULL OR p_amt = '') THEN
		CALL pnk.sp_err('-1029', 'Invalid param');
        LEAVE Main;
    END IF;
    
	START TRANSACTION;
    
    -- check if item out of stock
    IF NOT EXISTS (SELECT 1 FROM pnk.items WHERE id = p_item_id AND qty >= p_qty) THEN
		SELECT 'item out of stock' AS outOfStock;
		LEAVE Main;
    END IF;
    
    -- deduct stock
    UPDATE pnk.items
    SET qty = qty - p_qty
    WHERE id = p_item_id;
    
    -- check if pending checkout exists
    IF EXISTS (SELECT 1 FROM pnk.checkout_pending WHERE userId = p_user_id AND itemId = p_item_id) THEN
		UPDATE pnk.checkout_pending
        SET qty = qty + p_qty
        WHERE userId = p_user_id AND itemId = p_item_id;
    ELSE 
		-- insert pending checkout 
		INSERT INTO pnk.checkout_pending(userId, itemId, qty, amt, createAt)
		VALUES(p_user_id, p_item_id, p_qty, p_amt, utc_timestamp());
    END IF;
    
    SELECT 'StateShippingFee' AS type, STA.shipping_fee AS shippingFee, NULL AS itemId
    FROM userCre USER
    INNER JOIN state STA ON USER.city = STA.id
    WHERE USER.id = p_user_id

    UNION ALL

    SELECT 'ItemShippingFee' AS type, ITEM.shipping_fee AS shippingFee, ITEM.id AS itemId
    FROM checkout_pending PENDING
    INNER JOIN items ITEM ON PENDING.itemId = ITEM.id
    WHERE PENDING.userId = p_user_id;
    
    COMMIT;
END Main $$
DELIMITER ;


DELIMITER $$
DROP PROCEDURE IF EXISTS `pnk`.`sp_delete_pending_checkout` $$
CREATE PROCEDURE `pnk`.`sp_delete_pending_checkout`(
	IN p_user_id INT
)
    SQL SECURITY INVOKER
Main: BEGIN
	DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; END;

	START TRANSACTION;
    
    IF (p_user_id IS NULL OR p_user_id = '' ) THEN
		-- Lock expired rows
        SELECT * 
        FROM pnk.checkout_pending 
        WHERE utc_timestamp() > DATE_ADD(createAt, INTERVAL 5 MINUTE) 
        FOR UPDATE;
        
        -- Restore stock for expired checkouts
        UPDATE pnk.items ITEM
		INNER JOIN pnk.checkout_pending PENDING ON ITEM.id = PENDING.itemId
		SET ITEM.qty = ITEM.qty + PENDING.qty
		WHERE utc_timestamp() > DATE_ADD(PENDING.createAt, INTERVAL 5 MINUTE);
		
        -- Delete expired pending checkouts
		DELETE FROM pnk.checkout_pending
		WHERE utc_timestamp() > DATE_ADD(createAt, INTERVAL 5 MINUTE);
    ELSE
		-- Restore stock for the specified user
		UPDATE pnk.items ITEM
		INNER JOIN pnk.checkout_pending PENDING ON ITEM.id = PENDING.itemId
		SET ITEM.qty = ITEM.qty + PENDING.qty
		WHERE PENDING.userId = p_user_id;
		
		 -- Delete pending checkouts for the specified user
		DELETE FROM pnk.checkout_pending PENDING WHERE PENDING.userId = p_user_id;
	END IF;
    
    COMMIT;
END Main $$
DELIMITER ;


DELIMITER $$
DROP PROCEDURE IF EXISTS `pnk`.`sp_get_user_infor` $$
CREATE PROCEDURE `pnk`.`sp_get_user_infor`(
	IN p_user_id INT
)
    SQL SECURITY INVOKER
Main: BEGIN
	IF (p_user_id IS NULL OR p_user_id = '') THEN
		SELECT phone, address, city, postCode, country FROM userCre;
    ELSE 
		SELECT phone, address, city, postCode, country
        FROM userCre 
        WHERE id = p_user_id;
    END IF;
END Main $$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `pnk`.`sp_get_product_img` $$
CREATE PROCEDURE `pnk`.`sp_get_product_img`(
	IN p_parent_id INT
)
    SQL SECURITY INVOKER
Main: BEGIN
    IF p_parent_id = '' OR p_parent_id IS NULL THEN
		SELECT p_id AS id, name AS image
        FROM pnk.image;
    ELSE 
		SELECT name AS image
        FROM p_id AS id, pnk.image
        WHERE p_id = p_parent_id;
    END IF;
END Main $$
DELIMITER ;