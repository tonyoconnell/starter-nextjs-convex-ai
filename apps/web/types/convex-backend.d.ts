// Type declarations for convex-backend package
// This file provides types without importing actual implementation

declare module 'convex-backend' {
  export const api: {
    queries: {
      getTestMessage: any;
      getTestMessages: any;
    };
    auth: {
      registerUser: any;
      loginUser: any;
      logoutUser: any;
      changePassword: any;
      requestPasswordReset: any;
      resetPassword: any;
      getGitHubOAuthUrl: any;
      githubOAuthLogin: any;
      getGoogleOAuthUrl: any;
      googleOAuthLogin: any;
    };
    users: {
      getCurrentUser: any;
    };
    loggingAction: {
      processLogs: any;
    };
  };
}
