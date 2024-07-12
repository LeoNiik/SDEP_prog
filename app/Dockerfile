FROM node:14

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production
ENV EMAIL='francolama21@gmail.com'
ENV EMAIL_PASS='lqrc wlaz stht fgnp'
ENV DB_PASSWORD='password' 
# Bundle app source
COPY . .

EXPOSE 80
CMD [ "node", "server.js" ]
