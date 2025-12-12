# OGC NewFinity Platform - Authentication Lifecycle Diagram

This document contains a complete Mermaid flowchart diagram representing all authentication flows, user interactions, and system processes for the OGC NewFinity Platform.

```mermaid
flowchart TB
    Start([User Starts]) --> AuthChoice{Choose Auth Action}
    
    %% ============================================================================
    %% REGISTRATION FLOW
    %% ============================================================================
    subgraph Registration["1. Registration Flow"]
        RegStart([User Opens Registration Page]) --> RegEnter[User Enters Details:<br/>email, password, fullName, termsAccepted]
        RegEnter --> RegPost[POST /auth/register]
        RegPost --> RegValidate{Validate Input}
        RegValidate -->|Invalid| RegError[Return Error:<br/>EMAIL_ALREADY_EXISTS<br/>TERMS_NOT_ACCEPTED<br/>VALIDATION_ERROR]
        RegValidate -->|Valid| RegCheckEmail{Email Exists?}
        RegCheckEmail -->|Yes| RegError
        RegCheckEmail -->|No| RegCreateUser[System Creates User:<br/>status = pending_verification<br/>role = FOUNDER or STANDARD_USER]
        RegCreateUser --> RegGenToken[Generate ActivationToken]
        RegGenToken --> RegSendEmail[Send Activation Email]
        RegSendEmail --> RegSuccess[Return Success:<br/>requiresActivation: true]
        RegSuccess --> RegEnd([User Must Activate Account])
    end
    
    %% ============================================================================
    %% ACTIVATION FLOW
    %% ============================================================================
    subgraph Activation["2. Activation Flow (Email Verification)"]
        ActStart([User Receives Activation Email]) --> ActClick[User Clicks Activation URL]
        ActClick --> ActValidate[Backend Validates Token:<br/>GET/POST /auth/activate]
        ActValidate --> ActCheckToken{Token Valid?}
        
        ActCheckToken -->|No Token| ActError1[Return Error:<br/>ACTIVATION_TOKEN_MISSING]
        ActCheckToken -->|Invalid/Expired| ActError2[Return Error:<br/>ACTIVATION_TOKEN_INVALID_OR_EXPIRED]
        ActCheckToken -->|Valid| ActCheckUser{User Status?}
        
        ActCheckUser -->|Already ACTIVE| ActAlreadyActive[Return Success:<br/>Account already activated<br/>Idempotent response]
        ActCheckUser -->|pending_verification| ActMarkToken[Mark Token as Used]
        ActMarkToken --> ActUpdateStatus[Update User Status:<br/>status = active]
        ActUpdateStatus --> ActSuccess[Return Success:<br/>Account activated]
        
        ActResend([User Requests Resend]) --> ActResendPost[POST /auth/resend-activation]
        ActResendPost --> ActResendCheck{User Exists?}
        ActResendCheck -->|No| ActResendGeneric[Return Generic Success:<br/>Security: no enumeration]
        ActResendCheck -->|Yes| ActResendInvalidate[Invalidate Old Tokens]
        ActResendInvalidate --> ActResendNew[Generate New Token]
        ActResendNew --> ActResendEmail[Send Activation Email]
        ActResendEmail --> ActResendSuccess[Return Success]
    end
    
    %% ============================================================================
    %% LOGIN FLOW - EMAIL + PASSWORD
    %% ============================================================================
    subgraph LoginEmail["3A. Login Flow - Email + Password"]
        LoginStart([User Opens Login Page]) --> LoginEnter[User Enters:<br/>email, password]
        LoginEnter --> LoginPost[POST /auth/login]
        LoginPost --> LoginValidate{Validate Credentials}
        LoginValidate -->|Invalid| LoginError1[Return Error:<br/>INVALID_CREDENTIALS<br/>Generic message]
        LoginValidate -->|Valid| LoginCheckStatus{Check Account Status}
        
        LoginCheckStatus -->|DELETED| LoginError2[Return Error:<br/>ACCOUNT_DELETED]
        LoginCheckStatus -->|disabled| LoginError3[Return Error:<br/>ACCOUNT_DISABLED]
        LoginCheckStatus -->|pending_verification| LoginError4[Return Error:<br/>ACCOUNT_NOT_VERIFIED<br/>Show resend option]
        LoginCheckStatus -->|active| LoginCheck2FA{2FA Enabled?}
        
        LoginCheck2FA -->|No| LoginCreateSession[Create Auth Session:<br/>- Generate sessionToken<br/>- Set JWT cookies<br/>- Set ogc_session cookie]
        LoginCreateSession --> LoginRecordActivity[Record Login Activity]
        LoginRecordActivity --> LoginSuccess[Return Success:<br/>Redirect to Dashboard]
        
        LoginCheck2FA -->|Yes| LoginGenTicket[Generate 2FA Ticket:<br/>Short-lived JWT<br/>10 min TTL]
        LoginGenTicket --> LoginReturn2FA[Return 2FA_REQUIRED:<br/>ticket, methods: totp/recovery]
        LoginReturn2FA --> Login2FAInput([User Enters 2FA Code])
        Login2FAInput --> Login2FAPost[POST /auth/login/2fa<br/>ticket, mode, code]
        Login2FAPost --> Login2FAValidate{Validate Ticket}
        Login2FAValidate -->|Invalid/Expired| Login2FAError1[Return Error:<br/>INVALID_2FA_TICKET]
        Login2FAValidate -->|Valid| Login2FACheckMode{Mode?}
        
        Login2FACheckMode -->|totp| Login2FAVerifyTOTP[Verify TOTP Code]
        Login2FAVerifyTOTP -->|Invalid| Login2FAError2[Return Error:<br/>INVALID_TOTP_CODE]
        Login2FAVerifyTOTP -->|Valid| Login2FACreateSession[Create Auth Session]
        
        Login2FACheckMode -->|recovery| Login2FAVerifyRecovery[Verify & Consume Recovery Code]
        Login2FAVerifyRecovery -->|Invalid/Used| Login2FAError3[Return Error:<br/>INVALID_RECOVERY_CODE]
        Login2FAVerifyRecovery -->|Valid| Login2FALogRecovery[Log Recovery Code Used]
        Login2FALogRecovery --> Login2FACreateSession
        
        Login2FACreateSession --> Login2FARecord[Record LOGIN_2FA_SUCCEEDED]
        Login2FARecord --> Login2FASuccess[Return Success:<br/>Redirect to Dashboard]
    end
    
    %% ============================================================================
    %% LOGIN FLOW - OAUTH
    %% ============================================================================
    subgraph LoginOAuth["3B. Login Flow - OAuth Providers"]
        OAuthStart([User Clicks OAuth Provider Button:<br/>Google, GitHub, Discord, etc.]) --> OAuthRedirect[Redirect to Provider:<br/>GET /auth/:provider]
        OAuthRedirect --> OAuthProvider[OAuth Provider Page]
        OAuthProvider --> OAuthUserAuth{User Authorizes?}
        OAuthUserAuth -->|No| OAuthCancel[Redirect to Frontend:<br/>status=error]
        OAuthUserAuth -->|Yes| OAuthCallback[Provider Redirects to:<br/>/auth/:provider/callback]
        OAuthCallback --> OAuthSync[Backend syncOAuthProfile:<br/>Extract profile data]
        OAuthSync --> OAuthCheckFlow{Flow Type?}
        
        OAuthCheckFlow -->|Connect Flow<br/>state param| OAuthLink[Link Provider to Existing User]
        OAuthLink --> OAuthLinkCheck{Link Success?}
        OAuthLinkCheck -->|Conflict| OAuthError1[Return Error:<br/>OAUTH_EMAIL_CONFLICT<br/>OAUTH_ACCOUNT_ALREADY_LINKED]
        OAuthLinkCheck -->|Success| OAuthLinkSuccess[Return Success:<br/>Provider linked]
        
        OAuthCheckFlow -->|Login Flow| OAuthCheckEmail{Email Provided?}
        OAuthCheckEmail -->|No| OAuthError2[Return Error:<br/>OAUTH_EMAIL_REQUIRED]
        OAuthCheckEmail -->|Yes| OAuthFindUser{User Exists?}
        
        OAuthFindUser -->|No| OAuthCreateUser[Create New User:<br/>status = active<br/>emailVerified from provider]
        OAuthCreateUser --> OAuthCreateSession[Create Auth Session]
        
        OAuthFindUser -->|Yes| OAuthCheckStatus{Account Status?}
        OAuthCheckStatus -->|DELETED| OAuthError3[Return Error:<br/>ACCOUNT_DELETED]
        OAuthCheckStatus -->|disabled| OAuthError4[Return Error:<br/>ACCOUNT_DISABLED]
        OAuthCheckStatus -->|pending_verification| OAuthError5[Return Error:<br/>ACCOUNT_NOT_VERIFIED]
        OAuthCheckStatus -->|active| OAuthCreateSession
        
        OAuthCreateSession --> OAuthRecordActivity[Record Login Activity]
        OAuthRecordActivity --> OAuthSuccess[Redirect to Dashboard]
    end
    
    %% ============================================================================
    %% FORGOT PASSWORD FLOW
    %% ============================================================================
    subgraph ForgotPassword["4. Forgot Password → Reset Password"]
        ForgotStart([User Opens Forgot Password Page]) --> ForgotEnter[User Enters Email]
        ForgotEnter --> ForgotPost[POST /auth/forgot-password]
        ForgotPost --> ForgotCheck{User Exists?}
        ForgotCheck -->|No| ForgotGeneric[Return Generic Success:<br/>Security: no enumeration]
        ForgotCheck -->|Yes| ForgotCheckPassword{Has Password?}
        ForgotCheckPassword -->|OAuth-only| ForgotGeneric
        ForgotCheckPassword -->|Has Password| ForgotGenToken[Generate PasswordResetToken]
        ForgotGenToken --> ForgotSendEmail[Send Reset Email with Link]
        ForgotSendEmail --> ForgotGeneric
        
        ForgotClick([User Clicks Reset Link]) --> ForgotValidate[POST /auth/password/reset/validate]
        ForgotValidate --> ForgotCheckToken{Token Valid?}
        ForgotCheckToken -->|Invalid/Expired| ForgotError1[Return Error:<br/>INVALID_RESET_TOKEN]
        ForgotCheckToken -->|Valid| ForgotShowForm([Show Reset Password Form])
        
        ForgotShowForm --> ForgotEnterNew[User Enters New Password]
        ForgotEnterNew --> ForgotResetPost[POST /auth/password/reset/complete]
        ForgotResetPost --> ForgotValidatePassword{Password Valid?}
        ForgotValidatePassword -->|Weak| ForgotError2[Return Error:<br/>WEAK_PASSWORD]
        ForgotValidatePassword -->|Valid| ForgotHashPassword[Hash New Password]
        ForgotHashPassword --> ForgotUpdatePassword[Update User Password]
        ForgotUpdatePassword --> ForgotMarkToken[Mark Token as Used]
        ForgotMarkToken --> ForgotRevokeSessions[Revoke All User Sessions]
        ForgotRevokeSessions --> ForgotSendAlert[Send Password Changed Alert Email]
        ForgotSendAlert --> ForgotSuccess[Return Success:<br/>User Can Login with New Password]
    end
    
    %% ============================================================================
    %% 2FA SETUP FLOW
    %% ============================================================================
    subgraph TwoFactorSetup["6. 2FA Setup + Verification"]
        TFASetupStart([User Opens Security Settings]) --> TFACheckStatus{2FA Enabled?}
        TFACheckStatus -->|Yes| TFAShowStatus[Show 2FA Status:<br/>enabled, enabledAt]
        TFACheckStatus -->|No| TFASetupInit[POST /api/v1/2fa/setup/start]
        
        TFASetupInit --> TFAGenSecret[Generate TOTP Secret]
        TFAGenSecret --> TFACreateQR[Create otpauth URL & QR Code]
        TFACreateQR --> TFAShowQR([Show QR Code to User])
        TFAShowQR --> TFAEnterCode([User Scans QR & Enters Code])
        TFAEnterCode --> TFAConfirm[POST /api/v1/2fa/setup/confirm<br/>code]
        TFAConfirm --> TFAVerifyCode{Code Valid?}
        TFAVerifyCode -->|Invalid| TFAError1[Return Error:<br/>TWO_FACTOR_CODE_INVALID]
        TFAVerifyCode -->|Valid| TFAEnable[Enable 2FA:<br/>isEnabled = 1]
        TFAEnable --> TFAGenRecovery[Generate Recovery Codes:<br/>10 codes, hashed]
        TFAGenRecovery --> TFAShowRecovery([Show Recovery Codes to User])
        TFAShowRecovery --> TFASuccess[2FA Enabled Successfully]
        
        TFARegenerate([User Regenerates Recovery Codes]) --> TFARegeneratePost[POST /api/v1/2fa/recovery/regenerate]
        TFARegeneratePost --> TFAInvalidateOld[Invalidate Old Codes]
        TFAInvalidateOld --> TFAGenNew[Generate New Codes]
        TFAGenNew --> TFAShowRecovery
        
        TFADisable([User Disables 2FA]) --> TFADisablePost[POST /api/v1/2fa/disable]
        TFADisablePost --> TFADisableCheck{2FA Enabled?}
        TFADisableCheck -->|No| TFADisableError[Return Error:<br/>TWO_FACTOR_NOT_ENABLED]
        TFADisableCheck -->|Yes| TFADisableAction[Disable 2FA:<br/>isEnabled = 0]
        TFADisableAction --> TFADisableSuccess[2FA Disabled Successfully]
    end
    
    %% ============================================================================
    %% SESSION LIFECYCLE
    %% ============================================================================
    subgraph SessionLifecycle["7. Session Lifecycle"]
        SessionCreate([Session Created on Login]) --> SessionStore[Store in AuthSession Table:<br/>sessionToken, userId,<br/>ipAddress, userAgent,<br/>expiresAt = 30 days]
        SessionStore --> SessionSetCookies[Set Cookies:<br/>ogc_access JWT<br/>ogc_refresh JWT<br/>ogc_session token]
        SessionSetCookies --> SessionActive([Session Active])
        
        SessionActive --> SessionRequest[User Makes Authenticated Request]
        SessionRequest --> SessionValidate[Middleware Validates:<br/>- JWT token<br/>- Session token<br/>- Session not revoked<br/>- Session not expired]
        SessionValidate -->|Invalid| SessionError[Return 401:<br/>Clear cookies]
        SessionValidate -->|Valid| SessionTouch[Update lastSeenAt]
        SessionTouch --> SessionProcess[Process Request]
        
        SessionLogout([User Logs Out]) --> SessionRevoke[Revoke Current Session:<br/>Set revokedAt]
        SessionRevoke --> SessionClearCookies[Clear All Cookies]
        SessionClearCookies --> SessionLogoutSuccess([Logout Complete])
        
        SessionPasswordReset([Password Reset]) --> SessionRevokeAll[Revoke All Sessions:<br/>Force re-login everywhere]
        SessionRevokeAll --> SessionPasswordResetSuccess([All Sessions Revoked])
        
        SessionExpire([Session Expires]) --> SessionAutoRevoke[Auto-revoke on Next Request:<br/>expiresAt < NOW]
        SessionAutoRevoke --> SessionExpireError[Return 401:<br/>SESSION_INVALID]
    end
    
    %% ============================================================================
    %% ACCOUNT STATUS CHECKS
    %% ============================================================================
    subgraph AccountStatus["5. Account Status Checks"]
        StatusCheck([Check User Status]) --> StatusDecision{Status Value?}
        
        StatusDecision -->|pending_verification| StatusPending[User Must Activate:<br/>Block login<br/>Show resend activation]
        StatusDecision -->|active| StatusActive[User Can Login:<br/>Proceed with auth]
        StatusDecision -->|disabled| StatusDisabled[Account Disabled:<br/>Block all auth<br/>Return ACCOUNT_DISABLED]
        StatusDecision -->|DELETED| StatusDeleted[Account Deleted:<br/>Block all auth<br/>Return ACCOUNT_DELETED]
        StatusDecision -->|banned| StatusBanned[Account Banned:<br/>Block all auth<br/>Return ACCOUNT_BANNED]
        StatusDecision -->|must_reset_password| StatusMustReset[Force Password Reset:<br/>Block login until reset]
    end
    
    %% ============================================================================
    %% ERROR STATES
    %% ============================================================================
    subgraph ErrorStates["8. Error States"]
        ErrorInvalidCreds[Invalid Credentials:<br/>INVALID_CREDENTIALS<br/>Generic message]
        ErrorInvalidTOTP[Invalid TOTP Code:<br/>INVALID_TOTP_CODE<br/>TWO_FACTOR_CODE_INVALID]
        ErrorInvalidActivation[Invalid Activation Token:<br/>ACTIVATION_TOKEN_INVALID_OR_EXPIRED<br/>ACTIVATION_TOKEN_MISSING]
        ErrorExpiredReset[Expired Reset Token:<br/>RESET_TOKEN_INVALID_OR_EXPIRED]
        ErrorOAuthEmailConflict[OAuth Email Conflict:<br/>OAUTH_EMAIL_CONFLICT<br/>OAUTH_ACCOUNT_ALREADY_LINKED]
        ErrorOAuthMissingEmail[OAuth Missing Email:<br/>OAUTH_EMAIL_REQUIRED]
        ErrorServer[Server Error:<br/>DATABASE_ERROR<br/>500 Internal Server Error]
        ErrorRateLimit[Rate Limit Exceeded:<br/>RATE_LIMIT_EXCEEDED]
    end
    
    %% ============================================================================
    %% MAIN FLOW CONNECTIONS
    %% ============================================================================
    AuthChoice -->|Register| RegStart
    AuthChoice -->|Activate| ActStart
    AuthChoice -->|Login Email| LoginStart
    AuthChoice -->|Login OAuth| OAuthStart
    AuthChoice -->|Forgot Password| ForgotStart
    AuthChoice -->|2FA Setup| TFASetupStart
    AuthChoice -->|Session Management| SessionCreate
    
    RegEnd --> ActStart
    ActSuccess --> LoginStart
    LoginSuccess --> SessionActive
    Login2FASuccess --> SessionActive
    OAuthSuccess --> SessionActive
    ForgotSuccess --> LoginStart
    
    %% Styling
    classDef successNode fill:#d4edda,stroke:#28a745,stroke-width:2px
    classDef errorNode fill:#f8d7da,stroke:#dc3545,stroke-width:2px
    classDef processNode fill:#d1ecf1,stroke:#0c5460,stroke-width:2px
    classDef decisionNode fill:#fff3cd,stroke:#856404,stroke-width:2px
    
    class RegSuccess,ActSuccess,LoginSuccess,Login2FASuccess,OAuthSuccess,ForgotSuccess,TFASuccess,SessionLogoutSuccess,SessionPasswordResetSuccess,StatusActive successNode
    class RegError,ActError1,ActError2,LoginError1,LoginError2,LoginError3,LoginError4,Login2FAError1,Login2FAError2,Login2FAError3,OAuthError1,OAuthError2,OAuthError3,OAuthError4,OAuthError5,ForgotError1,ForgotError2,TFAError1,TFADisableError,SessionError,SessionExpireError,StatusDisabled,StatusDeleted,StatusBanned,StatusMustReset errorNode
    class RegCreateUser,RegGenToken,RegSendEmail,ActMarkToken,ActUpdateStatus,LoginCreateSession,LoginGenTicket,OAuthSync,OAuthCreateUser,OAuthCreateSession,ForgotGenToken,ForgotHashPassword,ForgotUpdatePassword,TFAGenSecret,TFACreateQR,TFAEnable,TFAGenRecovery,SessionStore,SessionTouch,SessionRevoke processNode
    class RegValidate,RegCheckEmail,ActCheckToken,ActCheckUser,LoginValidate,LoginCheckStatus,LoginCheck2FA,Login2FAValidate,Login2FACheckMode,OAuthUserAuth,OAuthCheckFlow,OAuthCheckEmail,OAuthFindUser,OAuthCheckStatus,ForgotCheck,ForgotCheckPassword,ForgotCheckToken,ForgotValidatePassword,TFACheckStatus,TFAVerifyCode,TFADisableCheck,SessionValidate,StatusDecision decisionNode
```

## Diagram Legend

- **Green nodes**: Success states
- **Red nodes**: Error states
- **Blue nodes**: Process/action nodes
- **Yellow nodes**: Decision points

## Key Features Documented

1. **Registration**: Complete flow from form submission to activation email
2. **Activation**: Happy path, error handling, and resend functionality
3. **Login (Email+Password)**: Standard login with 2FA enforcement
4. **Login (OAuth)**: Multi-provider OAuth with login and connect flows
5. **Password Reset**: Secure token-based reset with session revocation
6. **2FA Setup**: TOTP setup, recovery codes, and disable flow
7. **Session Management**: Creation, validation, refresh, and revocation
8. **Account Status**: All status checks and their effects
9. **Error Handling**: Comprehensive error states throughout flows

## Usage

This diagram can be rendered in any Mermaid-compatible viewer:
- GitHub/GitLab markdown files
- Mermaid Live Editor (https://mermaid.live)
- Documentation sites with Mermaid support
- VS Code with Mermaid extension
