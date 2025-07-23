import {
    ConnectionProvider,
    WalletProvider,
  } from "@solana/wallet-adapter-react";
  import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton,
  } from "@solana/wallet-adapter-react-ui";
  import "@solana/wallet-adapter-react-ui/styles.css";
  import { TokenLaunchpad } from "./components/TokenLaunchpad";
  import { clusterApiUrl } from "@solana/web3.js";
  
  export default function App() {
    return (
      <ConnectionProvider endpoint={clusterApiUrl("devnet")}>
        <WalletProvider wallets={[]} autoConnect>
          <WalletModalProvider>
            <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black text-white">
              {/* Top Bar */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 shadow-lg backdrop-blur-md">
                <h1 className="text-2xl font-bold text-purple-300">Solana Token Launcher</h1>
                <div className="flex space-x-4">
                  <WalletMultiButton className="!bg-purple-700 hover:!bg-purple-800 !text-white !rounded-lg !px-4 !py-2 !font-medium" />
                  <WalletDisconnectButton className="!bg-red-700 hover:!bg-red-800 !text-white !rounded-lg !px-4 !py-2 !font-medium" />
                </div>
              </div>
  
              {/* Launchpad */}
              <TokenLaunchpad />
            </div>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    );
  }
  