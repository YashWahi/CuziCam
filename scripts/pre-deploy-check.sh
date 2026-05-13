#!/bin/bash
echo "=== CuziCam Pre-Deploy Check ==="
PASS=0
FAIL=0

check() {
  if eval "$2" > /dev/null 2>&1; then
    echo "✅ $1"
    PASS=$((PASS+1))
  else
    echo "❌ $1"
    FAIL=$((FAIL+1))
  fi
}

# Token naming — no old 'token' cookie name
check "No 'token' cookie (must be accessToken)" \
  "! grep -r \"cookie('token'\" backend/src"

# .edu restriction removed
check "No .edu email restriction" \
  "! grep -r '\.edu' backend/src/schemas frontend/src"

# No hardcoded JWT secrets
check "No hardcoded JWT secrets" \
  "! grep -r \"jwt_secret\s*=\s*['\\\"]\" backend/src"

# Postgres provider in schema
check "Prisma using postgresql provider" \
  "grep -q 'provider = \"postgresql\"' backend/prisma/schema.prisma"

# CORS uses env var
check "CORS uses FRONTEND_URL env var" \
  "grep -q 'FRONTEND_URL' backend/src/index.ts"

# AI service snake_case
check "AI service uses snake_case fields" \
  "grep -q 'interests_a' backend/src/services/ai.service.ts"

# partnerId stored in sessionStorage on match
check "partnerId stored in sessionStorage on match" \
  "grep -q 'sessionStorage.setItem.*partnerId' frontend/src/app/queue/page.tsx"

# Rate limiter applied
check "Rate limiter on auth routes" \
  "grep -q 'authLimiter' backend/src/routes/auth.routes.ts"

# Zod validation on register
check "Zod validation on register route" \
  "grep -q 'validateBody(registerSchema)' backend/src/routes/auth.routes.ts"

# No SQLite db files committed
check "No SQLite .db files tracked by git" \
  "! git ls-files | grep -q '\.db$'"

# .env not committed
check ".env not tracked by git" \
  "! git ls-files | grep -q '^backend/.env$'"

# Shared secret header in AI service client
check "AI service client sends x-internal-secret" \
  "grep -q 'x-internal-secret' backend/src/services/ai.service.ts"

# AI service secured with verify_secret dependency
check "AI service endpoints protected with verify_secret" \
  "grep -q 'verify_secret' ai-service/app/main.py"

# Prisma enums exist in schema
check "ReportReason enum in Prisma schema" \
  "grep -q 'enum ReportReason' backend/prisma/schema.prisma"

# Cookie is httpOnly in auth controller
check "accessToken cookie is httpOnly:true" \
  "grep -q 'httpOnly: true' backend/src/controllers/auth.controller.ts"

# Procfile exists for backend
check "Backend Procfile exists" \
  "test -f backend/Procfile"

# Procfile exists for ai-service
check "AI service Procfile exists" \
  "test -f ai-service/Procfile"

echo ""
echo "Results: $PASS passed, $FAIL failed"
if [ $FAIL -gt 0 ]; then
  echo "🚫 Fix all failures before deploying."
  exit 1
else
  echo "🚀 All checks passed. Safe to deploy."
  exit 0
fi
