import { useState } from "react";
import { z } from "zod";

// Schema validation using Zod
const TokenSchema = z.object({
  tokenName: z.string().min(1, "Token name is required"),
  tokenSymbol: z.string().min(1, "Token symbol is required"),
  imageUrl: z.string().url("Must be a valid URL"),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
    console.log("Submitted:", { tokenName, tokenSymbol, imageUrl, initialSupply });
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
      <div className="bg-gradient-to-r from-purple-950/60 to-blue-950/60 backdrop-blur-md p-10 rounded-3xl shadow-2xl border border-white/10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Token Launchpad</h1>
          <p className="text-purple-400 text-lg">Create your own SPL token on Solana</p>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Token Name */}
          <div>
            <label className={labelClass}>Token Name</label>
            <input
              type="text"
              placeholder="Enter token name"
              className={inputClass("tokenName")}
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
            />
            {errors.tokenName && <p className={errorTextClass}>{errors.tokenName}</p>}
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
            />
            {errors.tokenSymbol && <p className={errorTextClass}>{errors.tokenSymbol}</p>}
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
            />
            {errors.imageUrl && <p className={errorTextClass}>{errors.imageUrl}</p>}
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
            />
            {errors.initialSupply && (
              <p className={errorTextClass}>{errors.initialSupply}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center group"
          >
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
            Launch Token
          </button>
        </form>
      </div>
    </div>
  );
}
