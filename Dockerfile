FROM node:22.6-bookworm-slim AS base

# set for base and all layer that inherit from it
ENV NODE_ENV=production

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl

# Build Anchor programs using the official Anchor image
FROM solanafoundation/anchor:v0.31.1 AS anchor-build

WORKDIR /myapp

# Copy only the files needed for Anchor build
ADD Anchor.toml Cargo.toml Cargo.lock ./
ADD programs ./programs

RUN anchor build

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
COPY --from=anchor-build /myapp/target /myapp/target

ADD prisma .
RUN npx prisma generate

ADD . .
RUN npm run build



# Finally, build the production image with minimal footprint
FROM base

WORKDIR /myapp

COPY --from=production-deps /myapp/node_modules /myapp/node_modules
COPY --from=build /myapp/node_modules/.prisma /myapp/node_modules/.prisma
COPY --from=anchor-build /myapp/target /myapp/target

COPY --from=build /myapp/build /myapp/build
COPY --from=build /myapp/public /myapp/public
COPY package.json .
COPY package-lock.json .
COPY .env.example .

USER 1001

CMD ["npm", "start"]