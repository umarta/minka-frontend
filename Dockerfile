FROM node:20-slim as builds

# argument for copy sitemaps
ARG env

# Labels
LABEL Name="cb-web-discovery" \
    Version="1.0"

# Create app directory
WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install --frozen-lockfile --ignore-engines --network-timeout 600000

COPY . .
# RUN npm install
ENV NODE_ENV=production
RUN yarn build

### RUnning copy sitemaps ####
RUN echo $env
RUN if [ "$env" = "production" ]; then echo "#### Copy sitemap PROD ###" && cp /usr/src/app/sitemap-base.xml /usr/src/app/public/sitemap.xml && ls /usr/src/app/public/sitemap.xml; else echo "#### sitemap UAT ###"; fi

# FROM node:20-slim

# WORKDIR /usr/src/app

# COPY --from=builds /app/package*.json ./
# COPY --from=builds /app/.next ./.next
# COPY --from=builds /app/public ./public
# COPY --from=builds /app/node_modules ./node_modules
# ENV NODE_ENV=production

# use alpine for last container
FROM node:20-alpine

WORKDIR /usr/src/app

## update apk and install ca-certificates for S3 upload
# Add DNS resolver and retry mechanism to fix stuck issues
# Alternative: Use more reliable mirror if needed
# Note: ca-certificates and tzdata might already be included in base image
RUN echo "nameserver 8.8.8.8" > /etc/resolv.conf && \
    echo "nameserver 8.8.4.4" >> /etc/resolv.conf && \
    apk update && \
    apk add -U --no-cache ca-certificates tzdata --retries 3 || \
    (echo "http://dl-cdn.alpinelinux.org/alpine/v3.18/main" > /etc/apk/repositories && \
     echo "http://dl-cdn.alpinelinux.org/alpine/v3.18/community" >> /etc/apk/repositories && \
     apk update && \
     apk add -U --no-cache ca-certificates tzdata) || \
    echo "Skipping ca-certificates and tzdata installation - using base image packages"

####### COPYING to DOCKER CONTAINER #######
### COPY timezone
ENV TZ=Asia/Jakarta
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ >/etc/timezone

#RUN apk add --no-cache nodejs

COPY --from=builds /usr/src/app .

# Service and Management ports
#EXPOSE 81/tcp 82/tcp

EXPOSE 3000
CMD [ "yarn", "run", "start" ]