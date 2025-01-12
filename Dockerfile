# OS image or node image
FROM node:22.11.0-alpine

# install system dependencies and NVM
# RUN apt-get update && apt-get install -y curl build-essential && \
#     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# install nodejs
# RUN bash -c "source ~/.bashrc && nvm install 22.11.0 && nvm use 22.11.0"

# working directory
WORKDIR /usr/src/app

# copy package into container
COPY package*.json ./

# init project node_module
# RUN bash -c "source ~/.bashrc && npm install"
RUN npm install

# copy code into container
COPY . .

# copy env file into container
# COPY .env .env

# defined api port
EXPOSE 8000

# run project
CMD ["npm", "start"]