import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export function ownerMatches(email: string, owner: string | undefined) {
  return (
    !!owner?.trim() && email.trim().toLowerCase() === owner.trim().toLowerCase()
  );
}
export async function analyticsAccess() {
  const user = await getChatGPTUser();
  return {
    signedIn: !!user,
    owner: !!user && ownerMatches(user.email, env.ANALYTICS_OWNER_EMAIL),
  };
}
