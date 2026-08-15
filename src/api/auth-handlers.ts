// ================================================================
// MurryAI - Authentication API Handlers
// Cloudflare Workers V8 Isolate Compatible (D1 & Web Crypto)
// ================================================================

import type { Env } from '../types';
import { apiError, apiJson } from '../types';
import {
  hashPassword,
  verifyPassword,
  signJWT,
  verifyJWT,
  isValidEmail,
  validatePasswordStrength,
  generateSlug,
  hashSHA256,
} from '../lib/auth';
import { sendEmail } from '../lib/email';

// ──────────────────────────────────────────
// Database Record Types
// ──────────────────────────────────────────

interface UserRecord {
  id: string;
  org_id: string;
  email: string;
  password_hash: string;
  password_salt: string;
  first_name: string;
  last_name: string;
  role: string;
  email_verified: number;
  verification_token: string | null;
  reset_token: string | null;
  reset_token_expires: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  plan: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  subscription_period_end: string | null;
  max_proposals: number;
  max_users: number;
  max_storage_mb: number;
  created_at: string;
  updated_at: string;
}

interface SessionRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

// ──────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────

/**
 * Extracts session JWT token from Authorization header or __session cookie.
 */
function getTokenFromRequest(request: Request): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring(7).trim();
  }

  // Check Cookie header
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith('__session=')) {
        return cookie.substring('__session='.length);
      }
    }
  }

  return null;
}

/**
 * Builds standard Set-Cookie header string for session management.
 */
function buildSessionCookieHeader(token: string, maxAgeSeconds = 86400): string {
  if (maxAgeSeconds === 0) {
    return '__session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
  return `__session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

// ──────────────────────────────────────────
// 1. handleRegister
// ──────────────────────────────────────────

/**
 * Handles user and organization registration.
 * Creates 'free' organization with default limits and owner user account,
 * then triggers a verification email.
 */
export async function handleRegister(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return apiError('Method not allowed', 405);
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const firstName =
      typeof body.first_name === 'string'
        ? body.first_name.trim()
        : typeof body.firstName === 'string'
        ? body.firstName.trim()
        : '';
    const lastName =
      typeof body.last_name === 'string'
        ? body.last_name.trim()
        : typeof body.lastName === 'string'
        ? body.lastName.trim()
        : '';
    const orgName =
      typeof body.org_name === 'string'
        ? body.org_name.trim()
        : typeof body.organization_name === 'string'
        ? body.organization_name.trim()
        : typeof body.orgName === 'string'
        ? body.orgName.trim()
        : '';

    // Field validation
    if (!email || !password || !firstName || !lastName || !orgName) {
      return apiError(
        'Missing required fields: email, password, first_name, last_name, and org_name are required.',
        400
      );
    }

    if (!isValidEmail(email)) {
      return apiError('Invalid email address format.', 400);
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Password does not meet strength requirements.',
          details: passwordValidation.errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE LOWER(email) = LOWER(?)'
    )
      .bind(email)
      .first<Pick<UserRecord, 'id'>>();

    if (existingUser) {
      return apiError('An account with this email address already exists.', 400);
    }

    // Generate unique organization slug (handle collisions -2, -3, etc.)
    const baseSlug = generateSlug(orgName);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingOrg = await env.DB.prepare(
        'SELECT id FROM organizations WHERE slug = ?'
      )
        .bind(slug)
        .first<Pick<OrganizationRecord, 'id'>>();

      if (!existingOrg) {
        break;
      }
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // Hash password
    const { hash: passwordHash, salt: passwordSalt } = await hashPassword(password);

    // Identifiers & Timestamps
    const orgId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const verificationToken = crypto.randomUUID();
    const nowStr = new Date().toISOString();

    // Insert Organization (plan='free', max_proposals=3, max_users=1, max_storage_mb=100)
    await env.DB.prepare(
      `INSERT INTO organizations (
        id, name, slug, plan, stripe_customer_id, stripe_subscription_id,
        subscription_status, subscription_period_end, max_proposals, max_users, max_storage_mb,
        created_at, updated_at
      ) VALUES (?, ?, ?, 'free', NULL, NULL, 'active', NULL, 3, 1, 100, ?, ?)`
    )
      .bind(orgId, orgName, slug, nowStr, nowStr)
      .run();

    // Insert User (role='owner', email_verified=0)
    await env.DB.prepare(
      `INSERT INTO users (
        id, org_id, email, password_hash, password_salt, first_name, last_name,
        role, email_verified, verification_token, reset_token, reset_token_expires,
        last_login, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'owner', 0, ?, NULL, NULL, NULL, ?, ?)`
    )
      .bind(
        userId,
        orgId,
        email.toLowerCase(),
        passwordHash,
        passwordSalt,
        firstName,
        lastName,
        verificationToken,
        nowStr,
        nowStr
      )
      .run();

    // Dispatch verification email
    const appUrl = new URL(request.url).origin;
    const verifyUrl = `${appUrl}/api/auth/verify-email?token=${verificationToken}`;

    await sendEmail(env, {
      to: email,
      subject: 'Verify your email address - MurryAI',
      html: `<p>Hi ${firstName},</p><p>Welcome to MurryAI! Please verify your email address by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      text: `Hi ${firstName},\n\nWelcome to MurryAI! Please verify your email address using this link: ${verifyUrl}`,
    });

    return apiJson(
      {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
      },
      201
    );
  } catch (err) {
    console.error('handleRegister error:', err);
    return apiError(`Registration failed: ${err instanceof Error ? err.message : String(err)}`, 500);
  }
}

