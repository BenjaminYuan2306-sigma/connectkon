export const usageEventNames = [
  'visit',
  'connection_created',
  'conversation_created',
  'relationship_created',
  'followup_set',
] as const;
export type UsageEventName = (typeof usageEventNames)[number];
export const eventLabels: Record<UsageEventName, string> = {
  visit: '访问次数',
  connection_created: '新增联系人',
  conversation_created: '记录对话',
  relationship_created: '建立关系连线',
  followup_set: '设置跟进日期',
};
export type UsageInput = { id: string; visitor: string; event: UsageEventName };
const uuid =
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export function parseUsageInput(input: unknown): UsageInput {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Invalid event.');
  const value = input as Record<string, unknown>;
  if (
    Object.keys(value).length !== 3 ||
    !['id', 'visitor', 'event'].every((k) => Object.hasOwn(value, k)) ||
    typeof value.id !== 'string' ||
    !uuid.test(value.id) ||
    typeof value.visitor !== 'string' ||
    !uuid.test(value.visitor) ||
    !usageEventNames.includes(value.event as UsageEventName)
  )
    throw new Error('Invalid event.');
  return value as UsageInput;
}
export const analyticsDay = (now = Date.now()) =>
  new Date(now + 7 * 3600_000).toISOString().slice(0, 10);
export const analyticsStart = (now = Date.now()) =>
  analyticsDay(now - 29 * 86400_000);
export type UsageSummary = {
  today: number;
  visitors: number;
  visits: number;
  returning: number;
  daily: { day: string; visitors: number; visits: number }[];
  features: { event: UsageEventName; count: number; visitors: number }[];
  firstEvent: string | null;
  updatedAt: string;
};
