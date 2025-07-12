import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import { TokenLaunchpad } from './components/TokenLaunchpad';


export default function App() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
            <ConnectionProvider endpoint="https://api.devnet.solana.com">
                <WalletProvider wallets={[]} autoConnect>
                    <WalletModalProvider>
                        <div className="container mx-auto px-4 py-8">
                            <div className="flex justify-between items-center mb-8">
                                <div className="text-2xl font-bold text-gray-800">
                                    Solana Token Factory
                                </div>
                                <div className="flex space-x-4">
                                    <WalletMultiButton className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-200" />
                                    <WalletDisconnectButton className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-200" />
                                </div>
                            </div>
                            <div className="max-w-4xl mx-auto">
                                <TokenLaunchpad />
                            </div>
                        </div>
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </div>
    )
}
