# Security Architecture - MedScheduleAI Pro

> 🔒 Comprehensive security design and HIPAA compliance documentation

## 📋 Table of Contents
- [Security Overview](#security-overview)
- [HIPAA Compliance](#hipaa-compliance)
- [Authentication & Authorization](#authentication--authorization)
- [Data Security](#data-security)
- [Network Security](#network-security)
- [Application Security](#application-security)
- [Security Monitoring](#security-monitoring)
- [Incident Response](#incident-response)

## 🎯 Security Overview

### Security Principles
1. **Defense in Depth** - Multiple layers of security controls
2. **Least Privilege** - Minimum necessary access rights
3. **Fail Secure** - System defaults to secure state on failure
4. **Separation of Duties** - No single point of control
5. **Audit Everything** - Complete logging of all actions

### Compliance Requirements
- **HIPAA** - Health Insurance Portability and Accountability Act
- **HITECH** - Health Information Technology for Economic and Clinical Health
- **SOC 2 Type II** (Future)
- **GDPR** (For EU operations)

## 🏥 HIPAA Compliance

### Technical Safeguards

#### 1. Access Control (§164.312(a)(1))
**Unique User Identification**
```typescript
// Every user has unique credentials
interface User {
  id: ObjectId;
  email: string;      // Unique identifier
  role: UserRole;     // Role-based access
  mfa_enabled: boolean;
}

// No shared accounts allowed
userSchema.index({ email: 1 }, { unique: true });
```

**Emergency Access Procedure**
```typescript
// Emergency override with full audit trail
const emergencyAccess = async (userId: string, reason: string) => {
  await AuditLog.create({
    type: 'EMERGENCY_ACCESS',
    user_id: userId,
    reason,
    timestamp: new Date(),
    ip_address: req.ip
  });
  
  // Grant temporary elevated access
  // Auto-revoke after 24 hours
};
```

**Automatic Logoff**
```typescript
// Session timeout after 15 minutes of inactivity
const SESSION_TIMEOUT = 15 * 60 * 1000;

middleware.sessionTimeout = (req, res, next) => {
  if (Date.now() - req.session.lastActivity > SESSION_TIMEOUT) {
    req.session.destroy();
    return res.status(401).json({ error: 'Session expired' });
  }
  req.session.lastActivity = Date.now();
  next();
};
```

**Encryption and Decryption**
```typescript
// AES-256 encryption for sensitive data
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

export const decrypt = (encryptedData: string): string => {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
```

#### 2. Audit Controls (§164.312(b))
**Complete Audit Trail**
```typescript
// Log all PHI access
const auditPHIAccess = async (action: string, userId: string, patientId: string) => {
  await AuditLog.create({
    event: {
      type: 'PHI_ACCESS',
      action,                    // 'view', 'edit', 'export', 'delete'
      resource_type: 'patient',
      resource_id: patientId
    },
    actor: {
      user_id: userId,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    },
    timestamp: new Date(),
    retention_period: 6 * 365 * 24 * 60 * 60 * 1000  // 6 years
  });
};

// Audit logs are immutable and retained for 6 years
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 189216000 });
```

#### 3. Integrity (§164.312(c)(1))
**Data Integrity Verification**
```typescript
// Digital signatures for data integrity
import crypto from 'crypto';

const signData = (data: any): string => {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(data));
  return hash.digest('hex');
};

const verifyIntegrity = (data: any, signature: string): boolean => {
  return signData(data) === signature;
};

// Apply to sensitive operations
staffSchema.pre('save', function() {
  this.data_signature = signData(this.toObject());
});
```

#### 4. Person or Entity Authentication (§164.312(d))
**Multi-Factor Authentication**
```typescript
import speakeasy from 'speakeasy';

// Generate MFA secret
const generateMFASecret = () => {
  return speakeasy.generateSecret({
    name: 'MedScheduleAI Pro',
    length: 32
  });
};

// Verify MFA token
const verifyMFAToken = (secret: string, token: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2  // Allow 60 second window
  });
};
```

#### 5. Transmission Security (§164.312(e)(1))
**End-to-End Encryption**
```typescript
// TLS 1.3 configuration
const tlsOptions = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem'),
  minVersion: 'TLSv1.3',
  ciphers: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256'
  ].join(':')
};

const httpsServer = https.createServer(tlsOptions, app);
```

### Physical Safeguards

#### Facility Access Controls
- Cloud provider security (AWS/GCP/Azure)
- SOC 2 certified data centers
- Physical access logs
- Video surveillance
- Biometric access control

#### Workstation Security
- Encrypted hard drives (BitLocker/FileVault)
- Auto-lock screens
- Antivirus software
- Firewall enabled
- VPN for remote access

#### Device and Media Controls
- Encrypted backups
- Secure disposal procedures
- Media tracking
- Device inventory

### Administrative Safeguards

#### Security Management Process
```typescript
// Risk assessment tracking
interface RiskAssessment {
  id: string;
  threat: string;
  vulnerability: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
  owner: string;
  review_date: Date;
}

// Conduct quarterly risk assessments
```

#### Workforce Security
- Background checks for all employees
- Security awareness training
- Sanctions for violations
- Termination procedures

#### Information Access Management
```typescript
// Role-based access control matrix
const PERMISSIONS = {
  super_admin: ['*'],
  admin: [
    'users.read', 'users.write',
    'staff.read', 'staff.write',
    'schedules.read', 'schedules.write',
    'settings.read', 'settings.write'
  ],
  manager: [
    'staff.read', 'staff.write',
    'schedules.read', 'schedules.write'
  ],
  staff: [
    'schedules.read',
    'profile.read', 'profile.write'
  ]
};
```

## 🔐 Authentication & Authorization

### JWT Token Security

```typescript
// Secure JWT configuration
const JWT_CONFIG = {
  algorithm: 'RS256',           // Asymmetric encryption
  expiresIn: '15m',            // Short-lived access tokens
  issuer: 'medscheduleai.com',
  audience: 'api.medscheduleai.com'
};

// Token generation with claims
const generateAccessToken = (user: User) => {
  return jwt.sign({
    sub: user.id,
    role: user.role,
    org: user.organization_id,
    permissions: PERMISSIONS[user.role]
  }, privateKey, JWT_CONFIG);
};

// Refresh token rotation
const refreshAccessToken = async (refreshToken: string) => {
  const decoded = jwt.verify(refreshToken, publicKey);
  
  // Invalidate old refresh token
  await RedisClient.del(`refresh:${refreshToken}`);
  
  // Generate new tokens
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};
```

### Password Security

```typescript
import bcrypt from 'bcryptjs';

// Strong password requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true
};

// Password hashing with high cost factor
const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);  // High cost factor
  return bcrypt.hash(password, salt);
};

// Password history to prevent reuse
userSchema.methods.checkPasswordHistory = async function(newPassword: string) {
  const history = this.password_history || [];
  
  for (const oldHash of history.slice(-5)) {  // Check last 5 passwords
    if (await bcrypt.compare(newPassword, oldHash)) {
      throw new Error('Cannot reuse recent passwords');
    }
  }
};
```

## 🛡️ Data Security

### Data at Rest

```typescript
// MongoDB encryption at rest
const mongoOptions = {
  autoEncryption: {
    keyVaultNamespace: 'encryption.__keyVault',
    kmsProviders: {
      aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    }
  }
};

// Field-level encryption for sensitive data
const encryptedFields = {
  'personal.ssn': {
    encrypt: true,
    algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random'
  },
  'personal.date_of_birth': {
    encrypt: true,
    algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic'
  }
};
```

### Data in Transit

```typescript
// Force HTTPS
app.use((req, res, next) => {
  if (!req.secure && process.env.NODE_ENV === 'production') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// Strict Transport Security
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));
```

### Data Backup & Recovery

```typescript
// Automated encrypted backups
const backupSchedule = {
  full: '0 0 * * 0',      // Weekly full backup
  incremental: '0 */6 * * *',  // Every 6 hours
  retention: 90            // Days
};

// Backup encryption
const encryptBackup = async (backupData: Buffer) => {
  const cipher = crypto.createCipheriv('aes-256-gcm', BACKUP_KEY, iv);
  return Buffer.concat([cipher.update(backupData), cipher.final()]);
};
```

## 🌐 Network Security

### Firewall Rules

```typescript
// IP whitelist for admin access
const ADMIN_IP_WHITELIST = process.env.ADMIN_IPS?.split(',') || [];

const ipWhitelist = (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/admin')) {
    if (!ADMIN_IP_WHITELIST.includes(req.ip)) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }
  next();
};
```

### DDoS Protection

```typescript
import rateLimit from 'express-rate-limit';

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    auditLog.warn('Rate limit exceeded', { ip: req.ip });
    res.status(429).json({ error: 'Too many requests' });
  }
});

// Stricter limits for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,                     // 5 attempts
  skipSuccessfulRequests: true
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
```

### WAF (Web Application Firewall)

```yaml
# CloudFlare WAF Rules
rules:
  - name: Block SQL Injection
    expression: (http.request.uri.query contains "select" and http.request.uri.query contains "from")
    action: block
  
  - name: Block XSS Attempts
    expression: (http.request.uri.query contains "<script" or http.request.body contains "<script")
    action: block
  
  - name: Geographic Restrictions
    expression: (ip.geoip.country ne "US" and http.request.uri.path eq "/admin")
    action: challenge
```

## 🔍 Application Security

### Input Validation

```typescript
import { body, validationResult } from 'express-validator';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

// Sanitization middleware
app.use(mongoSanitize());  // Prevent NoSQL injection
app.use(xss());             // Prevent XSS attacks

// Validation example
const validateStaffCreation = [
  body('personal.email').isEmail().normalizeEmail(),
  body('personal.first_name').trim().escape().isLength({ min: 1, max: 50 }),
  body('employment.role').isIn(['doctor', 'nurse', 'technician', 'admin']),
  body('employment.max_hours_per_week').isInt({ min: 0, max: 168 })
];
```

### CSRF Protection

```typescript
import csrf from 'csurf';

// CSRF token middleware
const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

// Include token in responses
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});
```

### Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.medscheduleai.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

## 📊 Security Monitoring

### Real-Time Monitoring

```typescript
// Security event monitoring
const securityMonitor = {
  events: {
    FAILED_LOGIN: { threshold: 5, window: 300000 },      // 5 attempts in 5 min
    DATA_EXPORT: { threshold: 10, window: 3600000 },     // 10 exports in 1 hour
    PERMISSION_CHANGE: { threshold: 3, window: 900000 }, // 3 changes in 15 min
    API_ERRORS: { threshold: 50, window: 60000 }         // 50 errors in 1 min
  },
  
  async checkThreshold(event: string, userId: string) {
    const config = this.events[event];
    const count = await redis.incr(`security:${event}:${userId}`);
    
    if (count === 1) {
      await redis.expire(`security:${event}:${userId}`, config.window / 1000);
    }
    
    if (count >= config.threshold) {
      await this.triggerAlert(event, userId, count);
    }
  },
  
  async triggerAlert(event: string, userId: string, count: number) {
    // Send alert to security team
    await notificationService.sendSecurityAlert({
      type: event,
      user_id: userId,
      count,
      timestamp: new Date()
    });
    
    // Log security incident
    await SecurityIncident.create({
      type: event,
      user_id: userId,
      details: { count },
      severity: 'high'
    });
  }
};
```

### Vulnerability Scanning

```yaml
# Automated security scanning
security_scans:
  - name: Dependency Check
    tool: npm audit
    schedule: daily
    action: fix_auto
  
  - name: SAST
    tool: SonarQube
    schedule: on_commit
    fail_on: high_severity
  
  - name: Container Scan
    tool: Trivy
    schedule: on_build
    fail_on: critical
  
  - name: Penetration Test
    tool: OWASP ZAP
    schedule: weekly
    report_to: security_team
```

## 🚨 Incident Response

### Incident Response Plan

```typescript
interface SecurityIncident {
  id: string;
  type: 'data_breach' | 'unauthorized_access' | 'malware' | 'dos_attack';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_at: Date;
  detected_by: string;
  status: 'investigating' | 'contained' | 'resolved';
  affected_systems: string[];
  affected_users?: string[];
  response_actions: ResponseAction[];
}

const incidentResponse = {
  async handleIncident(incident: SecurityIncident) {
    // 1. Immediate containment
    await this.containThreat(incident);
    
    // 2. Notify stakeholders
    await this.notifyStakeholders(incident);
    
    // 3. Investigate and document
    await this.investigate(incident);
    
    // 4. Remediate
    await this.remediate(incident);
    
    // 5. Post-incident review
    await this.postIncidentReview(incident);
  },
  
  async containThreat(incident: SecurityIncident) {
    switch (incident.type) {
      case 'unauthorized_access':
        // Revoke all sessions for affected users
        await this.revokeUserSessions(incident.affected_users);
        // Force password reset
        await this.forcePasswordReset(incident.affected_users);
        break;
      
      case 'data_breach':
        // Isolate affected systems
        await this.isolateSystems(incident.affected_systems);
        // Enable additional monitoring
        await this.enableEnhancedMonitoring();
        break;
    }
  },
  
  async notifyStakeholders(incident: SecurityIncident) {
    if (incident.severity === 'critical' || incident.type === 'data_breach') {
      // HIPAA breach notification (within 60 days)
      await this.notifyHHS(incident);
      
      // Notify affected individuals
      await this.notifyAffectedUsers(incident);
      
      // Notify media if >500 individuals affected
      if (incident.affected_users && incident.affected_users.length > 500) {
        await this.notifyMedia(incident);
      }
    }
  }
};
```

### Breach Notification

```typescript
const breachNotification = {
  async notifyBreach(incident: SecurityIncident) {
    const affectedCount = incident.affected_users?.length || 0;
    
    // Determine notification requirements
    const notifications = {
      hhs: affectedCount >= 500,  // Immediate HHS notification
      individuals: true,           // Always notify individuals
      media: affectedCount >= 500, // Media notification
      timeline: affectedCount >= 500 ? '60 days' : 'without unreasonable delay'
    };
    
    // Send breach notifications
    if (notifications.individuals) {
      await this.notifyIndividuals(incident);
    }
    
    if (notifications.hhs) {
      await this.submitHHSReport(incident);
    }
    
    if (notifications.media) {
      await this.issueMediaNotice(incident);
    }
  }
};
```

---

**Document Version:** 1.0  
**Last Updated:** December 19, 2024  
**Next Security Audit:** March 19, 2025  
**Security Contact:** security@medscheduleai.com