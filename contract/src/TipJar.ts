import {
  OP_NET,
  Revert,
  Address,
  u256,
  Blockchain,
  BytesWriter,
  BytesReader,
  AddressMemoryMap,
  StoredU256,
  StoredAddress,
} from "@btc-vision/btc-runtime/runtime";

@final
export class TipJar extends OP_NET {
  private readonly TOTAL_TIPS_PTR: u16 = 1;
  private readonly LAST_WITHDRAW_PTR: u16 = 2;
  private readonly RECIPIENT_PTR: u16 = 3;
  private readonly LAST_TIP_MAP_PTR: u16 = 100;

  private readonly COOLDOWN_SENDER: u64 = 86400;
  private readonly COOLDOWN_OWNER: u64 = 604800;
  private readonly MIN_TIP: u64 = 546;
  private readonly MAX_TIP: u64 = 100_000;

  private totalTips: StoredU256;
  private lastWithdrawTime: StoredU256;
  private recipient: StoredAddress;
  private lastTipTime: AddressMemoryMap<u64>;

  constructor() {
    super();
    this.totalTips = new StoredU256(this.TOTAL_TIPS_PTR, u256.Zero);
    this.lastWithdrawTime = new StoredU256(this.LAST_WITHDRAW_PTR, u256.Zero);
    this.recipient = new StoredAddress(this.RECIPIENT_PTR);
    this.lastTipTime = new AddressMemoryMap<u64>(this.LAST_TIP_MAP_PTR);
  }

  public onDeploy(calldata: BytesReader): void {
    this.recipient.set(this.msgSender());
  }

  public tip(calldata: BytesReader): BytesWriter {
    const sender: Address = this.msgSender();
    if (!sender || sender == Address.dead()) {
      throw new Revert("NULL_SIGNER: unauthorized");
    }
    const amount: u64 = calldata.readU64();
    if (amount < this.MIN_TIP) {
      throw new Revert("TIP_TOO_SMALL: minimum 546 sats");
    }
    if (amount > this.MAX_TIP) {
      throw new Revert("TIP_TOO_LARGE: maximum 100000 sats");
    }
    const now: u64 = Blockchain.block.timestamp;
    const lastTime: u64 = this.lastTipTime.get(sender);
    if (now - lastTime < this.COOLDOWN_SENDER) {
      const remaining: u64 = this.COOLDOWN_SENDER - (now - lastTime);
      throw new Revert("COOLDOWN_ACTIVE: " + remaining.toString() + "s remaining");
    }
    this.lastTipTime.set(sender, now);
    const newTotal = u256.add(this.totalTips.get(), u256.fromU64(amount));
    this.totalTips.set(newTotal);
    this.emitTipSentEvent(sender, this.recipient.get(), amount, now);
    const writer = new BytesWriter(32);
    writer.writeU256(newTotal);
    return writer;
  }

  public withdraw(calldata: BytesReader): BytesWriter {
    const sender: Address = this.msgSender();
    if (!sender || sender == Address.dead()) {
      throw new Revert("NULL_SIGNER: unauthorized");
    }
    if (sender != this.recipient.get()) {
      throw new Revert("NOT_OWNER: only jar owner can withdraw");
    }
    const now: u64 = Blockchain.block.timestamp;
    const lastW: u64 = this.lastWithdrawTime.get().toU64();
    if (now - lastW < this.COOLDOWN_OWNER) {
      const remaining: u64 = this.COOLDOWN_OWNER - (now - lastW);
      throw new Revert("WITHDRAW_COOLDOWN: " + remaining.toString() + "s remaining");
    }
    const balance = this.totalTips.get();
    if (u256.eq(balance, u256.Zero)) {
      throw new Revert("EMPTY_JAR: nothing to withdraw");
    }
    this.totalTips.set(u256.Zero);
    this.lastWithdrawTime.set(u256.fromU64(now));
    this.emitWithdrawnEvent(sender, balance, now);
    const writer = new BytesWriter(32);
    writer.writeU256(balance);
    return writer;
  }

  public getTotalTips(calldata: BytesReader): BytesWriter {
    const writer = new BytesWriter(32);
    writer.writeU256(this.totalTips.get());
    return writer;
  }

  public canTip(calldata: BytesReader): BytesWriter {
    const addr: Address = calldata.readAddress();
    const now: u64 = Blockchain.block.timestamp;
    const last: u64 = this.lastTipTime.get(addr);
    const elapsed: u64 = now - last;
    const canTipNow: bool = elapsed >= this.COOLDOWN_SENDER;
    const remaining: u64 = canTipNow ? 0 : this.COOLDOWN_SENDER - elapsed;
    const writer = new BytesWriter(9);
    writer.writeBoolean(canTipNow);
    writer.writeU64(remaining);
    return writer;
  }

  public getWithdrawCooldown(calldata: BytesReader): BytesWriter {
    const now: u64 = Blockchain.block.timestamp;
    const last: u64 = this.lastWithdrawTime.get().toU64();
    const elapsed: u64 = now - last;
    const remaining: u64 = elapsed >= this.COOLDOWN_OWNER
      ? 0
      : this.COOLDOWN_OWNER - elapsed;
    const writer = new BytesWriter(8);
    writer.writeU64(remaining);
    return writer;
  }

  private emitTipSentEvent(
    sender: Address,
    recipient: Address,
    amount: u64,
    timestamp: u64,
  ): void {
    const data = new BytesWriter(33 + 33 + 8 + 8);
    data.writeAddress(sender);
    data.writeAddress(recipient);
    data.writeU64(amount);
    data.writeU64(timestamp);
    this.emitEvent("TipSent", data.getBuffer());
  }

  private emitWithdrawnEvent(
    owner: Address,
    amount: u256,
    timestamp: u64,
  ): void {
    const data = new BytesWriter(33 + 32 + 8);
    data.writeAddress(owner);
    data.writeU256(amount);
    data.writeU64(timestamp);
    this.emitEvent("Withdrawn", data.getBuffer());
  }
}
