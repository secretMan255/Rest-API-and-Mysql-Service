# Introduce

This is a express rest api backend service that connect with mysql database

# Setup Instructions

Create store procedure sql query and create database and table [script](https://github.com/secretMan255/Rest-API-and-Mysql-Service/tree/main/db)

Set environment variable

-    NODE_ENV: dev or prod
-    SECRET_KEY: API secret
-    DATABASE_URL: mysql://username:password@host:port/database (dev)
-    DB_USER: database username (prod)
-    DB_PASS: database password (prod)
-    DB_NAME: database host (prod)
-    INSTANCE_CONNECTION_NAME: google cloud sql connection instance (prod)
-    ALLOWED_ORIGINS: cros origin
-    PORT: express port
-    EXPIRES_IN: cookie expires time
-    emailService: email provider
-    emailHost: email host
-    emailPort: email port
-    emailUser: email
-    emailPass: app pass
-    cronTime='_/5 _ \* \* \*' (cronService run time)

Install Dependencies

```
npm i
```

Start the Project

```
npm run dev
```

# Deployment

Create a Dockerfile in root path (already provided)

```
# Base image: Node.js with Alpine for a lightweight image
FROM node:22.11.0-alpine

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json into the container
COPY package*.json ./

# Install project dependencies
RUN npm install --production

# Copy the rest of the application code into the container
COPY . .

# Expose the application port
EXPOSE 8000

# Define the default command to run your application
CMD ["npm", "start"]

```

Create script (googleDeploy.sh) at root path if u want to deploy on google cloud run
Start Deploy

```
./googleDeploy.sh
```

Script

```
#!/bin/bash

# Define environment variables
GOOGLE_PROJECT_ID=
CLOUD_RUN_SERVICE=
DB_USER=
DB_PASS=
DB_NAME=
INSTANCE_CONNECTION_NAME=
ALLOWED_ORIGINS=
EXPIRES_IN=
emailService=
emailHost=
emailPort=
emailUser=
emailPass=
cronTime=

# Step 2: Deploy to Cloud Run
gcloud run deploy $CLOUD_RUN_SERVICE \
     --image=
     --add-cloudsql-instances=$INSTANCE_CONNECTION_NAME \
     --update-env-vars=CLOUD_RUN_SERVICE=$CLOUD_RUN_SERVICE,DB_USER=$DB_USER,DB_PASS=$DB_PASS,DB_NAME=$DB_NAME,INSTANCE_CONNECTION_NAME=$INSTANCE_CONNECTION_NAME,EXPIRES_IN=$EXPIRES_IN,emailService=$emailService,emailHost=$emailHost,emailPort=$emailPort,emailUser=$emailUser,emailPass=$emailPass,cronTime=$cronTime \
     --platform=managed \
     --region=asia-southeast1 \
     --allow-unauthenticated \
     --project=$GOOGLE_PROJECT_ID

```

# products table explanation

lv and off-white is bag child
| id | name | p_id |
|-----:|------------------|-------|
| 1| bag | |
| 2| lv | 1 |
| 3| off-white | 1 |
| 4| nike air jordan | |

# items table explanation

items.p_id refer to products.id
| id | name | p_id |
|-----:|------------------|-------|
| 1| bag | 2 |
| 2| bag | 3 |
| 3| chichago | 4 |

# cart table explanation

|  id | userId |
| --: | ------ |
|   1 | 12     |

# cart_item table explanation

cart_id refer to cart.id
| id | cart_id | item_id |
|-----:|------------------|----------|
| 1| 12 | 3 |

# image table explanation

p_id refer to the products.id
| id | name | p_id |
|-----:|------------------|----------|
| 1| chichagoImage | 3 |

-    subscribe table saved subscriber email
-    userCre table saved user credential
-    emailOtp table saved otp
-    state table saved delivery fees
-    cart table saved user cart
-    cart_item table saved user cart item
-    main_product table saved the products that show at the home page
-    checkout_pending table saved the items wating fot paid
-    image table save the products carousel iamge

# Store Procedure explanation comming soon
