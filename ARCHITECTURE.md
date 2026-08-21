# Architecture

## Backend
Java 17 + Spring Boot 3

Layer
Controller
→ Service
→ Repository
→ MySQL

## Frontend
React + TypeScript + Vite

Responsive Web + PWA

## Domain

Wedding
BudgetCategory
BudgetItem
Payment
Payer
InvitationMeeting
Vendor
Quote

## Principle

Backend is the source of truth for budget calculations.

식대 / 신혼여행 / 청첩장 모임 비용은
Wedding 본예산 계산에서 제외한다.
