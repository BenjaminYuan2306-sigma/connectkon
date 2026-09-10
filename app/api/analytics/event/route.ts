import { analyticsDb } from '@/db';
import { analyticsAccess } from '@/lib/analytics-auth';
import { analyticsDay, parseUsageInput } from '@/lib/analytics-contract';
import { analyticsSql } from '@/lib/analytics-sql';
export const dynamic = 'force-dynamic';
const response = (status: number) =>
  new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin !== new URL(request.url).origin) return response(403);
  if (
    request.headers.get('dnt') === '1' ||
    request.headers.get('sec-gpc') === '1'
  )
    return response(204);
  if (
    !(request.headers.get('content-type') || '').startsWith('application/json')
  )
    return response(415);
  if (Number(request.headers.get('content-length') || 0) > 1024)
    return response(413);
  try {
    // Bound the stream even when a client omits Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return response(400);
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 1024) {
        await reader.cancel();
        return response(413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    let input;
    try {
      input = parseUsageInput(JSON.parse(new TextDecoder().decode(bytes)));
    } catch {
      return response(400);
    }
    if ((await analyticsAccess()).owner) return response(204);
    const hash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode('connectkon-usage-v1:' + input.visitor),
    );
    const visitor = Array.from(new Uint8Array(hash), (b) =>
      b.toString(16).padStart(2, '0'),
    ).join('');
    const now = Date.now(),
      day = analyticsDay(now),
      db = analyticsDb();
    await db.batch([
      db.prepare(analyticsSql.prune).bind(now - 90 * 86400_000),
      db
        .prepare(analyticsSql.collect)
        .bind(input.id, visitor, input.event, day, now, visitor, day),
    ]);
    return response(204);
  } catch {
    return response(503);
  }
}
