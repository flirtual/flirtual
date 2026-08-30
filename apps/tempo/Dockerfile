FROM grafana/tempo:1.5.0@sha256:975b3727528f5d9986c0564cc61a9372eb5dea6ed5dd898a30796880d8ab4bca

COPY ./tempo-config.yaml /etc/tempo.yaml

CMD ["/tempo", "-config.file=/etc/tempo.yaml"]
