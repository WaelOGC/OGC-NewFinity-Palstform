import passport from 'passport';
import env from './env.js';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import GitHubStrategy from 'passport-github2';
import TwitterStrategy from 'passport-twitter';
// Note: passport-linkedin-oauth2 exports Strategy as a named export, not default
// Using named import to avoid "not a constructor" error
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { syncOAuthProfile } from '../services/userService.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { getOAuthCallbackUrl } = require('../utils/oauthConfig.cjs');

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
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  try {
    const callbackURL = getOAuthCallbackUrl('google');
    console.log(`[OAuth Config] google callback: ${callbackURL}`);
    
    passport.use(
      'google',
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          callbackURL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const { email, emailVerified, username, displayName, avatarUrl, profileJson } = 
              extractOAuthProfileData('google', profile);
            
            // Check if email is missing - if so, pass profile data to callback handler for missing email flow
            if (!email) {
              // Pass profile data as a special marker object that callback handler can detect
              return done(null, {
                __oauthMissingEmail: true,
                provider: 'google',
                providerUserId: profile.id,
                displayName,
                avatarUrl,
                emailVerified: false,
              });
            }
            
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
if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  try {
    console.log('[GitHub OAuth] init...');

    const clientID = env.GITHUB_CLIENT_ID;
    const clientSecret = env.GITHUB_CLIENT_SECRET;
    const callbackURL = getOAuthCallbackUrl('github');
    
    console.log('[GitHub OAuth] env', { clientID, hasSecret: !!clientSecret });
    console.log(`[OAuth Config] github callback: ${callbackURL}`);

    passport.use(
      'github',
      new GitHubStrategy(
        {
          clientID,
          clientSecret,
          callbackURL,
          scope: ['user:email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const { email, emailVerified, username, displayName, avatarUrl, profileJson } = 
              extractOAuthProfileData('github', profile);
            
            // Check if email is missing - if so, pass profile data to callback handler for missing email flow
            if (!email) {
              // Pass profile data as a special marker object that callback handler can detect
              return done(null, {
                __oauthMissingEmail: true,
                provider: 'github',
                providerUserId: profile.id,
                displayName,
                avatarUrl,
                emailVerified: false,
              });
            }
            
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
if (env.TWITTER_CLIENT_ID && env.TWITTER_CLIENT_SECRET) {
  try {
    const callbackURL = getOAuthCallbackUrl('twitter');
    console.log(`[OAuth Config] twitter callback: ${callbackURL}`);
    
    passport.use(
      'twitter',
      new TwitterStrategy(
        {
          consumerKey: env.TWITTER_CLIENT_ID,
          consumerSecret: env.TWITTER_CLIENT_SECRET,
          callbackURL,
          includeEmail: true,
        },
        async (token, tokenSecret, profile, done) => {
          try {
            const { email, emailVerified, username, displayName, avatarUrl, profileJson } = 
              extractOAuthProfileData('twitter', profile);
            
            // Check if email is missing - if so, pass profile data to callback handler for missing email flow
            if (!email) {
              // Pass profile data as a special marker object that callback handler can detect
              return done(null, {
                __oauthMissingEmail: true,
                provider: 'twitter',
                providerUserId: profile.id,
                displayName,
                avatarUrl,
                emailVerified: false,
              });
            }
            
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
if (env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET) {
  try {
    const callbackURL = getOAuthCallbackUrl('linkedin');
    console.log(`[OAuth Config] linkedin callback: ${callbackURL}`);
    
    passport.use(
      'linkedin',
      new LinkedInStrategy(
        {
          clientID: env.LINKEDIN_CLIENT_ID,
          clientSecret: env.LINKEDIN_CLIENT_SECRET,
          callbackURL,
          scope: ['openid', 'profile', 'email'],
          state: false,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const { email, emailVerified, username, displayName, avatarUrl, profileJson } = 
              extractOAuthProfileData('linkedin', profile);
            
            // Check if email is missing - if so, pass profile data to callback handler for missing email flow
            if (!email) {
              // Pass profile data as a special marker object that callback handler can detect
              return done(null, {
                __oauthMissingEmail: true,
                provider: 'linkedin',
                providerUserId: profile.id,
                displayName,
                avatarUrl,
                emailVerified: false,
              });
            }
            
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
  id: env.DISCORD_CLIENT_ID,
  secret: env.DISCORD_CLIENT_SECRET
});

// Always register the strategy, even if env vars are missing (for testing)
try {
  console.log('[Discord OAuth] registering Discord strategy...');
  const callbackURL = getOAuthCallbackUrl('discord');
  console.log(`[OAuth Config] discord callback: ${callbackURL}`);
  
  passport.use(
    'discord',
    new DiscordStrategy(
      {
        clientID: env.DISCORD_CLIENT_ID || '',
        clientSecret: env.DISCORD_CLIENT_SECRET || '',
        callbackURL,
        scope: ['identify', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const { email, emailVerified, username, displayName, avatarUrl, profileJson } = 
            extractOAuthProfileData('discord', profile);
          
          // Check if email is missing - if so, pass profile data to callback handler for missing email flow
          if (!email) {
            // Pass profile data as a special marker object that callback handler can detect
            return done(null, {
              __oauthMissingEmail: true,
              provider: 'discord',
              providerUserId: profile.id,
              displayName,
              avatarUrl,
              emailVerified: false,
            });
          }
          
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

