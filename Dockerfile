FROM icr.pepita.io/qa/docker-images/debian:12-slim

RUN curl https://github.com/immobiliare/dats/releases/download/v5.0.1/dats-cli-linux -L -o dats-cli
RUN chmod +x ./dats-cli
