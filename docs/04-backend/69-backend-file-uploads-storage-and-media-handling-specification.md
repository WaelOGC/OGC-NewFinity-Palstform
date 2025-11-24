# OGC NewFinity — Backend File Uploads, Storage & Media Handling Specification (v1.0)



## 1. Introduction

This document defines all backend requirements, standards, workflows, and security rules for **file uploads, storage handling, and media delivery** across the OGC NewFinity ecosystem.



The system supports:

- User-submitted files  

- Challenge attachments  

- Submission media (images, PDFs, videos)  

- Admin uploads  

- AI-generated content (future)  

- Secure downloads  

- Public/private bucket separation  



Storage reliability and security are mission-critical.



---



# 2. Storage Architecture



### Storage Provider:

- **S3-compatible object storage** (AWS S3, Backblaze B2, DigitalOcean Spaces, etc.)



### Buckets:

1. **Public bucket**

   - Non-sensitive assets  

   - Public URLs allowed  

   - Example: challenge banners  



2. **Private bucket**

   - Submissions  

   - User documents  

   - Sensitive admin files  

   - Requires signed URLs  



### File Access:

- Direct file access is **never** allowed for private files  

- Signed URL required for downloads  

- Signed URL expiration: **5 minutes**



---



# 3. Upload API Specification



### Upload Endpoint:

POST /api/v1/files/upload



markdown

Copy code



### Form Data:

- `file`: uploaded file  

- `type`: (submission | profile | banner | document | admin)



### Response:

{

"success": true,

"data": {

"fileId": "cuid",

"fileUrl": "https://bucket/path/file.png",

"bucket": "private" | "public",

"mimeType": "image/png",

"size": 394022

}

}



yaml

Copy code



---



# 4. Accepted File Types



### Images:

- jpg, jpeg, png, webp



### Documents:

- pdf



### Videos:

- mp4 (limited support)



### Archives:

- zip (for code submissions or multi-file uploads)



### Forbidden:

- exe  

- js  

- sh  

- bat  

- any executable content  



If file type is not allowed:

error.code = "UNSUPPORTED_FILE_TYPE"



yaml

Copy code



---



# 5. File Size Limits



Standard limits:

- Images → 10 MB  

- Videos → 100 MB  

- PDFs → 20 MB  

- ZIP files → 50 MB  



Admin override allowed only for:

- Challenge setup  

- System-level uploads  



---



# 6. Virus & Malware Scanning (Future)



When enabled:

- All uploaded files pass a scanning job  

- Suspicious files flagged  

- Quarantine storage bucket introduced  



Response example:

"error": { "code": "FILE_REJECTED_MALWARE" }



yaml

Copy code



---



# 7. Storage Path Standards



### Storage path format:

/<environment>/<module>/<YYYY>/<MM>/<DD>/<cuid>.<ext>



makefile

Copy code



Examples:

/prod/submissions/2025/01/15/ckx8s91fj12.png

/stage/profile/2025/02/01/cj12k38dabc.pdf



markdown

Copy code



### Modules:

- profile  

- challenges  

- submissions  

- admin  

- system  



---



# 8. Database File Model



Each file must be recorded in the database.



### Required Fields:

- `id` (cuid)  

- `originalName`  

- `mimeType`  

- `bucket`  

- `size`  

- `path`  

- `uploaderId`  

- `module`  

- `createdAt`  



Optional:

- `metadata` (JSONB)  



---



# 9. Signed URL Generation



### Endpoint:

GET /api/v1/files/signed-url/:fileId



markdown

Copy code



Rules:

- Only the owner, challenge admins, or system admins may request  

- Signed URL expires after **5 minutes**  

- Must validate user permissions  



Response:

{

"success": true,

"data": {

"signedUrl": "...",

"expiresIn": 300

}

}



yaml

Copy code



---



# 10. Deleting Files



Deletion only allowed for:

- Admins  

- User replacing their own profile image  

- Submission replaced before challenge deadline  



### Soft-delete recommended:

- Set `deletedAt`  

- Keep file record  

- Move file to `/trash` bucket (future)



---



# 11. File Validation



Every file must be validated for:

- MIME type  

- File extension  

- File size  

- Scan result (future)  

- Safe filename conversion  

- Upload target bucket rules  



Unsafe filenames must be sanitized.



---



# 12. Handling Submission Files



Submission files must:

- Always be stored in **private** buckets  

- Never be accessible via public URLs  

- Always require signed URL for viewing  

- Appear in admin review UI via signed link  



---



# 13. Performance Optimization



- Stream uploads directly to storage  

- Do not buffer large files in memory  

- Use chunked upload for large (>100MB) videos (future)  

- Cache metadata in Redis (future)  



---



# 14. Error Codes



| Code | Meaning |

|------|---------|

| UNSUPPORTED_FILE_TYPE | Not allowed file type |

| FILE_TOO_LARGE | Exceeds size limit |

| STORAGE_ERROR | Provider error |

| SIGNED_URL_FAILED | Error generating URL |

| FILE_NOT_FOUND | File record missing |

| PERMISSION_DENIED | Not allowed to view file |



---



# 15. Logging Requirements



Log:

- File uploads  

- Signed URL generation  

- File deletions  

- Storage provider errors  



Logs must include:

- User ID  

- IP  

- File type  

- Module  

- Result  



---



# 16. Future Enhancements



- Chunked uploads  

- File versioning  

- Image optimization pipeline  

- Automatic compression  

- Metadata extraction (EXIF, PDF data)  

- AI-powered content validation  

- Encrypted storage for sensitive files  



---



# 17. Conclusion



This specification defines the backend rules for file uploads, media storage, and secure file delivery in OGC NewFinity.  

It ensures consistent handling, protection, and stability across the entire ecosystem.

