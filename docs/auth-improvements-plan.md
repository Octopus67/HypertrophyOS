# Auth System Improvements — Implementation Plan

## Current State Analysis

### ✅ What Works
- Email/password registration and login (JWT tokens)
- Google OAuth backend endpoint (fully implemented)
- Password hashing (bcrypt)
- Token refresh mechanism
- Rate limiting on login (5 attempts / 15 min)
- Token blacklisting on logout

### ❌ Critical Gaps Identified

1. **No Email Verification** - Users can register with fake emails, immediately get access
2. **No Email Service** - Zero email sending capability (no SES, SMTP, SendGrid)
3. **Poor Password UX** - Backend enforces rules but frontend only checks length ≥8
4. **No Social Login UI** - Google OAuth works on backend but no buttons on frontend
5. **Apple OAuth Not Implemented** - Returns 501 (required by Apple if offering Google on iOS)
6. **No Phone Auth** - No SMS service, no phone number field
7. **Incomplete Password Reset** - Backend generates tokens but can't send them, frontend has no reset screen

---

## Recommended Solution (MVP)

### Phase 1: Email Verification (CRITICAL - 8 hours)
**Problem:** Anyone can register with fake emails  
**Solution:** 6-digit OTP code via email

**Implementation:**
1. Add email service (AWS SES - free tier, already on AWS)
2. Add email_verified field to User model
3. Generate 6-digit OTP on registration
4. Send verification email
5. Add verification endpoint (POST /auth/verify-email)
6. Block premium features until verified
7. Add resend verification option
8. Frontend: verification code input screen

**Cost:** FREE (AWS SES free tier: 62K emails/month from EC2)

---

### Phase 2: Password Validation UX (HIGH - 4 hours)
**Problem:** Users get unhelpful "validation failed" errors  
**Solution:** Real-time inline validation with strength meter

**Implementation:**
1. Install zxcvbn-ts (password strength estimation)
2. Add real-time validation in RegisterScreen:
   - ✅/❌ Minimum 8 characters (show count)
   - ✅/❌ Contains uppercase letter
   - ✅/❌ Contains lowercase letter
   - ✅/❌ Contains number
   - Strength meter (weak/good/strong)
3. Add show/hide password toggle
4. Optional: HaveIBeenPwned breach check on submit
5. Update error messages to be specific

**Cost:** FREE (zxcvbn is open source, HaveIBeenPwned API is free)

---

### Phase 3: Social Login UI (HIGH - 6 hours)
**Problem:** Google OAuth works but no UI, Apple OAuth not implemented  
**Solution:** Add Google and Apple sign-in buttons

**Implementation:**
1. Add Google Sign-In button to LoginScreen and RegisterScreen
2. Implement Google OAuth flow:
   - Option A: Use expo-auth-session (web-based, works in Expo Go)
   - Option B: Use @react-native-google-signin/google-signin (native, better UX)
3. Implement Apple Sign-In:
   - Use expo-apple-authentication
   - Backend: verify Apple identity token (PyJWT + Apple public keys)
4. Add "Continue with Google" and "Continue with Apple" buttons
5. Handle OAuth errors gracefully

