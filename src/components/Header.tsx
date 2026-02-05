import { memo } from 'react';
import { Shield } from 'lucide-react';

const Header = memo(() => {
  return (
    <header className="py-6 px-4">
      <div className="flex items-center justify-center gap-3">
        <div className="relative">
          <Shield className="w-10 h-10 text-primary" />
          <div className="absolute inset-0 w-10 h-10 bg-primary/20 blur-xl rounded-full" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold">
            <span className="gradient-text">VoiceGuard</span>
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            AI Voice Detection & Scam Protection
          </p>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
