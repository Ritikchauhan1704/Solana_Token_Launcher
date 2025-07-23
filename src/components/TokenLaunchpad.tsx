import {
  createAssociatedTokenAccountInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  ExtensionType,
  getAssociatedTokenAddressSync,
  getMintLen,
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { useState } from "react";
import { z } from "zod";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";

// Schema validation using Zod
const TokenSchema = z.object({
  tokenName: z.string().min(1, "Token name is required"),
  tokenSymbol: z.string().min(1, "Token symbol is required"),
  imageUrl: z.url("Must be a valid URL"),
  initialSupply: z.string().refine((val) => /^\d+$/.test(val), {
    message: "Initial supply must be a number",
  }),
});

export function TokenLaunchpad() {
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [initialSupply, setInitialSupply] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");

  const wallet = useWallet();
  const { connection } = useConnection();

  const createToken = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.publicKey) {
      setStatus("Please connect your wallet first");
      return;
    }

    const result = TokenSchema.safeParse({
      tokenName,
      tokenSymbol,
      imageUrl,
      initialSupply,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);
    setStatus("Creating token...");

    try {
      // Check wallet balance first
      const balance = await connection.getBalance(wallet.publicKey);
      if (balance < 10000000) { // 0.01 SOL minimum
        setStatus("Error: Insufficient SOL balance. Need at least 0.01 SOL for transaction fees.");
        return;
      }

      const mintKeyPair = Keypair.generate();
      const supply = parseInt(initialSupply) * Math.pow(10, 9); // Convert to lamports (9 decimals)

      const metadata = {
        mint: mintKeyPair.publicKey,
        name: tokenName,
        symbol: tokenSymbol,
        uri: imageUrl,
        additionalMetadata: [],
      };

      const mintLen = getMintLen([ExtensionType.MetadataPointer]);
      const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

      const lamports = await connection.getMinimumBalanceForRentExemption(
        mintLen + metadataLen
      );

      setStatus("Simulating transaction...");

      // Create all instructions first
      const createAccountIx = SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mintKeyPair.publicKey,
        space: mintLen + metadataLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      });

      const initMetadataPointerIx = createInitializeMetadataPointerInstruction(
        mintKeyPair.publicKey,
        wallet.publicKey,
        mintKeyPair.publicKey,
        TOKEN_2022_PROGRAM_ID
      );

      const initMintIx = createInitializeMintInstruction(
        mintKeyPair.publicKey,
        9,
        wallet.publicKey,
        null,
        TOKEN_2022_PROGRAM_ID
      );

      const initMetadataIx = createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        mint: mintKeyPair.publicKey,
        metadata: mintKeyPair.publicKey,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        mintAuthority: wallet.publicKey,
        updateAuthority: wallet.publicKey,
      });

      // Get fresh blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');

      // Transaction 1: Create mint account with metadata
      setStatus("Creating mint account...");
      const transaction1 = new Transaction({
        feePayer: wallet.publicKey,
        recentBlockhash: blockhash,
      });
      
      transaction1.add(createAccountIx, initMetadataPointerIx, initMintIx, initMetadataIx);
      transaction1.partialSign(mintKeyPair);

      // Simulate transaction first
      try {
        const simulation = await connection.simulateTransaction(transaction1);
        if (simulation.value.err) {
          throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }
      } catch (simError: any) {
        throw new Error(`Transaction simulation failed: ${simError.message}`);
      }

      const signature1 = await wallet.sendTransaction(transaction1, connection, {
        skipPreflight: false,
        preflightCommitment: 'processed'
      });
      
      await connection.confirmTransaction({
        signature: signature1,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      console.log("Token mint created at", mintKeyPair.publicKey.toBase58());
      
      // Wait a bit before next transaction
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Transaction 2: Create associated token account and mint tokens in one transaction
      setStatus("Creating token account and minting...");
      
      const associatedToken = getAssociatedTokenAddressSync(
        mintKeyPair.publicKey,
        wallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      // Check if ATA already exists
      const ataInfo = await connection.getAccountInfo(associatedToken);
      
      const { blockhash: blockhash2, lastValidBlockHeight: lastValidBlockHeight2 } = 
        await connection.getLatestBlockhash('finalized');

      const transaction2 = new Transaction({
        feePayer: wallet.publicKey,
        recentBlockhash: blockhash2,
      });

      // Only add create ATA instruction if it doesn't exist
      if (!ataInfo) {
        transaction2.add(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            associatedToken,
            wallet.publicKey,
            mintKeyPair.publicKey,
            TOKEN_2022_PROGRAM_ID
          )
        );
      }

      // Add mint instruction
      transaction2.add(
        createMintToInstruction(
          mintKeyPair.publicKey,
          associatedToken,
          wallet.publicKey,
          supply,
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );

      // Simulate second transaction
      try {
        const simulation2 = await connection.simulateTransaction(transaction2);
        if (simulation2.value.err) {
          throw new Error(`Mint simulation failed: ${JSON.stringify(simulation2.value.err)}`);
        }
      } catch (simError: any) {
        throw new Error(`Mint transaction simulation failed: ${simError.message}`);
      }

      const signature2 = await wallet.sendTransaction(transaction2, connection, {
        skipPreflight: false,
        preflightCommitment: 'processed'
      });
      
      await connection.confirmTransaction({
        signature: signature2,
        blockhash: blockhash2,
        lastValidBlockHeight: lastValidBlockHeight2
      }, 'confirmed');

      setStatus(`Token created successfully! Mint: ${mintKeyPair.publicKey.toBase58()}`);
      console.log("Token creation completed successfully");
      console.log("Mint address:", mintKeyPair.publicKey.toBase58());
      console.log("Associated token account:", associatedToken.toBase58());

    } catch (error: any) {
      console.error("Error creating token:", error);
      
      // More specific error handling
      let errorMessage = "Failed to create token";
      if (error.message.includes("insufficient")) {
        errorMessage = "Insufficient SOL for transaction fees";
      } else if (error.message.includes("blockhash")) {
        errorMessage = "Transaction expired, please try again";
      } else if (error.message.includes("simulation")) {
        errorMessage = `Transaction failed validation: ${error.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setStatus(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-6 py-3 rounded-xl border ${
      errors[field]
        ? "border-red-500 ring-2 ring-red-400"
        : "border-purple-700 focus:ring-2 focus:ring-purple-400"
    } bg-purple-900 text-white focus:outline-none transition-all duration-200`;

  const labelClass = "block text-sm font-medium text-purple-300 mb-2";
  const errorTextClass = "text-red-400 text-sm mt-1 animate-pulse";

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black flex items-center justify-center px-4">
      <div className="bg-gradient-to-r from-purple-950/60 to-blue-950/60 backdrop-blur-md p-6 md:p-10 rounded-3xl shadow-2xl border border-white/10 w-full md:max-w-5xl flex flex-col md:flex-row md:gap-12 gap-8">
        {/* Left Side - Info */}
        <div className="flex-1 flex flex-col justify-center text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Token Launchpad
          </h1>
          <p className="text-purple-400 text-lg">
            Easily create your own SPL token on the Solana blockchain.
          </p>
          <p className="mt-6 text-sm text-white/70">
            Fill in the details to launch your token instantly. No coding required.
          </p>
          
          {/* Status Display */}
          {status && (
            <div className={`mt-4 p-3 rounded-lg ${
              status.includes('Error') 
                ? 'bg-red-900/50 text-red-300' 
                : status.includes('successfully')
                ? 'bg-green-900/50 text-green-300'
                : 'bg-blue-900/50 text-blue-300'
            }`}>
              <p className="text-sm">{status}</p>
            </div>
          )}
        </div>

        {/* Right Side - Form */}
        <form className="flex-1 space-y-5" onSubmit={createToken}>
          {/* Token Name */}
          <div>
            <label className={labelClass}>Token Name</label>
            <input
              type="text"
              placeholder="Enter token name"
              className={inputClass("tokenName")}
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              disabled={isLoading}
            />
            {errors.tokenName && (
              <p className={errorTextClass}>{errors.tokenName}</p>
            )}
          </div>

          {/* Token Symbol */}
          <div>
            <label className={labelClass}>Token Symbol</label>
            <input
              type="text"
              placeholder="Enter token symbol"
              className={inputClass("tokenSymbol")}
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              disabled={isLoading}
            />
            {errors.tokenSymbol && (
              <p className={errorTextClass}>{errors.tokenSymbol}</p>
            )}
          </div>

          {/* Image URL */}
          <div>
            <label className={labelClass}>Image URL</label>
            <input
              type="text"
              placeholder="Enter image URL"
              className={inputClass("imageUrl")}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={isLoading}
            />
            {errors.imageUrl && (
              <p className={errorTextClass}>{errors.imageUrl}</p>
            )}
          </div>

          {/* Initial Supply */}
          <div>
            <label className={labelClass}>Initial Supply</label>
            <input
              type="text"
              placeholder="Enter initial supply"
              className={inputClass("initialSupply")}
              value={initialSupply}
              onChange={(e) => setInitialSupply(e.target.value)}
              disabled={isLoading}
            />
            {errors.initialSupply && (
              <p className={errorTextClass}>{errors.initialSupply}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !wallet.publicKey}
            className={`w-full py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center group ${
              isLoading || !wallet.publicKey
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:cursor-pointer'
            } text-white`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <svg
                  className="w-6 h-6 mr-2 group-hover:rotate-90 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                {!wallet.publicKey ? 'Connect Wallet First' : 'Launch Token'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}