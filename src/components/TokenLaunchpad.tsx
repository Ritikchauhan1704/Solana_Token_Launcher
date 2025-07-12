export function TokenLaunchpad() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-900 to-blue-900 flex items-center justify-center">
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/10 w-full max-w-md">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-3">🚀 Token Launchpad</h1>
                    <p className="text-purple-300 text-lg">Create your own SPL token on Solana</p>
                </div>
                
                <form className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-purple-300 mb-2">Token Name</label>
                        <input 
                            type="text" 
                            placeholder="Enter token name"
                            className="w-full px-6 py-3 rounded-xl border border-purple-700 bg-purple-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-purple-300 mb-2">Token Symbol</label>
                        <input 
                            type="text" 
                            placeholder="Enter token symbol"
                            className="w-full px-6 py-3 rounded-xl border border-purple-700 bg-purple-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-purple-300 mb-2">Image URL</label>
                        <input 
                            type="text" 
                            placeholder="Enter image URL"
                            className="w-full px-6 py-3 rounded-xl border border-purple-700 bg-purple-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-purple-300 mb-2">Initial Supply</label>
                        <input 
                            type="number" 
                            placeholder="Enter initial supply"
                            className="w-full px-6 py-3 rounded-xl border border-purple-700 bg-purple-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                        />
                    </div>
                    
                    <button 
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 px-6 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300 flex items-center justify-center group"
                    >
                        <svg className="w-6 h-6 mr-2 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Launch Token
                    </button>
                </form>
            </div>
        </div>
    )
}