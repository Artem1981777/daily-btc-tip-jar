import {
  OP_NET,
  Revert,
  Address,
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

  private totalTips: StoredU256 = new StoredU256(this.TOTAL_TIPS_PTR, u256.Zero);
  private lastWithdrawTime: StoredU256 = new StoredU256(this.LAST_WITHDRAW_PTR, u256.Zero);
  private recipient: StoredAddress = new StoredAddress(this.RECIPIENT_PTR, this.msgSender());
  private lastTipTime: AddressMemoryMap<u64> = new AddressMemoryMap<u64>(this.LAST_TIP_MAP_PTR);

  public callMethod(method: Selector, calldata: BytesReader): BytesWriter {
    switch (method) {
      case encodeSelector("tip"):
        return this.tip(calldata);
      case encodeSelector("withdraw"):
        return this.withdraw(calldata);
      default:
        throw new Revert("Unknown method");
    }
  }

  private tip(calldata: BytesReader): BytesWriter {
    const sender = this.msgSender();
    if (!sender || sender == Address.dead()) throw new Revert("NULL_SIGNER");
    const now = Blockchain.block.timestamp;
    const last = this.lastTipTime.get(sender);
    if (last != 0 && now - last < 86400) throw new Revert("COOLDOWN");
    const amount = calldata.readU256();
    if (amount < u256.fromU64(546)) throw new Revert("TOO_LOW");
    this.lastTipTime.set(sender, now);
    this.totalTips.value = this.totalTips.value + amount;
    const writer = new BytesWriter(1);
    writer.writeBoolean(true);
    return writer;
  }

  private withdraw(calldata: BytesReader): BytesWriter {
    const sender = this.msgSender();
    if (!sender || sender == Address.dead()) throw new Revert("NULL_SIGNER");
    if (sender != this.recipient.value) throw new Revert("NOT_OWNER");
    this.lastWithdrawTime.value = u256.fromU64(Blockchain.block.timestamp);
    const writer = new BytesWriter(1);
    writer.writeBoolean(true);
    return writer;
  }
}
