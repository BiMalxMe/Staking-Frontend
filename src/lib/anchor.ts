import { AnchorProvider, Program, web3 } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey("6wjCHbb4fJivBCesGtUmPEdHRVKaQFa5v1KDZCXC9TGo");

export const IDL = {
  "address": "6wjCHbb4fJivBCesGtUmPEdHRVKaQFa5v1KDZCXC9TGo",
  "metadata": {
    "name": "stake_program",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "claim_points",
      "discriminator": [106, 26, 99, 252, 9, 196, 78, 172],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "pda_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [117, 115, 101, 114, 49]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "create_pda_account",
      "discriminator": [236, 59, 195, 238, 228, 119, 205, 35],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "pda_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [117, 115, 101, 114, 49]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "get_points",
      "discriminator": [175, 65, 116, 251, 176, 33, 167, 225],
      "accounts": [
        {
          "name": "user",
          "signer": true
        },
        {
          "name": "pda_account",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [117, 115, 101, 114, 49]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "stake",
      "discriminator": [206, 176, 202, 18, 200, 209, 179, 108],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "pda_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [117, 115, 101, 114, 49]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unstake",
      "discriminator": [90, 95, 107, 42, 205, 124, 50, 225],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "pda_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [117, 115, 101, 114, 49]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "StakeAccount",
      "discriminator": [80, 158, 67, 124, 50, 189, 192, 255]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidAmount",
      "msg": "Amount must be greater than 0"
    },
    {
      "code": 6001,
      "name": "InsufficientStake",
      "msg": "Insufficient staked amount"
    },
    {
      "code": 6002,
      "name": "Unauthorized",
      "msg": "Unauthorized access"
    },
    {
      "code": 6003,
      "name": "Overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6004,
      "name": "Underflow",
      "msg": "Arithmetic underflow"
    },
    {
      "code": 6005,
      "name": "InvalidTimestamp",
      "msg": "Invalid timestamp"
    }
  ],
  "types": [
    {
      "name": "StakeAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "staked_amount",
            "type": "u64"
          },
          {
            "name": "total_points",
            "type": "u64"
          },
          {
            "name": "last_updated_time",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};

export const CONNECTION_URL =  import.meta.env.VITE_HELIUS_DEVNET
export const LAMPORTS_PER_SOL = web3.LAMPORTS_PER_SOL;

export interface StakeAccount {
  owner: PublicKey;
  stakedAmount: number;
  totalPoints: number;
  lastUpdatedTime: number;
  bump: number;
}

export function getProgram(provider: AnchorProvider) {
  return new Program(IDL as any, provider);
}

export function getPdaAddress(userPublicKey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user1"), userPublicKey.toBuffer()],
    PROGRAM_ID
  );
}