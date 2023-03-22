#! /bin/bash
tag='knotw-backend:dev'
knotv_version="$(git describe --all) ($(git log --pretty=format:"%h" -1))"
echo $knotv_version
docker build . -t "${tag}" --build-arg knotv_version="${knotv_version}"