**Cost:** FREE (OAuth providers don't charge)

**Note:** Apple Sign-In is REQUIRED by Apple App Store if you offer any other social login

---

### Phase 4: Complete Password Reset Flow (MEDIUM - 4 hours)
**Problem:** Backend generates tokens but can't send them, frontend has no reset screen  
**Solution:** Email-based password reset with OTP

**Implementation:**
1. Modify password reset to use 6-digit OTP (same as email verification)
2. Send OTP via email service
3. Frontend: Add ResetPasswordScreen (enter OTP + new password)
4. Add navigation from ForgotPasswordScreen to ResetPasswordScreen
5. Add resend OTP option

**Cost:** Included in email service (same AWS SES)

---

## NOT Recommended for MVP

### ❌ Phone Number Authentication
**Why skip:**
- SMS costs 10-80x more than email ($0.007-$0.058 per verification vs $0.0003 per email)
- Requires 10DLC registration (US), carrier compliance, phone number management
- Adds complexity (phone number field, country codes, formatting)
- Email OTP provides equivalent security
- Can add later as premium feature

**Recommendation:** Skip for MVP, add in Phase 2 post-launch if user demand exists

---

## Implementation Priority

### Must-Have Before Launch (18 hours)
1. **Email Verification** (8h) - Security and spam prevention
2. **Password Validation UX** (4h) - User experience
3. **Social Login UI** (6h) - User acquisition (reduces friction)

### Should-Have Before Launch (4 hours)
4. **Complete Password Reset** (4h) - User support

### Post-Launch
5. Phone number auth (if user demand)
6. Biometric unlock (Touch ID / Face ID)
7. Passkeys support

---

## Technical Architecture

### Email Service Integration (AWS SES)

**Backend:**
```python
# src/services/email_service.py
import boto3
from botocore.exceptions import ClientError

class EmailService:
    def __init__(self):
        self.ses = boto3.client('ses', region_name='us-east-1')
    
    async def send_verification_code(self, email: str, code: str):
        # Send 6-digit code
        pass
    
    async def send_password_reset_code(self, email: str, code: str):
        # Send reset code
        pass
```

**Environment Variables:**
- `AWS_ACCESS_KEY_ID` (or use IAM role)
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `SES_FROM_EMAIL` (verified sender)

**Setup Steps:**
1. Verify sender email in AWS SES console
2. Request production access (starts in sandbox mode)
3. Add boto3 to pyproject.toml
4. Configure credentials

---

### Email Verification Flow

**Registration Flow:**
```
1. User enters email + password
2. Backend creates User with email_verified=false
3. Generate 6-digit OTP, store hash in email_verification_codes table
4. Send OTP via SES
5. Return tokens (user is logged in but limited)
6. Frontend shows verification screen
7. User enters OTP
8. Backend verifies, sets email_verified=true
9. User gets full access
```

**Database Schema:**
```sql
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

CREATE TABLE email_verification_codes (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    code_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT DEFAULT 0,
    verified_at TIMESTAMPTZ
);
```

---

### Password Validation (Frontend)

**Real-time Feedback:**
```tsx
import { zxcvbn } from '@zxcvbn-ts/core';

const [password, setPassword] = useState('');
const [strength, setStrength] = useState<PasswordStrength | null>(null);

useEffect(() => {
  if (password.length >= 8) {
    const result = zxcvbn(password);
    setStrength({
      score: result.score, // 0-4
      feedback: result.feedback,
      checks: {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
      }
    });
  }
}, [password]);

// Show inline validation:
// ✅ At least 8 characters (12/8)
// ✅ Contains uppercase letter
// ✅ Contains lowercase letter
// ✅ Contains number
// Strength: [====------] Good
```

---

### Social Login (Google + Apple)

**Frontend Buttons:**
```tsx
<Button
  icon="google"
  label="Continue with Google"
  onPress={handleGoogleSignIn}
  variant="outline"
/>
<Button
  icon="apple"
  label="Continue with Apple"
  onPress={handleAppleSignIn}
  variant="outline"
/>
```

**Google OAuth Flow (expo-auth-session):**
```tsx
import * as Google from 'expo-auth-session/providers/google';

const [request, response, promptAsync] = Google.useAuthRequest({
  expoClientId: 'YOUR_EXPO_CLIENT_ID',
  iosClientId: 'YOUR_IOS_CLIENT_ID',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID',
});

// On response, send idToken to backend
await api.post('/auth/oauth/google', { token: response.params.id_token });
```

**Apple Sign-In (expo-apple-authentication):**
```tsx
import * as AppleAuthentication from 'expo-apple-authentication';

const credential = await AppleAuthentication.signInAsync({
  requestedScopes: [
    AppleAuthentication.AppleAuthenticationScope.EMAIL,
    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
  ],
});

// Send identityToken to backend
await api.post('/auth/oauth/apple', { token: credential.identityToken });
```

---

## Effort Summary

| Task | Effort | Priority |
|------|--------|----------|
| Email verification (OTP) | 8h | CRITICAL |
| AWS SES integration | 2h | CRITICAL |
| Password validation UX | 4h | HIGH |
| Google Sign-In UI + flow | 3h | HIGH |
| Apple Sign-In backend | 2h | HIGH |
| Apple Sign-In UI + flow | 3h | HIGH |
| Password reset completion | 4h | MEDIUM |
| **Total** | **26 hours** | |

---

## Recommended Approach

### Option A: Full Custom Implementation (26 hours)
- Complete control over auth flow
- Use AWS SES for email (free tier)
- Implement all features listed above
- Best for long-term flexibility

### Option B: Auth-as-a-Service (4-6 hours integration)
- Use Supabase Auth or Clerk
- Get email verification, OAuth, magic links out of the box
- Faster to market
- Trade-off: vendor lock-in, less control

### Option C: Hybrid (18 hours)
- Keep custom email/password + JWT
- Add email verification via AWS SES
- Add Google/Apple OAuth
- Skip phone auth for MVP
- **RECOMMENDED for Repwise**

---

## Decision Points

**Before implementing, decide:**

1. **Email service:** AWS SES (free, more setup) vs Resend ($20/mo, easier)?
2. **OAuth approach:** Expo AuthSession (web-based, works in Expo Go) vs native SDKs (better UX, requires dev build)?
3. **Phone auth:** Skip for MVP or include?
4. **Auth-as-a-Service:** Build custom or use Supabase/Clerk?

**My recommendation for Repwise MVP:**
- ✅ Email verification via AWS SES (free, you're on AWS)
- ✅ Password validation UX improvements (zxcvbn)
- ✅ Google + Apple OAuth via native SDKs (better UX)
- ❌ Skip phone auth (add later if needed)
- ✅ Custom implementation (you already have JWT infrastructure)

**Total effort: ~22 hours**

---

## Next Steps

1. **Review this plan** - Confirm approach and priorities
2. **Set up AWS SES** - Verify sender email, request production access
3. **Get OAuth credentials** - Google Cloud Console + Apple Developer
4. **Implement in order** - Email verification → Password UX → Social login → Password reset
5. **Test thoroughly** - Email delivery, OAuth flows, edge cases
6. **Deploy gradually** - Test with small user group first

**Ready to proceed with implementation after your approval.**
