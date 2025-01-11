DELIMITER $$
CREATE PROCEDURE `sp_get_product_list`(
	IN p_status INT
)
BEGIN
	IF p_status = 0 THEN
		SELECT id, name, p_id, status
		FROM pnk.products;
	ELSEIF p_status = 1 THEN
		SELECT id, name, p_id, status
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