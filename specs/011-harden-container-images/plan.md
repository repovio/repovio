# Implementation Plan: Harden Container Images

**Issue**: [Arcane vulnerability triage](https://github.com/repovio/repovio/issues/105)

## Summary

Restrict production images to application runtime packages and update the API’s Apprise and Hono releases. Arcane’s common JavaScript findings are present in npm’s own dependencies in the Node base image. Build stages continue to use npm and Corepack. The runtime stages execute Node directly.

## Technical Context

Node.js 26.13.0, pnpm 11.28.9, Debian Bookworm, Docker, and Trivy. The final runtime filesystem is the validation target.

## Constitution Check

Keep the existing API/web version coupling, migration command, notification command, health checks, and website runtime user. Preserve the pinned toolchain and provider read-only behavior. The changes are limited to packaging and dependency versions.

## Project Structure

The change touches `apps/{api,web,website}/Dockerfile`, `pnpm-workspace.yaml`, and `pnpm-lock.yaml`. No application schema or API contract changes.
