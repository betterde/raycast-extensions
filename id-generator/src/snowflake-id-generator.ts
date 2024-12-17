import {
  showHUD,
  Clipboard,
  PopToRootType,
  getPreferenceValues,
} from "@raycast/api";

interface Preferences {
  hideAfterCopy: boolean;
  poppingBackToRootType: PopToRootType;
}

class Snowflake {
  private datacenterId: number;
  private machineId: number;
  private epoch: number;
  private sequence: number;
  private lastTimestamp: number;

  constructor(datacenterId: number, machineId: number, epoch: number = 1609459200000) {
    this.datacenterId = datacenterId & 0x1F;
    this.machineId = machineId & 0x3FF;
    this.epoch = epoch;

    this.sequence = 0;
    this.lastTimestamp = -1;
  }

  // 生成 Snowflake ID
  public generate(): string {
    let timestamp = this._currentTimestamp();
    
    // 如果当前时间戳与上次生成的时间戳相同，则增加序列号
    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & 0xFFF;
      if (this.sequence === 0) {
        // 当前毫秒内序列号用完，等待下一毫秒
        while (timestamp === this.lastTimestamp) {
          timestamp = this._currentTimestamp();
        }
      }
    } else {
      this.sequence = 0;
    }

    this.lastTimestamp = timestamp;

    // 使用 BigInt 处理 ID，确保生成 64 位的数值
    const id = (BigInt(timestamp - this.epoch) << BigInt(22))
      | (BigInt(this.datacenterId) << BigInt(17))
      | (BigInt(this.machineId) << BigInt(12))
      | BigInt(this.sequence);

    return id.toString();
  }

  private _currentTimestamp(): number {
    return new Date().getTime();
  }
}

const snowflake = new Snowflake(1, 1);
const id = snowflake.generate();

Clipboard.copy(id);

const { poppingBackToRootType } = getPreferenceValues<Preferences>();

showHUD(`Copied Snowflake ID - ${id} 🎉`, {
  clearRootSearch: false,
  popToRootType:  poppingBackToRootType,
});

export default function Command() {
  return;
}