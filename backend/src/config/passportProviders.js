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
import { syncOAuthProfile } from '../services/userService.js';

// Base callback URL configuration
const baseCallbackUrl = process.env.BACKEND_URL || process.env.OAUTH_CALLBACK_BASE_URL || 'http://localhost:4000';

/**
 * Helper to extract OAuth profile data from provider profile
 * Normalizes data from different providers into a common format
 */
function extractOAuthProfileData(provider, profile) {
  const normalizedProvider = provider.toLowerCase();
  
  let email = null;
  let emailVerified = false;
  let username = null;
  let displayName = null;
  let avatarUrl = null;
  
  switch (normalizedProvider) {
    case 'google':
      email = profile.emails?.[0]?.value || null;
      emailVerified = profile.emails?.[0]?.verified === true || false;
      displayName = profile.displayName || profile.name?.givenName || null;
      avatarUrl = profile.photos?.[0]?.value || null;
      break;
      
    case 'github':
      email = profile.emails?.[0]?.value || null;
      emailVerified = profile.emails?.[0]?.verified === true || false;
      username = profile.username || profile.login || null;
      displayName = profile.displayName || profile.name || username || null;
      avatarUrl = profile.photos?.[0]?.value || profile._json?.avatar_url || null;
      break;
      
    case 'twitter':
      email = profile.emails?.[0]?.value || null;
      emailVerified = profile.emails?.[0]?.verified === true || false;
      username = profile.username || null;
      displayName = profile.displayName || profile.username || null;
      avatarUrl = profile.photos?.[0]?.value || profile._json?.profile_image_url_https || null;
      break;
      
    case 'linkedin':
      email = profile.emails?.[0]?.value || null;
      emailVerified = profile.emails?.[0]?.verified === true || false;
      displayName = profile.displayName || null;
      avatarUrl = profile.photos?.[0]?.value || null;
      break;
      
    case 'discord':
      email = profile.email || null;
      emailVerified = profile.verified === true || false;
      username = profile.username || null;
      displayName = profile.global_name || profile.username || null;
      avatarUrl = profile.avatar 
        ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
        : null;
      break;
      
    default:
      // Fallback for unknown providers
      email = profile.email || profile.emails?.[0]?.value || null;
      displayName = profile.displayName || profile.name || profile.username || null;
      avatarUrl = profile.avatar_url || profile.photos?.[0]?.value || null;
  }
  
  return {
    email,
    emailVerified,
    username,
    displayName,
    avatarUrl,
    profileJson: profile._json || profile,
  };
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
            const { email, emailVerified, username, displayName, avatarUrl, profileJson } = 
              extractOAuthProfileData('google', profile);
            
            // Note: existingUserId is not available in passport verify callback
            // Connect flow will be handled in the callback route handler
            const { user } = await syncOAuthProfile({
              provider: 'google',
              providerUserId: profile.id,
              email,
              emailVerified,
              username,
              displayName,
              avatarUrl,
              profileJson,
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
            const { email, emailVerified, username, displayName, avatarUrl, profileJson } = 
              extractOAuthProfileData('github', profile);
            
            const { user } = await syncOAuthProfile({
              provider: 'github',
              providerUserId: profile.id,
              email,
              emailVerified,
              username,
              displayName,
              avatarUrl,
              profileJson,
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
            const { email, emailVerified, username, displayName, avatarUrl, profileJson } = 
              extractOAuthProfileData('twitter', profile);
            
            const { user } = await syncOAuthProfile({
              provider: 'twitter',
              providerUserId: profile.id,
              email,
              emailVerified,
              username,
              displayName,
              avatarUrl,
              profileJson,
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
            const { email, emailVerified, username, displayName, avatarUrl, profileJson } = 
              extractOAuthProfileData('linkedin', profile);
            
            const { user } = await syncOAuthProfile({
              provider: 'linkedin',
              providerUserId: profile.id,
              email,
              emailVerified,
              username,
              displayName,
              avatarUrl,
              profileJson,
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
          const { email, emailVerified, username, displayName, avatarUrl, profileJson } = 
            extractOAuthProfileData('discord', profile);
          
          const { user } = await syncOAuthProfile({
            provider: 'discord',
            providerUserId: profile.id,
            email,
            emailVerified,
            username,
            displayName,
            avatarUrl,
            profileJson,
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

