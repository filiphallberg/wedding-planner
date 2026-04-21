import { CloudApp } from './app/CloudApp';
import { LocalApp } from './app/LocalApp';

export default function App() {
  const useClerk = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  if (useClerk) {
    return <CloudApp />;
  }
  return <LocalApp />;
}
