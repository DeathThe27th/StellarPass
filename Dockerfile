FROM ubuntu:24.04

RUN apt-get update && apt-get install -y curl nodejs npm && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install nargo beta.9
RUN curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
ENV PATH="/root/.nargo/bin:$PATH"
RUN /root/.nargo/bin/noirup -v 1.0.0-beta.9

# Install bb v0.87.0
RUN mkdir -p /root/.bb/bin && \
    curl -L https://github.com/AztecProtocol/aztec-packages/releases/download/v0.87.0/barretenberg-amd64-linux.tar.gz \
    -o /tmp/bb.tar.gz && \
    tar -xzf /tmp/bb.tar.gz -C /root/.bb/bin && \
    chmod +x /root/.bb/bin/bb
ENV PATH="/root/.bb/bin:$PATH"

COPY package.json package-lock.json ./
RUN npm install

COPY circuits ./circuits
COPY prover-server.mjs ./

ENV HOME=/root
ENV NARGO_HOME=/tmp
ENV XDG_CACHE_HOME=/tmp
ENV PORT=4000

EXPOSE 4000
CMD ["node", "prover-server.mjs"]
