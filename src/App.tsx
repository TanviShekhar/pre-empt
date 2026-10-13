import { useEffect } from 'react';
import { useStore } from './store';
import { AgentHeader, Footer, MobileTabs, Sidebar, Toasts, TopBar } from './components/Layout';
import { Overview } from './screens/Overview';
import { ReviewQueue } from './screens/ReviewQueue';
import { OrderDetail } from './screens/OrderDetail';
import { SoftPings } from './screens/SoftPings';
import { Controls } from './screens/Controls';
import { AuditLog } from './screens/AuditLog';
import { Tour } from './components/Tour';

export default function App() {
  const { state } = useStore();

  useEffect(() => {
    document.getElementById('main')?.scrollTo({ top: 0 });
  }, [state.screen, state.orderId]);

  return (
    <div className="flex h-screen flex-col bg-page font-sans text-slate-900">
      <div className="shrink-0">
        <TopBar />
        <AgentHeader />
        <MobileTabs />
      </div>
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main id="main" className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-8 sm:py-7">
          <div className="max-w-[1240px]">
            <Screen key={state.screen === 'order' ? `order-${state.orderId}` : state.screen} />
            <Footer />
          </div>
        </main>
      </div>
      <Toasts />
      <Tour />
    </div>
  );
}

function Screen() {
  const { state } = useStore();
  switch (state.screen) {
    case 'overview':
      return <Overview />;
    case 'queue':
      return <ReviewQueue />;
    case 'order':
      return <OrderDetail />;
    case 'pings':
      return <SoftPings />;
    case 'controls':
      return <Controls />;
    case 'audit':
      return <AuditLog />;
  }
}
