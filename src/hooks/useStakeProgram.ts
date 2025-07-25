import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, Keypair, Transaction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getProgram, getPdaAddress, StakeAccount } from '@/lib/anchor';
import { useToast } from '@/hooks/use-toast';

function parsePrivateKeyFromEnv(envKey: string | undefined): Uint8Array | null {
  if (!envKey) return null;
  try {
    // Try to parse as JSON array string or comma-separated string
    if (envKey.startsWith('[')) {
      return new Uint8Array(JSON.parse(envKey));
    } else {
      return new Uint8Array(envKey.split(',').map(Number));
    }
  } catch (e) {
    console.error('Failed to parse VITE_POINTS_ACCOUNT_PRIVATE_KEY:', e);
    return null;
  }
}

// 100000 points = 1 SOL
const POINTS_PER_SOL = 100000;

export const useStakeProgram = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, wallet } = useWallet();
  const { toast } = useToast();
  
  const [stakeAccount, setStakeAccount] = useState<StakeAccount | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [calculatedPoints, setCalculatedPoints] = useState<number>(0);

  // Parse the private key for the points account from the environment variable
  const pointsAccountKeypair = useMemo(() => {
    const arr = parsePrivateKeyFromEnv(import.meta.env.VITE_POINTS_ACCOUNT_PRIVATE_KEY);
    if (!arr) return null;
    try {
      return Keypair.fromSecretKey(arr);
    } catch (e) {
      console.error('Failed to create Keypair from secret key:', e);
      return null;
    }
  }, []);

  const provider = useMemo(() => {
    if (!wallet || !publicKey) return null;
    return new AnchorProvider(
      connection,
      wallet.adapter as any,
      { commitment: 'confirmed' }
    );
  }, [connection, wallet, publicKey]);

  const program = useMemo(() => {
    if (!provider) return null;
    return getProgram(provider);
  }, [provider]);

  const [pdaAccount, bump] = useMemo(() => {
    if (!publicKey) return [null, 0];
    return getPdaAddress(publicKey);
  }, [publicKey]);

  // Helper to calculate points based on staked amount and time elapsed
  // 10000 points = 1 SOL, so 1 point = 0.0001 SOL
  // We'll keep the points as integer, not multiplied by 1_000_000
  const calculatePoints = (stakedAmount: number, lastUpdatedTime: number, totalPoints: number) => {
    if (!stakedAmount || !lastUpdatedTime) return totalPoints;
    const now = Math.floor(Date.now() / 1000);
    const timeElapsed = now - lastUpdatedTime;
    const pointsEarned = Math.floor((stakedAmount * timeElapsed) / LAMPORTS_PER_SOL);
    return totalPoints + pointsEarned;
  };

  const fetchStakeAccount = useCallback(async () => {
    if (!connection || !pdaAccount || !publicKey || !program) return;
    
    setRefreshing(true);
    try {
      const accountInfo = await connection.getAccountInfo(pdaAccount);
      if (accountInfo && accountInfo.data && accountInfo.data.length > 0) {
        const data = accountInfo.data;
        if (data.length >= 8 + 32 + 8 + 8 + 8 + 1) {
          let offset = 8; // Skip discriminator
          
          // Owner pubkey (32 bytes)
          const ownerBytes = data.slice(offset, offset + 32);
          const owner = new PublicKey(ownerBytes);
          offset += 32;
          
          // Staked amount (8 bytes, little endian u64)
          const stakedAmountBytes = data.slice(offset, offset + 8);
          const stakedAmount = new BN(stakedAmountBytes, 'le').toNumber();
          offset += 8;
          
          // Total points (8 bytes, little endian u64)
          const totalPointsBytes = data.slice(offset, offset + 8);
          const totalPoints = new BN(totalPointsBytes, 'le').toNumber();
          offset += 8;
          
          // Last updated time (8 bytes, little endian u64)
          const lastUpdatedTimeBytes = data.slice(offset, offset + 8);
          const lastUpdatedTime = new BN(lastUpdatedTimeBytes, 'le').toNumber();
          offset += 8;
          
          // Bump (1 byte)
          const bump = data[offset];
          
          // Calculate claimable points including unclaimed points since last update
          const now = Math.floor(Date.now() / 1000);
          const timeElapsed = now - lastUpdatedTime;
          let pointsEarned = 0;
          if (stakedAmount > 0 && timeElapsed > 0) {
            pointsEarned = Math.floor((stakedAmount * timeElapsed) / LAMPORTS_PER_SOL);
          }
          const totalClaimablePoints = totalPoints + pointsEarned;

          setCalculatedPoints(totalClaimablePoints);

          console.log('Stake Account Data:', {
            owner: owner.toString(),
            stakedAmount: stakedAmount / LAMPORTS_PER_SOL,
            totalPoints,
            lastUpdatedTime: new Date(lastUpdatedTime * 1000),
            currentTime: new Date(),
            timeElapsed: (Date.now() / 1000) - lastUpdatedTime,
            bump,
            pointsEarned,
            totalClaimablePoints,
          });
          
          setStakeAccount({
            owner,
            stakedAmount,
            totalPoints,
            lastUpdatedTime,
            bump,
          });
        } else {
          setStakeAccount(null);
          setCalculatedPoints(0);
        }
      } else {
        setStakeAccount(null);
        setCalculatedPoints(0);
      }
    } catch (error) {
      console.log('Account not found or not initialized');
      setStakeAccount(null);
      setCalculatedPoints(0);
    } finally {
      setRefreshing(false);
    }
  }, [connection, pdaAccount, publicKey, program]);

  const fetchWalletBalance = useCallback(async () => {
    if (!connection || !publicKey) return;
    
    try {
      const balance = await connection.getBalance(publicKey);
      setWalletBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.log('Failed to fetch wallet balance:', error);
      setWalletBalance(0);
    }
  }, [connection, publicKey]);

  const createPdaAccount = useCallback(async () => {
    if (!program || !publicKey || !pdaAccount) return;
    
    setLoading(true);
    try {
      // Always get a fresh blockhash for each request
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      const tx = await program.methods
        .createPdaAccount()
        .accounts({
          payer: publicKey,
          pdaAccount: pdaAccount,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;

      const signedTx = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature: signedTx, blockhash, lastValidBlockHeight }, 'confirmed');

      toast({
        title: "Account Created",
        description: "Your staking account has been created successfully!",
      });
      
      await fetchStakeAccount();
      await fetchWalletBalance();
    } catch (error: any) {
      let errorMsg = error.message || "Failed to create account";
      if (
        errorMsg.includes("This transaction has already been processed") ||
        errorMsg.includes("Transaction simulation failed: This transaction has already been processed")
      ) {
        errorMsg = "Please try again. A new blockhash is required for each request.";
      }
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [program, publicKey, pdaAccount, toast, fetchStakeAccount, fetchWalletBalance, connection, sendTransaction]);

  const stake = useCallback(async (amount: number) => {
    if (!program || !publicKey || !pdaAccount || amount <= 0) return;
    
    setLoading(true);
    try {
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
      // Always get a fresh blockhash for each request
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      const tx = await program.methods
        .stake(new BN(lamports))
        .accounts({
          user: publicKey,
          pdaAccount: pdaAccount,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;

      const signedTx = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature: signedTx, blockhash, lastValidBlockHeight }, 'confirmed');

      toast({
        title: "Staked Successfully",
        description: `Staked ${amount} SOL successfully!`,
      });
      
      await fetchStakeAccount();
      await fetchWalletBalance();
    } catch (error: any) {
      let errorMsg = error.message || "Failed to stake";
      if (
        errorMsg.includes("This transaction has already been processed") ||
        errorMsg.includes("Transaction simulation failed: This transaction has already been processed")
      ) {
        errorMsg = "Please try again. A new blockhash is required for each request.";
      }
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [program, publicKey, pdaAccount, toast, fetchStakeAccount, fetchWalletBalance, connection, sendTransaction]);

  const unstake = useCallback(async (amount: number) => {
    if (!program || !publicKey || !pdaAccount || amount <= 0) return;
    
    setLoading(true);
    try {
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
      // Always get a fresh blockhash for each request
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      const tx = await program.methods
        .unstake(new BN(lamports))
        .accounts({
          user: publicKey,
          pdaAccount: pdaAccount,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;

      const signedTx = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature: signedTx, blockhash, lastValidBlockHeight }, 'confirmed');

      toast({
        title: "Unstaked Successfully",
        description: `Unstaked ${amount} SOL successfully!`,
      });
      
      await fetchStakeAccount();
      await fetchWalletBalance();
    } catch (error: any) {
      let errorMsg = error.message || "Failed to unstake";
      if (
        errorMsg.includes("This transaction has already been processed") ||
        errorMsg.includes("Transaction simulation failed: This transaction has already been processed")
      ) {
        errorMsg = "Please try again. A new blockhash is required for each request.";
      }
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [program, publicKey, pdaAccount, toast, fetchStakeAccount, fetchWalletBalance, connection, sendTransaction]);

  // Modified claimPoints to transfer SOL from the points account to the user
  const claimPoints = useCallback(async () => {
    if (!program || !publicKey || !pdaAccount) return;
    if (!pointsAccountKeypair) {
      toast({
        title: "Error",
        description: "Points account private key not configured.",
        variant: "destructive",
      });
      return;
    }

    // Calculate how many points can be claimed as SOL
    // 100000 points = 1 SOL
    // calculatedPoints is in "points" (integer)
    const points = Math.floor(calculatedPoints);

    if (points < 50000) {
      toast({
        title: "Error",
        description: `You need at least 50000 points to claim.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Call the on-chain claimPoints to update the user's points state
      // Always get a fresh blockhash for each request
      const { blockhash: claimBlockhash, lastValidBlockHeight: claimLastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      const claimTx = await program.methods
        .claimPoints()
        .accounts({
          user: publicKey,
          pdaAccount: pdaAccount,
        })
        .transaction();

      claimTx.recentBlockhash = claimBlockhash;
      claimTx.feePayer = publicKey;

      const claimSignature = await sendTransaction(claimTx, connection);
      await connection.confirmTransaction({ signature: claimSignature, blockhash: claimBlockhash, lastValidBlockHeight: claimLastValidBlockHeight }, 'confirmed');

      // 2. Calculate how many points can be claimed as SOL
      const solToClaim = Math.floor(points / POINTS_PER_SOL); // integer SOL to claim

      if (solToClaim > 0) {
        // 3. Transfer SOL from the points account to the user
        const lamportsToSend = solToClaim * LAMPORTS_PER_SOL;
        // Always get a fresh blockhash for each transfer
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

        const transaction = new Transaction({
          recentBlockhash: blockhash,
          feePayer: pointsAccountKeypair.publicKey, // Important!
        }).add(
          SystemProgram.transfer({
            fromPubkey: pointsAccountKeypair.publicKey,
            toPubkey: publicKey,
            lamports: lamportsToSend,
          })
        );
        
        // Sign and send manually
        transaction.sign(pointsAccountKeypair);
        
        const rawTx = transaction.serialize();
        
        const signature = await connection.sendRawTransaction(rawTx, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        });
        
        await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
        
        toast({
          title: "Points Claimed",
          description: `Claimed ${solToClaim} SOL for ${solToClaim * POINTS_PER_SOL} points successfully!`,
        });
      } else {
        toast({
          title: "Error",
          description: `You need at least 100000 points to claim 1 SOL.`,
          variant: "destructive",
        });
        return;
      }
      await fetchStakeAccount();
      await fetchWalletBalance();
    } catch (error: any) {
      let errorMsg = error.message || "Failed to claim points";
      if (
        errorMsg.includes("This transaction has already been processed") ||
        errorMsg.includes("Transaction simulation failed: This transaction has already been processed")
      ) {
        errorMsg = "Please try again. A new blockhash is required for each request.";
      }
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [program, publicKey, pdaAccount, toast, calculatedPoints, fetchStakeAccount, fetchWalletBalance, connection, pointsAccountKeypair]);

  useEffect(() => {
    fetchStakeAccount();
    fetchWalletBalance();
    // Set up an interval to update points in real time (every 30 seconds)
    const interval = setInterval(() => {
      if (stakeAccount) {
        const { stakedAmount, lastUpdatedTime, totalPoints } = stakeAccount;
        const now = Math.floor(Date.now() / 1000);
        const timeElapsed = now - lastUpdatedTime;
        let pointsEarned = 0;
        if (stakedAmount > 0 && timeElapsed > 0) {
          pointsEarned = Math.floor((stakedAmount * timeElapsed) / LAMPORTS_PER_SOL);
        }
        setCalculatedPoints(totalPoints + pointsEarned);
      }
    }, 30000);

    // Set up an interval to refresh points from the backend every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchStakeAccount();
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(refreshInterval);
    };
  }, [fetchStakeAccount, fetchWalletBalance, ]);

  const stakedSOL = stakeAccount ? stakeAccount.stakedAmount / LAMPORTS_PER_SOL : 0;
  const claimablePoints = Math.floor(calculatedPoints);
  const isAccountInitialized = !!stakeAccount;

  return {
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
  };
};


