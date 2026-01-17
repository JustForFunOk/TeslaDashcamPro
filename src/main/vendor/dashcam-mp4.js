/**
 * Tesla Dashcam MP4 Parser
 * Parses MP4 files and extracts SEI metadata from Tesla dashcam footage.
 * copy from: https://github.com/teslamotors/dashcam/blob/master/dashcam-mp4.js
 */
class DashcamMP4 {
    constructor(buffer) {
        this.buffer = buffer;
        this.view = new DataView(buffer);
        this._config = null;
    }

    // -------------------------------------------------------------
    // MP4 Box Navigation
    // -------------------------------------------------------------

    /** Find a box by name within a range */
    findBox(start, end, name) {
        for (let pos = start; pos + 8 <= end;) {
            let size = this.view.getUint32(pos);
            const type = this.readAscii(pos + 4, 4);
            const headerSize = size === 1 ? 16 : 8;

            if (size === 1) {
                const high = this.view.getUint32(pos + 8);
                const low = this.view.getUint32(pos + 12);
                size = Number((BigInt(high) << 32n) | BigInt(low));
            } else if (size === 0) {
                size = end - pos;
            }

            if (type === name) {
                return { start: pos + headerSize, end: pos + size, size: size - headerSize };
            }
            pos += size;
        }
        throw new Error(`Box "${name}" not found`);
    }

    /** Find mdat box and return content location */
    findMdat() {
        const mdat = this.findBox(0, this.view.byteLength, 'mdat');
        return { offset: mdat.start, size: mdat.size };
    }

    // -------------------------------------------------------------
    // SEI Extraction
    // -------------------------------------------------------------

    /** Extract all SEI messages for CSV export */
    // 扫描NALU单元，如果非SEI信息则跳过
    // 储存布局：SEI是随帧存储的。第 1 帧视频后面跟着一个包含第 1 帧状态的 SEI，第 2 帧视频后面跟着第 2 帧的 SEI，所以需要全量扫描
    extractSeiMessages(SeiMetadata) {
        const mdat = this.findMdat();
        const messages = [];
        let cursor = mdat.offset;
        const end = mdat.offset + mdat.size;

        while (cursor + 4 <= end) {
            const nalSize = this.view.getUint32(cursor);
            cursor += 4;

            if (nalSize < 2 || cursor + nalSize > this.view.byteLength) {
                cursor += Math.max(nalSize, 0);
                continue;
            }

            // NAL type 6 = SEI, payload type 5 = user data unregistered
            if ((this.view.getUint8(cursor) & 0x1F) === 6 && this.view.getUint8(cursor + 1) === 5) {
                const sei = this.decodeSei(new Uint8Array(this.buffer.slice(cursor, cursor + nalSize)), SeiMetadata);
                if (sei) messages.push(sei);
            }
            cursor += nalSize;
        }
        return messages;
    }

    /** Decode SEI NAL unit to protobuf message */
    decodeSei(nal, SeiMetadata) {
        if (!SeiMetadata || nal.length < 4) return null;

        let i = 3;
        while (i < nal.length && nal[i] === 0x42) i++;
        if (i <= 3 || i + 1 >= nal.length || nal[i] !== 0x69) return null;

        try {
            // return SeiMetadata.decode(this.stripEmulationBytes(nal.subarray(i + 1, nal.length - 1)));
            const message = SeiMetadata.decode(this.stripEmulationBytes(nal.subarray(i + 1, nal.length - 1)));
            // 使用 toObject 并转换，保留默认值，否则解析出来的结果不包含默认值的字段
            return SeiMetadata.toObject(message, {
                defaults: true,   // 包含默认值字段 (0, false, "")
                enums: String,    // 可选：将枚举值转换为字符串名称而非数字
                longs: String     // 可选：防止 uint64 精度丢失
            });
        } catch {
            return null;
        }
    }

    /** Strip H.264 emulation prevention bytes */
    // H.264 规定：在编码时，如果扫描到连续两个 00，就强制在后面插入一个特殊的字节 0x03
    // 这个函数实现逆向还原过程，如果已经连续出现了两个 0，且当前字节正好是 0x03，说明这就是编码器强行插入的“脱离字节”。代码通过 continue 将其丢弃。
    stripEmulationBytes(data) {
        const out = [];
        let zeros = 0;
        for (const byte of data) {
            if (zeros >= 2 && byte === 0x03) { zeros = 0; continue; }
            out.push(byte);
            zeros = byte === 0 ? zeros + 1 : 0;
        }
        return Uint8Array.from(out);
    }

    // -------------------------------------------------------------
    // Utilities
    // -------------------------------------------------------------

    readAscii(start, len) {
        let s = '';
        for (let i = 0; i < len; i++) s += String.fromCharCode(this.view.getUint8(start + i));
        return s;
    }

}

module.exports = { DashcamMP4 };
