FROM grafana/tempo:1.5.0

COPY ./tempo-config.yaml /etc/tempo.yaml

CMD ["/tempo", "-config.file=/etc/tempo.yaml"]
