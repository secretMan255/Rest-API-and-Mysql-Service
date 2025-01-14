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
CREATE PROCEDURE `sp_insert_subscribe`(
	IN p_email VARCHAR(100)
)
Main: BEGIN
	IF EXISTS (SELECT id FROM pnk.subscribe WHERE email = p_email) THEN
		SIGNAL SQLSTATE '45000' 
			SET MESSAGE_TEXT = 'Duplicate email detected';
		LEAVE Main;
	END IF;

	INSERT INTO pnk.subscribe(email, createAt)
	VALUES (p_email, CURRENT_TIMESTAMP()); 
END Main $$
DELIMITER ;