// ──────────────────────────────────────────
// 2. handleVerifyEmail
// ──────────────────────────────────────────

/**
 * Handles email verification via GET token parameter.
 * Sets email_verified = 1 and redirects to /login?verified=true.
 */
export async function handleVerifyEmail(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return apiError('Verification token is required.', 400);
    }

    // Find user matching token
    const user = await env.DB.prepare(
      'SELECT id FROM users WHERE verification_token = ?'
    )
      .bind(token)
      .first<Pick<UserRecord, 'id'>>();

    if (!user) {
      return apiError('Invalid or expired verification token.', 400);
    }

    const nowStr = new Date().toISOString();

    // Update user status
    await env.DB.prepare(
      'UPDATE users SET email_verified = 1, verification_token = NULL, updated_at = ? WHERE id = ?'
    )
      .bind(nowStr, user.id)
      .run();

    // Redirect to login page
    const appUrl = url.origin;
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${appUrl}/login?verified=true`,
      },
    });
  } catch (err) {
    console.error('handleVerifyEmail error:', err);
    return apiError(`Verification failed: ${err instanceof Error ? err.message : String(err)}`, 500);
  }
}

// ──────────────────────────────────────────
// 3. handleLogin
// ──────────────────────────────────────────

/**
 * Authenticates user credentials, verifies email status, generates JWT,
 * inserts a session record in D1, updates last_login, and sets __session cookie.
 */
export async function handleLogin(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return apiError('Method not allowed', 405);
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return apiError('Email and password are required.', 400);
    }

    // Lookup user by email
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?)'
    )
      .bind(email)
      .first<UserRecord>();

    if (!user) {
      return apiError('Invalid email or password.', 401);
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash, user.password_salt);
    if (!isPasswordValid) {
      return apiError('Invalid email or password.', 401);
    }

    // Check email verification
    if (!user.email_verified) {
      return apiError('Email not verified. Please check your inbox to verify your account.', 403);
    }

    // JWT secret
    const secret = env.JWT_SECRET || 'fallback-jwt-secret-key-change-in-production';

    // Sign 24-hour JWT
    const tokenPayload = {
      sub: user.id,
      org: user.org_id,
      role: user.role,
      email: user.email,
    };
    const token = await signJWT(tokenPayload, secret, 86400);

    // Session record in D1
    const sessionId = crypto.randomUUID();
    const tokenHash = await hashSHA256(token);
    const nowStr = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 86400 * 1000).toISOString();

    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(sessionId, user.id, tokenHash, expiresAt, nowStr)
      .run();

    // Update user last_login timestamp
    await env.DB.prepare(
      'UPDATE users SET last_login = ?, updated_at = ? WHERE id = ?'
    )
      .bind(nowStr, nowStr, user.id)
      .run();

    // Fetch organization record
    const org = await env.DB.prepare(
      'SELECT * FROM organizations WHERE id = ?'
    )
      .bind(user.org_id)
      .first<OrganizationRecord>();

    // Prepare sanitized user object
    const sanitizedUser = {
      id: user.id,
      org_id: user.org_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      email_verified: user.email_verified,
      last_login: nowStr,
      created_at: user.created_at,
      updated_at: nowStr,
    };

    const cookieHeader = buildSessionCookieHeader(token, 86400);

    return new Response(
      JSON.stringify({
        token,
        user: sanitizedUser,
        org: org ?? null,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader,
        },
      }
    );
  } catch (err) {
    console.error('handleLogin error:', err);
    return apiError(`Login failed: ${err instanceof Error ? err.message : String(err)}`, 500);
  }
}

// ──────────────────────────────────────────
// 4. handleForgotPassword
// ──────────────────────────────────────────

/**
 * Handles password reset request. Generates 1-hour reset token if user exists,
 * sends reset email, and always returns status 200 to prevent user enumeration.
 */
export async function handleForgotPassword(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return apiError('Method not allowed', 405);
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim() : '';

    if (!email) {
      return apiError('Email is required.', 400);
    }

    // Lookup user silently
    const user = await env.DB.prepare(
      'SELECT id, first_name FROM users WHERE LOWER(email) = LOWER(?)'
    )
      .bind(email)
      .first<Pick<UserRecord, 'id' | 'first_name'>>();

    if (user) {
      const resetToken = crypto.randomUUID();
      const resetTokenExpires = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour
      const nowStr = new Date().toISOString();

      await env.DB.prepare(
        'UPDATE users SET reset_token = ?, reset_token_expires = ?, updated_at = ? WHERE id = ?'
      )
        .bind(resetToken, resetTokenExpires, nowStr, user.id)
        .run();

      const appUrl = new URL(request.url).origin;
      const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

      await sendEmail(env, {
        to: email,
        subject: 'Reset your password - MurryAI',
        html: `<p>Hi ${user.first_name},</p><p>You requested a password reset. Click the link below to set a new password (link expires in 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
        text: `Hi ${user.first_name},\n\nYou requested a password reset. Use this link to set a new password (expires in 1 hour): ${resetUrl}`,
      });
    }

    // Always return 200 to prevent user enumeration
    return apiJson({
      success: true,
      message: 'If an account exists with that email address, a password reset link has been sent.',
    });
  } catch (err) {
    console.error('handleForgotPassword error:', err);
    return apiError(`Failed to process request: ${err instanceof Error ? err.message : String(err)}`, 500);
  }
}

