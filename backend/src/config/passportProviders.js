// Force-load .env before any other imports
import dotenv from 'dotenv';
dotenv.config();

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import GitHubStrategy from 'passport-github2';
import TwitterStrategy from 'passport-twitter';
// Note: passport-linkedin-oauth2 exports Strategy as a named export, not default
// Using named import to avoid "not a constructor" error
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { Strategy as DiscordStrategy } from 'passport-discord';
import pool from '../db.js';

// Base callback URL configuration
const baseCallbackUrl = process.env.BACKEND_URL || process.env.OAUTH_CALLBACK_BASE_URL || 'http://localhost:4000';

/**
 * Find or create a user from social OAuth provider
 * 
 * @param {Object} params - User data from OAuth provider
 * @param {string} params.provider - Provider name (google, github, twitter, linkedin, discord)
 * @param {string} params.providerId - Provider-specific user ID
 * @param {string|null} params.email - User email (may be null for some providers)
 * @param {string|null} params.name - User display name
 * @param {string|null} params.avatarUrl - User avatar URL
 * @returns {Promise<Object>} - User object from database
 */
async function findOrCreateSocialUser({ provider, providerId, email, name, avatarUrl }) {
  // Map provider names to database column names
  const providerColumnMap = {
    google: 'googleId',
    github: 'githubId',
    twitter: 'twitterId',
    linkedin: 'linkedinId',
    discord: 'discordId',
  };

  const providerColumn = providerColumnMap[provider];
  if (!providerColumn) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  // First, try to find user by provider ID
  let [rows] = await pool.query(
    `SELECT * FROM User WHERE ${providerColumn} = ?`,
    [providerId]
  );

  if (rows.length > 0) {
    // User exists with this provider ID
    return rows[0];
  }

  // If email is provided, check if user with that email exists
  if (email) {
    [rows] = await pool.query(
      'SELECT * FROM User WHERE email = ?',
      [email]
    );

    if (rows.length > 0) {
      // User exists with this email - link the provider account
      const existingUser = rows[0];
      
      // Update user with provider ID and authProvider if not set
      // Phase 5: Ensure role is set if it's NULL (for users created before Phase 5 migration)
      await pool.query(
        `UPDATE User SET ${providerColumn} = ?, authProvider = COALESCE(authProvider, ?), avatarUrl = COALESCE(avatarUrl, ?), role = COALESCE(role, 'STANDARD_USER') WHERE id = ?`,
        [providerId, provider, avatarUrl || existingUser.avatarUrl, existingUser.id]
      );

      // Fetch updated user
      [rows] = await pool.query('SELECT * FROM User WHERE id = ?', [existingUser.id]);
      return rows[0];
    }
  }

  // No existing user found - create new user
  // For social-only users, password is NULL and status is 'active' (email is verified by provider)
  const now = new Date();
  const termsVersion = process.env.TERMS_VERSION || '1.0';
  
  // Generate a placeholder email if not provided (some providers don't provide email)
  const userEmail = email || `${provider}_${providerId}@social.local`;
  
  // Phase 5: Explicitly set role to STANDARD_USER for new social users
  const [result] = await pool.query(
    `INSERT INTO User (email, password, fullName, status, authProvider, ${providerColumn}, avatarUrl, termsAccepted, termsAcceptedAt, termsVersion, termsSource, role) 
     VALUES (?, NULL, ?, 'active', ?, ?, ?, 1, ?, ?, ?, 'STANDARD_USER')`,
    [userEmail, name || null, provider, providerId, avatarUrl || null, now, termsVersion, provider]
  );

  // Fetch the newly created user
  [rows] = await pool.query('SELECT * FROM User WHERE id = ?', [result.insertId]);
  return rows[0];
}

// Configure Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  try {
    passport.use(
      'google',
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${baseCallbackUrl}/api/v1/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            const name = profile.displayName || profile.name?.givenName || null;
            const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
            
            const user = await findOrCreateSocialUser({
              provider: 'google',
              providerId: profile.id,
              email,
              name,
              avatarUrl,
            });

            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
    console.log('✓ Google OAuth strategy registered successfully');
  } catch (error) {
    console.error('✗ Failed to register Google OAuth strategy:', error.message);
  }
} else {
  console.log('⚠ Google OAuth strategy skipped (missing environment variables)');
}

