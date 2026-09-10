import type { Metadata } from 'next';
import { analyticsAccess } from '@/lib/analytics-auth';
import { chatGPTSignInPath, chatGPTSignOutPath } from '@/app/chatgpt-auth';
import AnalyticsDashboard from '@/components/analytics/Dashboard';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'ConnectKon · 网站统计',
  robots: { index: false, follow: false },
};
export default async function AdminPage() {
  const access = await analyticsAccess();
  if (!access.owner)
    return (
      <main className="admin-gate">
        <p className="eyebrow">CONNECTKON · OWNER ANALYTICS</p>
        <h1>{access.signedIn ? '这个账号没有后台权限' : '查看网站使用情况'}</h1>
        <p>
          {access.signedIn
            ? '请使用网站所有者的 ChatGPT 账号登录。'
            : '使用网站所有者的 ChatGPT 账号登录后，即可查看访客和功能使用统计。'}
        </p>
        <a
          className="button primary"
          target="_top"
          href={
            access.signedIn
              ? chatGPTSignOutPath('/admin')
              : chatGPTSignInPath('/admin')
          }
        >
          {access.signedIn ? '退出并切换账号' : '使用 ChatGPT 登录'}
        </a>
        <a className="back" href="/">
          ← 返回 ConnectKon
        </a>
      </main>
    );
  return <AnalyticsDashboard />;
}
