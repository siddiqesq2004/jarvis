import { ChatInterface } from '@/components/ChatInterface';

export default function HomePage() {
  return (
    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
      <ChatInterface />
    </div>
  );
}