// --- GitHub OAuth ---
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  try {
    console.log('[GitHub OAuth] init...');

    const clientID = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';

    console.log('[GitHub OAuth] env', { clientID, hasSecret: !!clientSecret });

    passport.use(
      'github',
      new GitHubStrategy(
        {
          clientID,
          clientSecret,
          callbackURL: `${baseUrl}/api/v1/auth/github/callback`,
          scope: ['user:email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await findOrCreateSocialUser({
              provider: 'github',
              providerId: profile.id,
              email:
                (profile.emails &&
                  profile.emails[0] &&
                  profile.emails[0].value) ||
                null,
              name: profile.displayName || profile.username || 'GitHub User',
              avatarUrl:
                (profile.photos &&
                  profile.photos[0] &&
                  profile.photos[0].value) ||
                null,
            });

            return done(null, user);
          } catch (err) {
            console.error('[GitHub OAuth] verify error', err);
            return done(err);
          }
        }
      )
    );

    console.log('✓ GitHub OAuth strategy registered successfully');
  } catch (err) {
    console.error('✗ Failed to register GitHub OAuth strategy:', err.message);
  }
} else {
  console.log('⚠ GitHub OAuth strategy skipped (missing environment variables)');
}

// Configure Twitter OAuth Strategy
if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
  try {
    passport.use(
      'twitter',
      new TwitterStrategy(
        {
          consumerKey: process.env.TWITTER_CLIENT_ID,
          consumerSecret: process.env.TWITTER_CLIENT_SECRET,
          callbackURL: `${baseCallbackUrl}/api/v1/auth/twitter/callback`,
          includeEmail: true,
        },
        async (token, tokenSecret, profile, done) => {
          try {
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            const name = profile.displayName || profile.username || null;
            const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
            
            const user = await findOrCreateSocialUser({
              provider: 'twitter',
              providerId: profile.id,
              email,
              name,
              avatarUrl,
            });

            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
    console.log('✓ Twitter OAuth strategy registered successfully');
  } catch (error) {
    console.error('✗ Failed to register Twitter OAuth strategy:', error.message);
  }
} else {
  console.log('⚠ Twitter OAuth strategy skipped (missing environment variables)');
}

// Configure LinkedIn OAuth Strategy
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  try {
    passport.use(
      'linkedin',
      new LinkedInStrategy(
        {
          clientID: process.env.LINKEDIN_CLIENT_ID,
          clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
          callbackURL: `${baseCallbackUrl}/api/v1/auth/linkedin/callback`,
          scope: ['openid', 'profile', 'email'],
          state: false,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email =
              profile.emails && profile.emails[0]
                ? profile.emails[0].value
                : null;

            const avatarUrl =
              profile.photos && profile.photos[0]
                ? profile.photos[0].value
                : null;

            const user = await findOrCreateSocialUser({
              provider: 'linkedin',
              providerId: profile.id,
              email,
              name: profile.displayName,
              avatarUrl,
            });

            return done(null, user);
          } catch (err) {
            return done(err, null);
          }
        }
      )
    );
    console.log('✓ LinkedIn OAuth strategy registered successfully');
  } catch (error) {
    console.error('✗ Failed to register LinkedIn OAuth strategy:', error.message);
  }
} else {
  console.log('⚠ LinkedIn OAuth strategy skipped (missing environment variables)');
}

// Configure Discord OAuth Strategy
console.log('[Discord OAuth] init...');

// Diagnostic logging: print exactly what Node sees
console.log('[Discord OAuth] env', {
  id: process.env.DISCORD_CLIENT_ID,
  secret: process.env.DISCORD_CLIENT_SECRET
});

// Always register the strategy, even if env vars are missing (for testing)
try {
  console.log('[Discord OAuth] registering Discord strategy...');
  passport.use(
    'discord',
    new DiscordStrategy(
      {
        clientID: process.env.DISCORD_CLIENT_ID || '',
        clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/v1/auth/discord/callback`,
        scope: ['identify', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.email || null;
          const name = profile.username || profile.global_name || null;
          const avatarUrl = profile.avatar 
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : null;
          
          const user = await findOrCreateSocialUser({
            provider: 'discord',
            providerId: profile.id,
            email,
            name,
            avatarUrl,
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
  console.log('[Discord OAuth] Strategy registered successfully');
} catch (error) {
  console.error('[Discord OAuth] FAILED to register strategy', error);
}

export default passport;

