# Auth API Blueprint — OGC NewFinity Platform

This document describes the Auth API based on the shared API blueprint template.

---

## 1. Overview

**Service name:** Auth Service  
**Domain:** Authentication & Session Management  
**Purpose:**  

Handles login, logout, refresh tokens, and account session control.

---

## 2. Base Configuration

**Base URL:** /auth  
**Auth type:** JWT (access + refresh)  
**Version:** v1  

---

## 3. Endpoints

### 3.1 POST /auth/login

**Description:**  

Authenticate user with email/password and return tokens.

**Requires auth:** no  

**Request:**

- Body:

  - email: string  

  - password: string  

**Response:**

- 200: accessToken, refreshToken, user summary  

- 400: invalid payload  

- 401: invalid credentials  

- 429: too many attempts  

---

### 3.2 POST /auth/refresh

**Description:**  

Refresh access token using a valid refresh token.

**Requires auth:** refresh token  

**Request:**

- Cookies or headers containing refresh token  

**Response:**

- 200: new accessToken  

- 401: invalid or expired refresh token  

---

### 3.3 POST /auth/logout

**Description:**  

Invalidate the current refresh token / session.

**Requires auth:** yes  

**Response:**

- 204: logout successful  

