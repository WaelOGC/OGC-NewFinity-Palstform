# OGC NewFinity — Backend File Processing & Validation Pipeline Specification (v1.0)



## 1. Introduction

This document defines the backend pipeline used for **file processing, validation, sanitization, transformation, and security filtering** across the OGC NewFinity ecosystem.



This engine protects users and the platform from:

- Invalid file formats  

- Malicious payloads  

- Oversized uploads  

- Unsafe metadata  

- Incorrect submission formats  

- Unsupported media types  



It powers file handling for:

- Submissions  

- Profile uploads  

- Challenge resources  

- Admin uploads  

- System assets  



---



# 2. File Processing Pipeline Overview



The pipeline consists of 6 stages:



Upload → Sanitize → Validate → Store → Record → Link



markdown

Copy code



### 1. Upload  

User uploads file via `/files/upload`.



### 2. Sanitize  

The system cleans file names, strips unsafe metadata, and prepares file for validation.



### 3. Validate  

Checks file type, size, security risk, and matches challenge or system rules.



### 4. Store  

Upload to private or public S3-compatible bucket.



### 5. Record  

Create a DB file record with metadata.



### 6. Link  

Attach the file to:

- Submission  

- Challenge  

- User profile  

- Admin asset  



---



# 3. Accepted File Categories



### Images:

- jpg  

- jpeg  

- png  

- webp  



### Documents:

- pdf  



### Video:

- mp4 (limited support; size restrictions apply)



### Archives:

- zip  



### Forbidden:

- Any executable format  

- Any scripting format  

- Obfuscated payload files  

- Unexpected binary formats  



If forbidden, the system returns:

error.code = "UNSUPPORTED_FILE_TYPE"



yaml

Copy code



---



# 4. File Upload Endpoint



### Endpoint:

POST /api/v1/files/upload



markdown

Copy code



### Payload:

- `file`: the file  

- `type`: (profile | submission | challenge | admin | system)  



### Response:

{

"success": true,

"data": {

"fileId": "cuid",

"fileUrl": "https://...",

"bucket": "private",

"size": 3294938,

"mimeType": "image/png"

}

}



yaml

Copy code



---



# 5. File Sanitization Rules



### 5.1 Filename Sanitization

The system must:

- Remove unsafe characters  

- Strip whitespace  

- Convert spaces to hyphens  

- Remove non-UTF8 symbols  

- Convert filename to lowercase  

- Prevent extension spoofing  



Example:

`"My Crazy Image (Final)!!.PNG"` →  

`"my-crazy-image-final.png"`



---



### 5.2 Metadata Stripping

System strips:

- EXIF GPS data  

- Camera metadata  

- Personal identifying metadata  

- PDF embedded scripts  

- Archive hidden files  



---



# 6. Validation Rules



Rules verified:



### 6.1 MIME Type Verification  

Cross-check:

- Browser MIME  

- Server-side MIME  

- Magic-number check  



### 6.2 File Extension Rules  

Extension must match MIME.



### 6.3 Size Limits  

- Image: 10MB  

- PDF: 20MB  

- ZIP: 50MB  

- Video: 100MB  



Too large:

error.code = "FILE_TOO_LARGE"



yaml

Copy code



### 6.4 Submission-Specific Rules  

Challenge categories may impose additional rules:

- Image dimensions  

- Required PDF metadata  

- ZIP folder structure  

- File count limits  



### 6.5 Virus Scan (future)  

All files may run through a scanning engine before approval.



---



# 7. Storage Logic



### Buckets:

- `public` → non-sensitive  

- `private` → submission/media files  



### File Path Format:

/<env>/<module>/<YYYY>/<MM>/<DD>/<cuid>.<ext>



makefile

Copy code



Examples:

/prod/submissions/2025/01/23/xyz123.png

/prod/challenges/2025/01/10/banner123.jpg



yaml

Copy code



---



# 8. Database Record Model



Fields stored:



- id  

- originalName  

- sanitizedName  

- mimeType  

- extension  

- bucket  

- size  

- path  

- uploaderId  

- module  

- metadata (JSONB)  

- createdAt  



---



# 9. File Linking Rules



### Submissions:

- File must be stored in private bucket  

- Linked via `submission.fileId`  



### Challenges:

- Public assets → banners  

- Private assets → internal docs  



### Profiles:

- Stored in public bucket  

- Automatically replaced on new upload  



### Admin:

- Stored per configuration  



---



# 10. Deletion Rules



Files may be:

- Soft deleted  

- Hard deleted (admin only)



Deletion requires:

- Audit log entry  

- Validation of admin permissions  



Soft delete recommended to preserve references.



---



# 11. Security Protections



### 11.1 Prevent Executable Uploads  

Reject:

- .exe, .sh, .bat, .bin  

- PDF with JS  

- Images containing scripts  



### 11.2 Malware Scanning (Future)  

All files scanned before use.



### 11.3 ZIP Validation  

Allowed:

- Images  

- PDFs  

Forbidden:

- Nested zips  

- Hidden system files  

- Binaries  



If invalid:

error.code = "ZIP_CONTENT_INVALID"



yaml

Copy code



---



# 12. Performance Requirements



- Stream uploads directly to storage (do not buffer)  

- Memory usage minimal  

- Scalable to millions of uploads  

- Fast MIME validation (<20ms)  

- DB record must be transactional  

- Return signed URLs instantly for UI  



---



# 13. Error Codes



| Code | Meaning |

|------|---------|

| FILE_TOO_LARGE | File exceeds allowed size |

| UNSUPPORTED_FILE_TYPE | File type not allowed |

| INVALID_ZIP_CONTENT | ZIP contains forbidden items |

| FILE_VALIDATION_FAILED | Multi-step validation failed |

| STORAGE_ERROR | Provider error |

| SIGNED_URL_ERROR | Cannot generate private URL |



---



# 14. Future Enhancements



- AI-powered file classification  

- Automatic image compression  

- PDF extraction tools  

- Multi-file submissions with rulesets  

- Advanced ZIP analysis  

- Parallel upload support  

- Video transcoding pipeline  



---



# 15. Conclusion



This document defines the complete backend File Processing & Validation Pipeline for OGC NewFinity.  

It ensures safety, consistency, reliability, and compliance with challenge rules and platform security requirements.

