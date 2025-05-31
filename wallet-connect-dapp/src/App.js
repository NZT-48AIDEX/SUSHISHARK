import React, { useMemo, useCallback, useState } from "react";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

require("@solana/wallet-adapter-react-ui/styles.css");

const ENDPOINT = clusterApiUrl("mainnet-beta");

function SignAndSend({ sessionCode }) {
  const { publicKey, signMessage } = useWallet();
  const [status, setStatus] = useState("");

  const handleSign = useCallback(async () => {
    if (!signMessage || !publicKey) return;
    const message = `SushiShark Wallet Connect\nSession: ${sessionCode}`;
    try {
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await signMessage(encodedMessage);
      // Send to backend API
      const res = await fetch("http://localhost:5000/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: sessionCode,
          address: publicKey.toBase58(),
          signature: Buffer.from(signature).toString("base64"),
        }),
      });
      if (res.ok) {
        setStatus("✅ Wallet connected! You can return to Telegram.");
      } else {
        setStatus("❌ Verification failed.");
      }
    } catch (e) {
      setStatus("❌ Error signing message.");
    }
  }, [signMessage, publicKey, sessionCode]);

  if (!publicKey) return null;
  return (
    <div>
      <button onClick={handleSign}>Sign & Connect</button>
      <div>{status}</div>
    </div>
  );
}

export default function App() {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  // You can pass the session code via URL param
  const sessionCode = new URLSearchParams(window.location.search).get("session");

  return (
    <ConnectionProvider endpoint={ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletMultiButton />
          {sessionCode && <SignAndSend sessionCode={sessionCode} />}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
} 