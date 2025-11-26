# OGC NewFinity — AI Gateway API Contract (v1.0)



## 1. Introduction

The AI Gateway API serves as the unified interface between the OGC NewFinity platform and all AI model providers (OpenAI, future custom models, multimodal models, etc.).  



This API handles:

- AI request routing  

- Rate limit enforcement  

- Subscription tier validation  

- Token usage calculation  

- Logging for analytics  

- Response normalization  

- Future multi-model orchestration  



It is one of the most important backend components powering the Amy Agent.



---



# 2. Base Path & Versioning



All AI Gateway endpoints follow:



/api/v1/ai/*



yaml

Copy code

Responses are **JSON**.

---
# 3. Core Concepts

### **AI Tools**

Different tools (Writer, Analyzer, Generator, etc.) map to specific prompt templates and model parameters.



### **Tier-Based Access**

- Free → limited tools  

- Pro → full access  

- Enterprise → extended limits  



### **Quota and Token Usage**

Every request logs:

- tokens_in  

- tokens_out  

- model  

- user_id  

- tool_name  



### **AI Gateway Logic**

Before any request is sent to a model:

1. Validate subscription tier  

2. Check AI quota  

3. Validate input  

4. Select model based on tool  

5. Forward request to provider  

6. Log request  

7. Return normalized result  



---



# 4. Endpoints



---



## 4.1 POST `/ai/generate`

### Description

Primary endpoint to generate text responses from an AI tool.



### Headers

Authorization: `Bearer ACCESS_TOKEN`



### Request Body

```json
{
  "tool": "string",
  "prompt": "string",
  "options": {
    "temperature": 0.7,
    "max_tokens": 1000
  }
}
```



### Success Response

{

"success": true,

"output": "Generated text...",

"metadata": {

"tokens_in": 120,

"tokens_out": 450,

"model": "gpt-4.1",

"tool": "blog-writer"

}

}



yaml

Copy code



### Error Codes

- `AI_TOOL_NOT_FOUND`

- `AI_TIER_RESTRICTED`

- `AI_RATE_LIMIT_REACHED`

- `AI_PROVIDER_ERROR`



---



## 4.2 POST `/ai/analyze`

### Description

Processes text for analysis tasks such as summarization, rewriting, or classification.



### Request Body

{

"tool": "string",

"input": "string"

}



shell

Copy code



### Success Response

{

"success": true,

"analysis": "string",

"metadata": { ... }

}



yaml

Copy code



---



## 4.3 POST `/ai/multitool`

### Description

Executes multi-step operations (future expansion).



### Request Body

{

"steps": [

{

"tool": "string",

"input": "string"

}

]

}



shell

Copy code



### Success Response

{

"success": true,

"results": [...],

"metadata": { ... }

}



yaml

Copy code



---



# 5. Admin & System Endpoints



(Used internally by analytics and admin dashboards)



---



## 5.1 GET `/ai/logs`

### Description

Returns AI usage logs (admin-only).



### Response

{

"success": true,

"logs": [

{

"user_id": "string",

"tool": "string",

"tokens_in": 50,

"tokens_out": 200,

"timestamp": "ISO"

}

]

}



yaml

Copy code



---



## 5.2 POST `/ai/recalculate-limits`

### Description

Recalculates quota limits (admin-only).



---



# 6. Validation Rules



- User must be authenticated  

- Tool must exist in backend registry  

- Quotas must be checked before running  

- Inputs exceeding token limits must be rejected  

- Enterprise tier may override some limits  



---



# 7. Error Response Format



{

"success": false,

"error": {

"code": "ERROR_CODE",

"message": "Readable error message"

}

}



yaml

Copy code



---



# 8. Logging Requirements



Each AI request logs:

- user_id  

- tool  

- prompt size  

- tokens_in  

- tokens_out  

- provider model  

- response time  

- tier-based credit usage  



All logs must be saved to `ai_logs`.



---



# 9. Security Requirements



- Prevent prompt injection via sanitization  

- Validate tool configuration server-side  

- Enforce RBAC on admin endpoints  

- Prevent excessive load (throttling)  

- Encrypt logs at rest  



---



# 10. Future Extensions



- Vision model support  

- Audio & speech processing tools  

- Multi-provider routing  

- Model fallback logic  

- AI agent workflows  

- Prompt template versioning  

- AI fine-tuning endpoints  



---



# 11. Conclusion

This contract defines the official backend interface for the AI Gateway powering the Amy Agent.  

All AI-related processing, logging, quota enforcement, and tool-based routing must follow this specification.

