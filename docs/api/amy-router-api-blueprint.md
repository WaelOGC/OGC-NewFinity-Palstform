# Amy Router API Blueprint — OGC NewFinity Platform

This document describes the API surface of the Amy AI Agent Router.

---

## 1. Overview

**Service name:** Amy Router  
**Domain:** Tool routing, AI task handling, and response formatting.  

---

## 2. Base Configuration

**Base URL:** /amy  
**Auth type:** JWT  
**Version:** v1  

---

## 3. Endpoints

### 3.1 POST /amy/tool

**Description:**  

Execute a specific Amy tool (writer, coder, designer, etc.).

**Requires auth:** yes  

**Request:**

- toolId: string  

- payload: object (tool-specific)



**Response:**

- 200: result object  

- 400: invalid tool or payload  

- 402: insufficient credits (if enforced)  

---

### 3.2 POST /amy/auto

**Description:**  

Let Amy decide which tool(s) to use based on the prompt.

**Requires auth:** yes  

**Request:**

- prompt: string  

- context: optional object  

**Response:**

- 200: result object, usedTools[]  

