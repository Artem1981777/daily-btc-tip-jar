import { useState, useEffect } from "react";

const CONTRACT = import.meta.env.VITE_CONTRACT_ADDRESS || "opt1sqzuur7s4l7j05jhcq6hlve97zgj6kwr9qqxj29qh";
const COOLDOWN = 86400;

export default function App() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState("idle");
  const [amount, setAmount] = useState(1000);
  const [showAnim, setShowAnim] = useState(false);
  const [tips, setTips] = useState([]);

  const canTip = connected && seconds === 0;

  async function debugWallet() {
    const w = window.opnet || window.unisat;
    const methods = Object.keys(w).join(", ");
    alert(methods);
  }

  async function connect() {
    try {
      const w = window.opnet || window.unisat;
      if (!w) { alert("Install OP_WALLET!"); return; }
      const acc = await w.requestAccounts();
      if (acc.length > 0) { setAddress(acc[0]); setConnected(true); }
    } catch(e) { alert("Error: " + e.message); }
  }

  async function sendTip() {
    if (!canTip) return;
    try {
      setStatus("sending");
      const w = window.opnet || window.unisat;
      if (!w) { setStatus("error"); return; }
      const utxos = await w.getBitcoinUtxos();
      const selector = new Uint8Array([0x97, 0x38, 0x01, 0x87]);
      const amountHex = BigInt(amount).toString(16).padStart(64, "0");
      const amountBytes = new Uint8Array(amountHex.match(/.{2}/g).map(b => parseInt(b, 16)));
      const calldata = new Uint8Array([...selector, ...amountBytes]);
      const result = await w.signAndBroadcastInteraction({
        to: CONTRACT,
        contract: CONTRACT,
        contract: CONTRACT,
        calldata: calldata,
        from: address,
        utxos: utxos,
        feeRate: 2,
        priorityFee: 1000n,
        gasSatFee: 1000n,
      });
      console.log("tx:", result);
      setBalance(b => b + amount);
      setSeconds(COOLDOWN);
      setStatus("success");
      setShowAnim(true);
      setTips(p => [{sender: address.slice(0,6)+"..."+address.slice(-4), amount, time: new Date().toLocaleString()}, ...p.slice(0,9)]);
      setTimeout(() => { setShowAnim(false); setStatus("idle"); }, 3000);
    } catch(e) { console.error(e); setStatus("error"); setTimeout(() => setStatus("idle"), 2000); }
  }

  function hms(s) {
    return [Math.floor(s/3600), Math.floor((s%3600)/60), s%60].map(v => String(v).padStart(2,"0")).join(":");
  }

  return (
    <div style={{minHeight:"100vh",background:"#050810",color:"#c8d8f0",fontFamily:"monospace",padding:"2rem"}}>
      {showAnim && <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"8rem",zIndex:999,pointerEvents:"none"}}>⚡</div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid rgba(0,212,255,0.15)",paddingBottom:"1rem",marginBottom:"2rem"}}>
        <div><div style={{fontSize:"1.5rem",color:"#00d4ff",fontWeight:"bold"}}>₿ DAILY TIP JAR</div><div style={{fontSize:"0.65rem",color:"#4a6080"}}>OPNet Testnet</div></div>
        {connected ? <div style={{color:"#00ff9f"}}>● {address.slice(0,6)}...{address.slice(-4)}</div> : <button onClick={connect} style={{background:"transparent",border:"1px solid #00d4ff",color:"#00d4ff",padding:"0.5rem 1rem",cursor:"pointer"}}>◈ Connect OP_WALLET</button>}
      </div>
      <div style={{marginBottom:"1rem",padding:"1rem",background:"#0a0f1e",border:"1px solid rgba(0,212,255,0.15)"}}>
        <div style={{fontSize:"0.7rem",color:"#4a6080"}}>JAR BALANCE</div>
        <div style={{fontSize:"2rem",color:"#00ff9f"}}>{(balance/1e8).toFixed(8)} BTC</div>
      </div>
      <div style={{marginBottom:"1rem",padding:"1rem",background:"#0d1525",border:"1px solid rgba(0,212,255,0.15)"}}>
        {canTip ? <span style={{color:"#00ff9f"}}>⚡ READY TO TIP</span> : seconds > 0 ? <span style={{color:"#ff2d78"}}>NEXT TIP IN {hms(seconds)}</span> : <span style={{color:"#4a6080"}}>Connect wallet</span>}
      </div>
      <div style={{marginBottom:"1rem"}}>
        {[546,1000,5000,10000].map(p => <button key={p} onClick={() => setAmount(p)} style={{marginRight:"0.5rem",padding:"0.3rem 0.7rem",background:amount===p?"#00d4ff":"transparent",color:amount===p?"#000":"#4a6080",border:"1px solid #00d4ff",cursor:"pointer"}}>{p} sats</button>)}
      </div>
      <button onClick={sendTip} disabled={!canTip} style={{width:"100%",padding:"1rem",background:canTip?"#00d4ff":"#0d1525",color:canTip?"#000":"#4a6080",border:"none",cursor:canTip?"pointer":"not-allowed",fontSize:"1rem",fontWeight:"bold"}}>
        {status==="sending"?"◌ Confirm...":status==="success"?"✓ SENT!":status==="error"?"✗ Error":"⚡ SEND TIP"}
      </button>
      <button onClick={debugWallet} style={{width:"100%",marginTop:"0.5rem",padding:"0.5rem",background:"#1a1a2e",border:"1px solid #ff2d78",color:"#ff2d78",cursor:"pointer"}}>🔍 DEBUG WALLET</button>
      <div style={{marginTop:"2rem",padding:"1rem",background:"#0a0f1e",border:"1px solid rgba(0,212,255,0.15)"}}>
        <div style={{color:"#00d4ff",marginBottom:"0.5rem"}}>◈ RECENT TIPS ({tips.length})</div>
        {tips.length===0 ? <div style={{color:"#4a6080"}}>No tips yet ⚡</div> : tips.map((t,i) => <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"0.3rem 0",borderBottom:"1px solid rgba(0,212,255,0.1)"}}><span>{t.sender}</span><span style={{color:"#00ff9f"}}>{t.amount} sats</span></div>)}
      </div>
      <div style={{textAlign:"center",marginTop:"1rem",fontSize:"0.6rem",color:"#4a6080"}}>Contract: {CONTRACT.slice(0,10)}...{CONTRACT.slice(-8)}</div>
    </div>
  );
}
