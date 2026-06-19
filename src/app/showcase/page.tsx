import type { Metadata } from 'next';
import { ShowcaseFrame } from './ShowcaseFrame';

export const metadata: Metadata = {
  title: 'StockCheck — มุมมองแท็บเล็ต',
  description: 'จำลองการใช้งาน StockCheck บนแท็บเล็ต/iPad',
};

/**
 * Public presentation wrapper. Renders the live app inside a tablet bezel via an
 * iframe (see ShowcaseFrame). The wrapper itself needs no auth — the framed app
 * self-authenticates, so a logged-out visitor sees the login inside the frame.
 * `/showcase` is excluded from route protection in `src/proxy.ts`.
 */
export default function ShowcasePage() {
  return <ShowcaseFrame />;
}
