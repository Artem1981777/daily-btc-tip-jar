import {
  OP_NET,
  BytesWriter,
  BytesReader,
  Selector,
} from "@btc-vision/btc-runtime/runtime";

@final
export class TipJar extends OP_NET {
  public callMethod(method: Selector, calldata: BytesReader): BytesWriter {
    return new BytesWriter(0);
  }
}
