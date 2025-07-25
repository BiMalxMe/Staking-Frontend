import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { cn } from '@/lib/utils';

export const WalletButton = () => {
  return (
    <WalletMultiButton 
      className={cn(
        "!bg-gradient-primary hover:!bg-gradient-primary/90",
        "!border-primary/20 !text-primary-foreground",
        "!font-medium !transition-all !duration-300",
        "!rounded-lg !shadow-glow hover:!shadow-glow/80",
        "!px-6 !py-3"
      )}
    />
  );
};