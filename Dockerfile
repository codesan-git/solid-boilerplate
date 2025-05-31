# Step 1: Building the project
FROM oven/bun:latest AS builder

WORKDIR /app
COPY . .
RUN bun install
RUN bun run build

# Step 2: Server the build file from previous step with smaller image to reduce app size
FROM oven/bun:alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
CMD ["bunx", "serve", "-l", "3000", "dist"]