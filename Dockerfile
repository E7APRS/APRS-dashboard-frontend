# ── Stage 1: Install dependencies ────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app
COPY .npmrc package*.json ./
RUN npm ci

# ── Stage 2: Build ───────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args — pass real values via flyctl deploy --build-arg or [build.args] in fly.toml
ARG NEXT_PUBLIC_BACKEND_URL="https://aprs-dashboard-backend.fly.dev"
ARG NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co"
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder-key"
ARG NEXT_PUBLIC_BASE_URL="https://aprs-dashboard-frontend.fly.dev"
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

RUN npm run build

# ── Stage 3: Production ─────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Next.js standalone binds to HOSTNAME; Docker sets HOSTNAME to container ID
# which breaks binding, so we force 0.0.0.0
ENV HOSTNAME=0.0.0.0
ENV PORT=7530

# Copy standalone server + static assets + public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 7530

CMD ["node", "server.js"]
