Conenct with public ip

sudo ufw allow from ip to any port 3306

mysql -u root -p

DELETE FROM mysql.db WHERE User = 'developer';
DELETE FROM mysql.proxies_priv WHERE User = 'developer';

SELECT User, Host FROM mysql.user;

CREATE USER 'developer'@'%' IDENTIFIED BY 'StrongPassword!@#123';
GRANT ALL PRIVILEGES ON _._ TO 'developer'@'%';
FLUSH PRIVILEGES;

BUILD IMAGE
docker build -t <image-name>
