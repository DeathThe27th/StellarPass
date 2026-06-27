FROM ubuntu:24.04

# ubuntu:24.04 ships GLIBC 2.39 / GLIBCXX 3.4.33, which satisfies the
# requirements of the committed bb v0.87.0 binary (needs GLIBC 2.38+).
RUN apt-get update && apt-get install -y curl ca-certificates nodejs npm && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# The prover invokes ./bin/nargo and ./bin/bb by absolute path
# (see prover-server.mjs). These committed binaries are the SAME
# nargo beta.9 / bb v0.87.0 that produced the on-chain VK, so the
# proof format matches the deployed Soroban verifier. Do NOT swap
# these for bb.js / noir_js npm packages — those are different
# versions (bb.js 5.x) and would produce an incompatible proof/VK.
COPY bin ./bin
RUN chmod +x bin/nargo bin/bb

COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY circuits ./circuits
COPY prover-server.mjs ./

ENV HOME=/root
ENV NARGO_HOME=/tmp
ENV XDG_CACHE_HOME=/tmp
ENV XDG_CONFIG_HOME=/tmp
ENV PORT=4000

EXPOSE 4000
CMD ["node", "prover-server.mjs"]
