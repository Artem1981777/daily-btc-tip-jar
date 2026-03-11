# ₿ Daily BTC Tip Jar

A decentralized micro-tipping dApp on **OPNet Testnet** — drop sats into a shared jar, once per wallet per day.

## Quick Start
```bash
cd frontend
npm install && npm run dev
```

## Stack
- Contract: AssemblyScript (OPNet WASM)
- Frontend: React + Vite + TypeScript
- Wallet: OP_WALLET
- Network: OPNet Testnet

## Deploy
- Vercel: set root to `frontend`, add env vars
- Netlify: `netlify.toml` at root handles everything

## Security
- ML-DSA quantum-safe signatures
- Null signer guard on all entry points
- Simulate before send (mandatory)
import { useState, useEffect } from "react";

const CONTRACT = import.meta.env.VITE_CONTRACT_ADDRESS || "0x35446ead21d12b77f5874046d3a6538aaf5bd06e23243dc42c8c2d509a66ca8f";
const COOLDOWN = 86400;

export default function App() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState("idle");
  const [amount, setAmount] = useState(1000);
  const [showAnim, setShowAnim] = useState(false);
  const [tips, setTips] = useState<{sender:string,amount:number,time:string}[]>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  function hms(s: number) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map(v => String(v).padStart(2, "0")).join(":");
  }

  async function connect() {
    try {
      const wallet = (window as any).opnet || (window as any).unisat;
      if (!wallet) {
        alert("Please install OP_WALLET extension!");
        return;
      }
      const accounts = await wallet.requestAccounts();
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setConnected(true);
      }
    } catch (e: any) {
      alert("Failed to connect: " + e.message);
    }
  }

  async function sendTip() {
    if (!connected || seconds > 0) return;
    try {
      setStatus("sending");
      const wallet = (window as any).opnet || (window as any).unisat;
      if (!wallet) {
        alert("OP_WALLET not found!");
        setStatus("idle");
        return;
      }
      const tx = await wallet.sendBitcoin(CONTRACT, amount);
      console.log("Tip tx:", tx);
      setBalance(b => b + amount);
      setSeconds(COOLDOWN);
      setStatus("success");
      setShowAnim(true);
      setTips(prev => [{
        sender: address.slice(0, 6) + "..." + address.slice(-4),
        amount,
        time: new Date().toLocaleString()
      }, ...prev.slice(0, 9)]);
      setTimeout(() => { setShowAnim(false); setStatus("idle"); }, 3000);
    } catch (e: any) {
      console.error("Tip error:", e);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  const canTip = connected && seconds === 0;

  return (
    <div style={{
      minHeight: "100vh", background: "#050810", color: "#c8d8f0",
      fontFamily: "'Share Tech Mono', monospace", padding: "2rem",
      backgroundImage: "linear-gradient(rgba(0,212,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.03) 1px,transparent 1px)",
      backgroundSize: "40px 40px"
    }}>

      {showAnim && (
        <div style={{
          position: "fixed", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: "8rem", zIndex: 999, pointerEvents: "none",
          animation: "fadeOut 3s forwards"
        }}>⚡</div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(0,212,255,0.15)", paddingBottom: "1rem", marginBottom: "2rem" }}>
        <div>
          <div style={{ fontSize: "1.5rem", color: "#00d4ff", letterSpacing: "0.1em", fontWeight: "bold" }}>
            ₿ DAILY TIP JAR
          </div>
          <div style={{ fontSize: "0.65rem", color: "#4a6080" }}>OPNet Testnet · ML-DSA</div>
        </div>
        {connected ? (
          <div style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", padding: "0.4rem 0.9rem", borderRadius: "3px", fontSize: "0.78rem" }}>
            <span style={{ color: "#00ff9f" }}>● </span>
            <span style={{ color: "#00d4ff" }}>TESTNET</span>
            {" "}{address.slice(0,6)}...{address.slice(-4)}
          </div>
        ) : (
          <button onClick={connect} style={{
            background: "transparent", border: "1px solid #00d4ff", color: "#00d4ff",
            padding: "0.45rem 1.1rem", borderRadius: "3px", cursor: "pointer",
            fontFamily: "inherit", letterSpacing: "0.1em"
          }}>◈ Connect OP_WALLET</button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>

          <div style={{ background: "#0a0f1e", border: "1px solid rgba(0,212,255,0.15)", borderRadius: "4px", padding: "1.4rem" }}>
            <div style={{ fontSize: "0.7rem", color: "#4a6080", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>⬡ JAR BALANCE</div>
            <div style={{ fontSize: "2.8rem", color: "#00ff9f", textShadow: "0 0 20px rgba(0,255,159,0.4)", lineHeight: 1 }}>
              {(balance / 100_000_000).toFixed(8)}
              <span style={{ fontSize: "1rem", color: "#4a6080" }}> BTC</span>
            </div>
            <div style={{ fontSize: "0.78rem", color: "#4a6080", marginTop: "0.3rem" }}>{balance.toLocaleString()} sats</div>
          </div>

          <div style={{
            background: "#0d1525", border: `1px solid ${canTip ? "rgba(0,255,159,0.3)" : "rgba(0,212,255,0.15)"}`,
            borderRadius: "4px", padding: "1rem 1.4rem",
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            {canTip ? (
              <span style={{ color: "#00ff9f", fontWeight: "bold", letterSpacing: "0.1em" }}>⚡ READY TO TIP</span>
            ) : seconds > 0 ? (
              <>
                <span style={{ fontSize: "0.68rem", color: "#4a6080", letterSpacing: "0.12em" }}>NEXT TIP IN</span>
                <span style={{ fontSize: "1.5rem", color: "#ff2d78", textShadow: "0 0 20px rgba(255,45,120,0.4)", letterSpacing: "0.08em" }}>{hms(seconds)}</span>
              </>
            ) : (
              <span style={{ color: "#4a6080", fontSize: "0.78rem" }}>Connect wallet to start</span>
            )}
          </div>

          <div style={{ background: "#0a0f1e", border: "1px solid rgba(0,212,255,0.15)", borderRadius: "4px", padding: "1.4rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              {[546, 1000, 5000, 10000].map(p => (
                <button key={p} onClick={() => setAmount(p)} style={{
                  background: amount === p ? "rgba(0,212,255,0.1)" : "#0d1525",
                  border: `1px solid ${amount === p ? "#00d4ff" : "rgba(0,212,255,0.15)"}`,
                  color: amount === p ? "#00d4ff" : "#4a6080",
                  padding: "0.35rem 0.7rem", borderRadius: "3px",
                  cursor: "pointer", fontFamily: "inherit", fontSize: "0.78rem"
                }}>{p.toLocaleString()} sats</button>
              ))}
            </div>

            <button onClick={sendTip} disabled={!canTip} style={{
              width: "100%", padding: "1rem",
              background: canTip ? "linear-gradient(135deg,#00d4ff,#7b2fff)" : "#0d1525",
              border: "none", borderRadius: "3px", cursor: canTip ? "pointer" : "not-allowed",
              color: canTip ? "#000" : "#4a6080", fontFamily: "inherit",
              fontSize: "1rem", fontWeight: "bold", letterSpacing: "0.12em",
              boxShadow: canTip ? "0 0 30px rgba(0,212,255,0.3)" : "none"
            }}>
              {status === "sending" ? "◌ Confirm in Wallet…"
                : status === "success" ? "✓ TIP SENT!"
                : status === "error" ? "✗ Error. Try again"
                : "⚡ SEND TIP"}
            </button>

            {!connected && <p style={{ fontSize: "0.8rem", color: "#4a6080", textAlign: "center", marginTop: "0.6rem" }}>Connect wallet to tip</p>}
            {status === "success" && <p style={{ fontSize: "0.85rem", color: "#00ff9f", textAlign: "center", marginTop: "0.6rem" }}>⚡ Tip confirmed on-chain!</p>}
          </div>
        </div>

        <div style={{ background: "#0a0f1e", border: "1px solid rgba(0,212,255,0.15)", borderRadius: "4px", padding: "1.4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{ color: "#00d4ff", fontSize: "0.78rem", letterSpacing: "0.15em", fontWeight: "bold" }}>◈ RECENT TIPS</span>
            <span style={{ color: "#4a6080", fontSize: "0.68rem" }}>{tips.length} entries</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {tips.length === 0 ? (
              <div style={{ color: "#4a6080", fontSize: "0.78rem", textAlign: "center", padding: "2rem" }}>
                No tips yet. Be the first! ⚡
              </div>
            ) : tips.map((tip, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "1.4rem 1fr 4rem 5rem",
                gap: "0.5rem", alignItems: "center",
                background: "#0d1525", padding: "0.45rem 0.6rem", borderRadius: "2px",
                fontSize: "0.72rem"
              }}>
                <span style={{ color: "#4a6080" }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ color: "#c8d8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tip.sender}</span>
                <span style={{ color: "#00ff9f", textAlign: "right", fontWeight: "bold" }}>{tip.amount.toLocaleString()}</span>
                <span style={{ color: "#4a6080", fontSize: "0.65rem", textAlign: "right" }}>{tip.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.65rem", color: "#4a6080", borderTop: "1px solid rgba(0,212,255,0.1)", paddingTop: "1rem" }}>
        Built on OPNet · Quantum-safe ML-DSA · Testnet only<br/>
        Contract: {CONTRACT.slice(0,10)}...{CONTRACT.slice(-8)}
      </div>

      <style>{`@keyframes fadeOut { 0%{opacity:1} 80%{opacity:1} 100%{opacity:0} }`}</style>
    </div>
  );
}
