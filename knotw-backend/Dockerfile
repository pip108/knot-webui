FROM alpine:3.16
RUN apk update
RUN apk upgrade
RUN apk add knot knot-utils nodejs yarn
RUN mkdir -p /run/knot
RUN deluser knot
RUN adduser -u 1000 -S knot
RUN addgroup -g 1000 knot
RUN adduser knot knot
RUN chown knot:knot /run/knot
RUN chown knot:knot /var/lib/knot
COPY --chown=knot:knot knot/knot.conf /etc/knot/knot.conf
COPY --chown=knot:knot knot/zones/*.zone /var/lib/knot/zones/
WORKDIR /app
ARG knotv_version
ENV knotv_version=$knotv_version
COPY . .
RUN yarn install
RUN yarn build
CMD ["./entrypoint.sh"]