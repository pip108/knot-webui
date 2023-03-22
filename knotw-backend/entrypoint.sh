#!/bin/sh
chown -R knot:knot /var/lib/knot/zones
chown knot:knot /etc/knot/knot.conf
knotd &
yarn dev