'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Users,
  UserRoundCheck,
  Activity,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  analyticsDay,
  eventLabels,
  usageEventNames,
  type UsageSummary,
} from '@/lib/analytics-contract';
export default function AnalyticsDashboard() {
  const [data, setData] = useState<UsageSummary | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(true);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/analytics/summary', {
        cache: 'no-store',
        signal,
      });
      if (response.status === 401 || response.status === 403) {
        setData(null);
        throw Error('登录已过期或当前账号没有权限，请刷新页面重新登录。');
      }
      if (!response.ok) throw Error('暂时无法读取统计，请稍后重试。');
      setData(await response.json());
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    } finally {
      if (!signal?.aborted) setBusy(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);
  const days = Array.from({ length: 30 }, (_, i) => {
    const day = analyticsDay(
      Date.parse(data?.updatedAt || new Date().toISOString()) -
        (29 - i) * 86400_000,
    );
    return {
      day,
      visitors: 0,
      visits: 0,
      ...data?.daily.find((d) => d.day === day),
    };
  });
  const cards = [
    {
      label: '今日访客',
      value: data?.today,
      sub: '今天访问过的浏览器',
      Icon: Users,
    },
    {
      label: '近 30 天访客',
      value: data?.visitors,
      sub: '期间内去重的浏览器',
      Icon: CalendarDays,
    },
    {
      label: '近 30 天访问次数',
      value: data?.visits,
      sub: '30 分钟无操作后算新访问',
      Icon: Activity,
    },
    {
      label: '近 30 天回访人数',
      value: data?.returning,
      sub: '曾在不同日期再次访问',
      Icon: UserRoundCheck,
    },
  ];
  return (
    <main className="analytics-dashboard" lang="zh-CN">
      <a className="back" href="/">
        <ArrowLeft size={16} />
        返回 ConnectKon
      </a>
      <header className="analytics-heading">
        <div>
          <p className="eyebrow">CONNECTKON · OWNER ANALYTICS</p>
          <h1>看看你的网站，有多少人在用。</h1>
          <p className="muted">访客趋势与功能使用 · 近 30 天</p>
        </div>
        <button onClick={() => void refresh()} disabled={busy}>
          <RefreshCw size={16} className={busy ? 'analytics-spinning' : ''} />
          {busy ? '更新中…' : '刷新数据'}
        </button>
      </header>
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}
      <div className="analytics-cards">
        {cards.map(({ label, value, sub, Icon }) => (
          <section className="analytics-card" key={label}>
            <div>
              <span>{label}</span>
              <Icon size={19} />
            </div>
            <strong>
              {value === undefined ? '—' : value.toLocaleString()}
            </strong>
            <p>{sub}</p>
          </section>
        ))}
      </div>
      <section className="analytics-panel">
        <div className="analytics-section-heading">
          <h2>每天有多少人来？</h2>
          <span>每日独立访客</span>
        </div>
        <ChartContainer
          className="analytics-chart"
          config={{ visitors: { label: '访客', color: '#91a8fb' } }}
        >
          <BarChart
            data={days}
            accessibilityLayer
            margin={{ top: 15, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="#303641" />
            <XAxis
              dataKey="day"
              tickFormatter={(v) => v.slice(5)}
              minTickGap={28}
              tickLine={false}
              axisLine={false}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="visitors"
              fill="var(--color-visitors)"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ChartContainer>
        {data?.visitors === 0 && (
          <p className="analytics-empty">
            还没有访客数据。分享网站链接，真实访问会开始出现在这里。
          </p>
        )}
        <details className="analytics-details">
          <summary>查看每日明细</summary>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日期</TableHead>
                <TableHead>独立访客</TableHead>
                <TableHead>访问次数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {days
                .slice()
                .reverse()
                .map((d) => (
                  <TableRow key={d.day}>
                    <TableCell>{d.day}</TableCell>
                    <TableCell>{d.visitors}</TableCell>
                    <TableCell>{d.visits}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </details>
      </section>
      <div className="analytics-bottom">
        <section className="analytics-panel">
          <div className="analytics-section-heading">
            <h2>大家在使用哪些功能？</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>功能</TableHead>
                <TableHead>操作次数</TableHead>
                <TableHead>使用人数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageEventNames
                .filter((e) => e !== 'visit')
                .map((event) => {
                  const row = data?.features.find((f) => f.event === event);
                  return (
                    <TableRow key={event}>
                      <TableCell>{eventLabels[event]}</TableCell>
                      <TableCell>{data ? row?.count || 0 : '—'}</TableCell>
                      <TableCell>{data ? row?.visitors || 0 : '—'}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </section>
        <section className="analytics-panel analytics-explainer">
          <ShieldCheck size={22} />
          <h2>只看使用情况，保护人脉隐私。</h2>
          <p>
            统计使用随机浏览器标识，不收集姓名、联系人资料、LinkedIn
            链接、笔记或对话内容，也不存储 IP 地址。
          </p>
          <p>
            浏览器标识和事件最多保留 90
            天。访客可在设置中关闭统计；开启“不跟踪”或全局隐私控制的浏览器也不会发送事件。
          </p>
          <p>
            人数是浏览器层面的估算：换设备、清除浏览器数据或无痕访问可能重复计数。回访表示在保留期内，至少两个不同日期有访问，且最近一次在近
            30 天内。你登录所有者账号后的操作不计入。
          </p>
        </section>
      </div>
      <footer className="analytics-footer">
        <span>
          按曼谷时间（UTC+7）统计 ·{' '}
          {data?.firstEvent
            ? `最早保留记录：${data.firstEvent}`
            : '上线后开始累计，不补录历史访问'}
        </span>
        <span role="status">
          {data
            ? `更新于 ${new Date(data.updatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Bangkok' })}`
            : '等待统计数据'}
        </span>
      </footer>
    </main>
  );
}