// ──────────────────────────────────────────
// 5. handleResetPassword
// ──────────────────────────────────────────

/**
 * Resets user password using a valid reset token.
 * Hashes new password, clears reset token, and invalidates all existing user sessions.
 */
export async function handleResetPassword(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return apiError('Method not allowed', 405);
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const token =
      typeof body.token === 'string'
        ? body.token.trim()
        : typeof body.reset_token === 'string'
        ? body.reset_token.trim()
        : '';
    const newPassword =
      typeof body.new_password === 'string'
        ? body.new_password
        : typeof body.password === 'string'
        ? body.password
        : '';

    if (!token || !newPassword) {
      return apiError('Reset token and new password are required.', 400);
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'New password does not meet strength requirements.',
          details: passwordValidation.errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Find user by reset token
    const user = await env.DB.prepare(
      'SELECT id, reset_token_expires FROM users WHERE reset_token = ?'
    )
      .bind(token)
      .first<Pick<UserRecord, 'id' | 'reset_token_expires'>>();

    if (!user) {
      return apiError('Invalid or expired password reset token.', 400);
    }

    if (!user.reset_token_expires || new Date(user.reset_token_expires) <= new Date()) {
      return apiError('Password reset token has expired. Please request a new one.', 400);
    }

    // Hash new password
    const { hash: passwordHash, salt: passwordSalt } = await hashPassword(newPassword);
    const nowStr = new Date().toISOString();

    // Update password and clear reset token
    await env.DB.prepare(
      `UPDATE users SET
        password_hash = ?,
        password_salt = ?,
        reset_token = NULL,
        reset_token_expires = NULL,
        updated_at = ?
      WHERE id = ?`
    )
      .bind(passwordHash, passwordSalt, nowStr, user.id)
      .run();

    // Invalidate all active user sessions
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?')
      .bind(user.id)
      .run();

    return apiJson({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (err) {
    console.error('handleResetPassword error:', err);
    return apiError(`Password reset failed: ${err instanceof Error ? err.message : String(err)}`, 500);
  }
}

// ──────────────────────────────────────────
// 6. handleLogout
// ──────────────────────────────────────────

/**
 * Logs out user by deleting matching session from D1 and clearing session cookie.
 */
export async function handleLogout(request: Request, env: Env): Promise<Response> {
  try {
    const token = getTokenFromRequest(request);

    if (token) {
      const tokenHash = await hashSHA256(token);
      await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?')
        .bind(tokenHash)
        .run();
    }

    const clearCookieHeader = buildSessionCookieHeader('', 0);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Logged out successfully.',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': clearCookieHeader,
        },
      }
    );
  } catch (err) {
    console.error('handleLogout error:', err);
    return apiError(`Logout failed: ${err instanceof Error ? err.message : String(err)}`, 500);
  }
}

