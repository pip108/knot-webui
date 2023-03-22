FROM alpine:3.16
RUN apk update
RUN apk upgrade
RUN apk add nodejs yarn

ARG knotv_version
ENV knotv_version=$knotv_version
WORKDIR /app
COPY package.json .
COPY yarn.lock .
COPY tsconfig.json .
COPY knotv_version.js .
COPY entrypoint.sh .
COPY . .
RUN yarn install
RUN node knotv_version.js
CMD ["./entrypoint.sh"]