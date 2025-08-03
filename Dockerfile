FROM node:22.6-bookworm-slim AS base

# set for base and all layer that inherit from it
ENV NODE_ENV=production

# Install system dependencies including those needed for Rust and Solana
RUN apt-get update && apt-get install -y \
    openssl \
    curl \
    build-essential \
    pkg-config \
    libudev-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash


# Install all node_modules, including dev dependencies
FROM base AS deps

WORKDIR /myapp

ADD package.json package-lock.json ./
RUN npm ci --include=dev

# Setup production node_modules

FROM base AS production-deps

WORKDIR /myapp

COPY --from=deps /myapp/node_modules /myapp/node_modules
ADD package.json ./
RUN npm prune --omit=dev

# Build the app
FROM base AS build

WORKDIR /myapp

COPY --from=deps /myapp/node_modules /myapp/node_modules

# Copy Anchor and Rust related files
ADD Anchor.toml Cargo.toml Cargo.lock ./
ADD programs ./programs

# Generate Prisma client
ADD prisma ./prisma
RUN npx prisma generate

# Build Anchor programs
RUN anchor build

ADD . .
RUN npm run build

# Finally, build the production image with minimal footprint
FROM base

WORKDIR /myapp

COPY --from=production-deps /myapp/node_modules /myapp/node_modules
COPY --from=build /myapp/node_modules/.prisma /myapp/node_modules/.prisma

COPY --from=build /myapp/build /myapp/build
COPY --from=build /myapp/public /myapp/public
COPY package.json .
COPY package-lock.json .

USER 1001

CMD ["npm", "start"]