// ──────────────────────────────────────────
// 7. authMiddleware
// ──────────────────────────────────────────

/**
 * Authentication middleware for protected route handlers.
 * Reads __session cookie or Authorization Bearer header, verifies JWT, checks D1 session table,
 * and returns { user, org } objects or a 401 Response on failure.
 */
export async function authMiddleware(
  request: Request,
  env: Env
): Promise<{ user: Omit<UserRecord, 'password_hash' | 'password_salt' | 'verification_token' | 'reset_token' | 'reset_token_expires'>; org: OrganizationRecord } | Response> {
  const token = getTokenFromRequest(request);

  if (!token) {
    return apiError('Unauthorized: Missing authentication token.', 401);
  }

  const secret = env.JWT_SECRET || 'fallback-jwt-secret-key-change-in-production';

  // Verify JWT signature and expiration
  const payload = await verifyJWT<{ sub: string; org: string; role: string; email: string }>(
    token,
    secret
  );

  if (!payload || !payload.sub) {
    return apiError('Unauthorized: Invalid or expired token.', 401);
  }

  // Hash token to verify session in D1
  const tokenHash = await hashSHA256(token);

  const session = await env.DB.prepare(
    'SELECT id, expires_at FROM sessions WHERE user_id = ? AND token_hash = ?'
  )
    .bind(payload.sub, tokenHash)
    .first<Pick<SessionRecord, 'id' | 'expires_at'>>();

  if (!session) {
    return apiError('Unauthorized: Session does not exist or has been terminated.', 401);
  }

  if (new Date(session.expires_at) <= new Date()) {
    // Delete expired session
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(session.id).run();
    return apiError('Unauthorized: Session has expired. Please log in again.', 401);
  }

  // Fetch user details from D1
  const user = await env.DB.prepare(
    `SELECT id, org_id, email, first_name, last_name, role, email_verified, last_login, created_at, updated_at
     FROM users WHERE id = ?`
  )
    .bind(payload.sub)
    .first<Omit<UserRecord, 'password_hash' | 'password_salt' | 'verification_token' | 'reset_token' | 'reset_token_expires'>>();

  if (!user) {
    return apiError('Unauthorized: User account not found.', 401);
  }

  // Fetch organization details from D1
  const org = await env.DB.prepare('SELECT * FROM organizations WHERE id = ?')
    .bind(user.org_id)
    .first<OrganizationRecord>();

  if (!org) {
    return apiError('Unauthorized: Organization record not found.', 401);
  }

  return { user, org };
}
