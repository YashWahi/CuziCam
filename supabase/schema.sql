-- CuziCam Supabase PostgreSQL schema.
-- Run this in Supabase SQL Editor for a fresh project.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'Gender') then
    create type "Gender" as enum ('MALE', 'FEMALE');
  end if;
  if not exists (select 1 from pg_type where typname = 'ReportReason') then
    create type "ReportReason" as enum ('FAKE_PROFILE', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'UNDERAGE');
  end if;
  if not exists (select 1 from pg_type where typname = 'ReportStatus') then
    create type "ReportStatus" as enum ('PENDING', 'RESOLVED', 'DISMISSED');
  end if;
  if not exists (select 1 from pg_type where typname = 'UserRole') then
    create type "UserRole" as enum ('USER', 'ADMIN');
  end if;
end $$;

create table if not exists "College" (
  "id" text primary key default gen_random_uuid()::text,
  "name" text not null,
  "domain" text not null unique,
  "city" text,
  "country" text not null default 'India',
  "createdAt" timestamptz not null default now()
);

create table if not exists "User" (
  "id" text primary key default gen_random_uuid()::text,
  "email" text not null unique,
  "name" text not null,
  "avatarUrl" text,
  "bio" text,
  "year" text,
  "branch" text,
  "interests" text[] not null default array[]::text[],
  "gender" text,
  "role" "UserRole" not null default 'USER',
  "vibeScore" double precision not null default 5.0,
  "onboardingComplete" boolean not null default false,
  "isVerified" boolean not null default false,
  "isEmailVerified" boolean not null default false,
  "isBanned" boolean not null default false,
  "shadowBanned" boolean not null default false,
  "strictPreference" boolean not null default false,
  "googleId" text unique,
  "passwordHash" text,
  "emailVerifyToken" text,
  "refreshToken" text,
  "lastSeen" timestamptz not null default now(),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "collegeId" text references "College"("id") on delete set null on update cascade
);

create table if not exists "MatchSession" (
  "id" text primary key default gen_random_uuid()::text,
  "startTime" timestamptz not null default now(),
  "endTime" timestamptz,
  "durationSeconds" integer,
  "skipReason" text,
  "avgToxicityScore" double precision,
  "messageCount" integer not null default 0,
  "icebreaker" text,
  "chaosWindow" boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "userAId" text not null references "User"("id") on delete restrict on update cascade,
  "userBId" text not null references "User"("id") on delete restrict on update cascade
);

create table if not exists "Star" (
  "id" text primary key default gen_random_uuid()::text,
  "createdAt" timestamptz not null default now(),
  "sessionId" text not null references "MatchSession"("id") on delete restrict on update cascade,
  "giverId" text not null references "User"("id") on delete restrict on update cascade,
  "receiverId" text not null references "User"("id") on delete restrict on update cascade,
  unique ("sessionId", "giverId")
);

create table if not exists "Connection" (
  "id" text primary key default gen_random_uuid()::text,
  "createdAt" timestamptz not null default now(),
  "userAId" text not null references "User"("id") on delete restrict on update cascade,
  "userBId" text not null references "User"("id") on delete restrict on update cascade,
  "sessionId" text,
  unique ("userAId", "userBId")
);

create table if not exists "Confession" (
  "id" text primary key default gen_random_uuid()::text,
  "content" text not null,
  "upvotes" integer not null default 0 check ("upvotes" >= 0),
  "isVisible" boolean not null default true,
  "toxicScore" double precision,
  "createdAt" timestamptz not null default now(),
  "collegeId" text not null references "College"("id") on delete restrict on update cascade,
  "authorId" text references "User"("id") on delete set null on update cascade
);

create table if not exists "ConfessionUpvote" (
  "id" text primary key default gen_random_uuid()::text,
  "createdAt" timestamptz not null default now(),
  "confessionId" text not null references "Confession"("id") on delete cascade on update cascade,
  "userId" text not null references "User"("id") on delete cascade on update cascade,
  unique ("confessionId", "userId")
);

create table if not exists "Report" (
  "id" text primary key default gen_random_uuid()::text,
  "reason" "ReportReason" not null,
  "description" text,
  "status" "ReportStatus" not null default 'PENDING',
  "resolvedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "reporterId" text not null references "User"("id") on delete restrict on update cascade,
  "reportedId" text not null references "User"("id") on delete restrict on update cascade,
  "sessionId" text references "MatchSession"("id") on delete set null on update cascade
);

create table if not exists "Block" (
  "id" text primary key default gen_random_uuid()::text,
  "createdAt" timestamptz not null default now(),
  "blockerId" text not null references "User"("id") on delete restrict on update cascade,
  "blockedId" text not null references "User"("id") on delete restrict on update cascade,
  unique ("blockerId", "blockedId")
);

create index if not exists "User_collegeId_idx" on "User"("collegeId");
create index if not exists "User_vibeScore_idx" on "User"("vibeScore");
create index if not exists "MatchSession_userAId_idx" on "MatchSession"("userAId");
create index if not exists "MatchSession_userBId_idx" on "MatchSession"("userBId");
create index if not exists "MatchSession_startTime_idx" on "MatchSession"("startTime");
create index if not exists "Star_sessionId_idx" on "Star"("sessionId");
create index if not exists "Confession_collegeId_createdAt_idx" on "Confession"("collegeId", "createdAt");
create index if not exists "ConfessionUpvote_userId_idx" on "ConfessionUpvote"("userId");
create index if not exists "Report_status_idx" on "Report"("status");

create or replace function set_updated_at()
returns trigger as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists "User_set_updatedAt" on "User";
create trigger "User_set_updatedAt"
before update on "User"
for each row
execute function set_updated_at();
