import { WalletButton } from '@/components/WalletButton';
import { StakeInterface } from '@/components/StakeInterface';
import { Zap, Stars, TrendingUp } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

const Index = () => {
  return (
    <div 
      className="min-h-screen bg-background relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.9), rgba(0,0,0,0.7)), url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-solana-purple/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-solana-green/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-6 border-b border-border/20 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-primary rounded-lg shadow-glow">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Sol Point Forge
            </h1>
            <p className="text-xs text-muted-foreground">Stake • Earn • Prosper</p>
          </div>
        </div>
        <WalletButton />
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent leading-tight">
            Forge Your Future
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Stake your SOL and watch your points multiply. 
            <span className="text-primary font-semibold"> 100000 points = 1 SOL</span> of rewards.
          </p>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
            <div className="p-6 rounded-lg bg-card/30 backdrop-blur-sm border border-border/30 shadow-card">
              <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Daily Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Earn 100000 points per day for every SOL staked
              </p>
            </div>
            
            <div className="p-6 rounded-lg bg-card/30 backdrop-blur-sm border border-border/30 shadow-card">
              <div className="p-3 bg-solana-green/10 rounded-full w-fit mx-auto mb-4">
                <Stars className="h-6 w-6 text-solana-green" />
              </div>
              <h3 className="font-semibold mb-2">Instant Claims</h3>
              <p className="text-sm text-muted-foreground">
                Claim your accumulated points anytime
              </p>
            </div>
            
            <div className="p-6 rounded-lg bg-card/30 backdrop-blur-sm border border-border/30 shadow-card">
              <div className="p-3 bg-solana-purple/10 rounded-full w-fit mx-auto mb-4">
                <Zap className="h-6 w-6 text-solana-purple" />
              </div>
              <h3 className="font-semibold mb-2">Flexible Staking</h3>
              <p className="text-sm text-muted-foreground">
                Stake and unstake your SOL whenever you want
              </p>
            </div>
          </div>
        </div>

        {/* Staking Interface */}
        <StakeInterface />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/20 mt-24 py-8 text-center backdrop-blur-sm">
        <p className="text-sm text-muted-foreground">
          Built on Solana et • Powered by Anchor Framework
        </p>
      </footer>
    </div>
  );
};

export default Index;
