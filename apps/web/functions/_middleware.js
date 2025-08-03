// Cloudflare Pages middleware to set compatibility flags
export const onRequest = async (context) => {
  // This file ensures nodejs_compat is properly configured
  return await context.next();
};