# Security Notes — Skill Gap Intelligence Platform

## Implemented Controls
- JWT authentication with 7-day expiry
- bcrypt password hashing (cost factor 10)
- Role-based access control (Student, Mentor, PlacementOfficer, Admin)
- Helmet.js security headers
- CORS restricted to allowed origins
- Rate limiting on auth routes (10 req / 15 min)
- Rate limiting on resume parser (4 req / hour)
- Rate limiting on gap analysis (10 req / hour)
- Rate limiting on evidence submission (10 req / hour)
- Immutable audit trail for all state-changing actions
- PII redaction before sending data to Groq API
- Prompt injection sanitization on user-supplied text
- File upload validation (MIME type + size limits)
- Cloudinary secure storage for user uploads
- isActive check on every authenticated request
- Password minimum: 8 characters, at least one letter and one number
- Ownership enforcement on all user-scoped resources

## Known Limitations

### No Email Verification
User registration does not require email confirmation. A malicious actor could register with someone else's email address. Mitigation: planned for v2 using nodemailer + OTP flow.

### No Signed URLs
Cloudinary assets use public URLs. Files uploaded by students are accessible to anyone with the URL. Mitigation: Cloudinary signed URLs with expiry are planned for v2.

### No Malware Scanning
Uploaded PDFs are processed without antivirus scanning. Mitigation: ClamAV integration is planned for v2.

### No Password Recovery
There is no forgot password flow. Users who lose access must contact an Admin to reset credentials manually. Mitigation: planned for v2 using email OTP.

### No Session Revocation Cache
The isActive check hits MongoDB on every request. A suspended user's token remains technically valid until the DB check. At scale, Redis session cache with immediate revocation is required.

### Groq API Data Handling
Resume text and job descriptions are sent to Groq (a third-party LLM provider) for skill extraction. PII is redacted before transmission but residual context may remain. Users should be informed before uploading sensitive documents.

### No Multi-Tenancy Isolation
All data is in a single MongoDB database with no campus or organization boundary. Adding a second institution would require a tenant isolation layer.
