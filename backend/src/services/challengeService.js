/**
 * Challenge Program Service (PHASE D2)
 * Mock data service for challenge overview, tracks, and timeline
 */

/**
 * Get challenge overview for a user
 * @param {number} userId - The user ID
 * @returns {Promise<object>} Challenge overview data
 */
async function getChallengeOverviewForUser(userId) {
  // Mock data for now
  return {
    season: '2025–2026',
    status: 'Preview',
    totalTracks: 3,
    registrationOpens: '2026-01-15T00:00:00Z',
    registrationStatus: 'Not open yet',
    userEnrollmentStatus: 'Not enrolled',
  };
}

/**
 * Get all challenge tracks
 * @returns {Promise<Array>} Array of challenge track objects
 */
async function getChallengeTracks() {
  return [
    {
      id: 'student',
      name: 'Student Track',
      level: 'Beginner / Intermediate',
      status: 'Coming soon',
      focus: 'School and university students',
      rewardsSummary: 'Recognition, certificates, and early ecosystem access',
    },
    {
      id: 'team',
      name: 'Team Track',
      level: 'Intermediate / Advanced',
      status: 'Coming soon',
      focus: 'Groups, clubs, and small teams',
      rewardsSummary: 'Team-based challenge missions and shared rewards',
    },
    {
      id: 'freelancer',
      name: 'Freelancer Track',
      level: 'Advanced',
      status: 'Coming soon',
      focus: 'Solo builders, freelancers, and creators',
      rewardsSummary: 'Project-based bounties and long-term collaboration',
    },
  ];
}

/**
 * Get challenge program timeline
 * @returns {Promise<Array>} Array of timeline phase objects
 */
async function getChallengeTimeline() {
  return [
    {
      id: 'phase-announce',
      label: 'Program announcement',
      period: 'Q4 2025',
      status: 'Complete',
    },
    {
      id: 'phase-design',
      label: 'Track design & documentation',
      period: 'Q1 2026',
      status: 'In progress',
    },
    {
      id: 'phase-registration',
      label: 'Registration window',
      period: 'TBD 2026',
      status: 'Planned',
    },
    {
      id: 'phase-launch',
      label: 'Challenge launch',
      period: 'TBD 2026',
      status: 'Planned',
    },
  ];
}

export {
  getChallengeOverviewForUser,
  getChallengeTracks,
  getChallengeTimeline,
};
