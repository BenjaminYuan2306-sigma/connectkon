import { analyticsAccess } from '@/lib/analytics-auth';
export const dynamic = 'force-dynamic';
export async function GET() {
  return Response.json(await analyticsAccess(), {
    headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
  });
}
