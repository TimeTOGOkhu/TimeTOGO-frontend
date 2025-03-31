FROM node:22.14.0-alpine3.21

# set our node environment, either development or production
# defaults to production, compose overrides this to development on build and run
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

# install global packages
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH /home/node/.npm-global/bin:$PATH
RUN npm i --unsafe-perm --allow-root -g npm@10.9.2 @expo/cli@0.22.21

# install dependencies first, in a different location for easier app bind mounting for local development
# due to default /opt permissions we have to create the dir with root and change perms
RUN mkdir /frontend
WORKDIR /frontend
ENV PATH ./.bin:$PATH
COPY ./package.json ./package-lock.json ./
RUN npm install

# copy in our source code last, as it changes the most
WORKDIR /frontend/
# for development, we bind mount volumes; comment out for production
COPY ./ /frontend/

ENTRYPOINT ["npm", "run"]
CMD ["web"]
