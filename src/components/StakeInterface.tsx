import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useStakeProgram } from '@/hooks/useStakeProgram';
import { useWallet } from '@solana/wallet-adapter-react';
import { Loader2, Coins, TrendingUp, Gift, Zap, Wallet } from 'lucide-react';

export const StakeInterface = () => {
  const { connected } = useWallet();
  const {
    stakeAccount,
    walletBalance,
    stakedSOL,
    claimablePoints,
    isAccountInitialized,
    loading,
    refreshing,
    createPdaAccount,
    stake,
    unstake,
    claimPoints,
    fetchStakeAccount,
    fetchWalletBalance,
  } = useStakeProgram();

  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');

  if (!connected) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-card/50 backdrop-blur-sm border-border/50 shadow-card">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Zap className="h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-2xl mb-2 text-center">Connect Your Wallet</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Connect your Solana wallet to start staking and earning points
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  if (!isAccountInitialized) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-card/50 backdrop-blur-sm border-border/50 shadow-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
            Initialize Your Staking Account
          </CardTitle>
          <CardDescription>
            Create your staking account to start earning points
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="p-6 rounded-lg bg-muted/50 border border-border/50">
              <h3 className="font-semibold mb-2">Staking Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Earn <span className="text-primary font-semibold">1000 points per day</span> for every 1 SOL staked
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                100000 points = 1 SOL equivalent
              </p>
            </div>
            <Button 
              onClick={createPdaAccount}
              disabled={loading}
              className="w-full bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Create Staking Account
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Staked SOL</p>
                <p className="text-2xl font-bold text-foreground">
                  {stakedSOL.toFixed(4)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-solana-green" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Claimable Points</p>
                <p className="text-2xl font-bold text-foreground">
                  {claimablePoints.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-solana-purple" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Wallet Balance</p>
                <p className="text-2xl font-bold text-foreground">
                  {walletBalance.toFixed(4)} SOL
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Interface */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
                Solana Point Forge
              </CardTitle>
              <CardDescription>
                Stake SOL to earn points • 100000 points = 1 SOL
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="stake" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50">
              <TabsTrigger value="stake">Stake</TabsTrigger>
              <TabsTrigger value="unstake">Unstake</TabsTrigger>
              <TabsTrigger value="claim">Claim</TabsTrigger>
            </TabsList>

            <TabsContent value="stake" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="stake-amount">Amount (SOL)</Label>
                <Input
                  id="stake-amount"
                  type="number"
                  placeholder="0.00"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  className="bg-muted/50 border-border/50"
                />
              </div>
              <Button 
                onClick={() => stake(parseFloat(stakeAmount) || 0)}
                disabled={loading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                className="w-full bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Staking...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Stake SOL
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="unstake" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="unstake-amount">Amount (SOL)</Label>
                <Input
                  id="unstake-amount"
                  type="number"
                  placeholder="0.00"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  max={stakedSOL}
                  className="bg-muted/50 border-border/50"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum: {stakedSOL.toFixed(4)} SOL
                </p>
              </div>
              <Button 
                onClick={() => unstake(parseFloat(unstakeAmount) || 0)}
                disabled={loading || !unstakeAmount || parseFloat(unstakeAmount) <= 0 || parseFloat(unstakeAmount) > stakedSOL}
                variant="secondary"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unstaking...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4 rotate-180" />
                    Unstake SOL
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="claim" className="space-y-4 mt-6">
              <div className="p-6 rounded-lg bg-muted/50 border border-border/50 text-center">
                <h3 className="font-semibold mb-2">Ready to Claim</h3>
                <p className="text-3xl font-bold text-primary mb-2">
                  {claimablePoints.toLocaleString()} Points
                </p>
                <p className="text-sm text-muted-foreground">
                  Equivalent to {(claimablePoints / 100000).toFixed(4)} SOL
                </p>
              </div>
              <Button 
                onClick={claimPoints}
                disabled={loading || claimablePoints === 0}
                className="w-full bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-4 w-4" />
                    Claim Points
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Last updated: {refreshing ? 'Refreshing...' : 'Just now'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                fetchStakeAccount();
                fetchWalletBalance();
              }}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};