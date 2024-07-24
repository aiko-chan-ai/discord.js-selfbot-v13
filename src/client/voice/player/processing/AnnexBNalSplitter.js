'use strict';

/*
Credit: https://github.com/dank074/Discord-video-stream
The use of video streaming in this library is an incomplete implementation with many bugs, primarily aimed at lazy users.
The video streaming features in this library are sourced from https://github.com/dank074/Discord-video-stream.

Please use the @dank074/discord-video-stream library to access all advanced and professional features,
along with comprehensive support. I will not actively fix bugs related to streaming and encourage everyone to
use https://github.com/dank074/Discord-video-stream for stable and smooth streaming.

To reiterate: This is an incomplete implementation of the library https://github.com/dank074/Discord-video-stream.

Thanks to dank074 and longnguyen2004 for implementing new codecs (H264, H265).
Thanks to mrjvs for discovering how Discord transmits data and the VP8 codec.

Please use the @dank074/discord-video-stream library for the best support.
*/

const { Buffer } = require('buffer');
const { Transform } = require('stream');

const H264NalUnitTypes = {
  Unspecified: 0,
  CodedSliceNonIDR: 1,
  CodedSlicePartitionA: 2,
  CodedSlicePartitionB: 3,
  CodedSlicePartitionC: 4,
  CodedSliceIdr: 5,
  SEI: 6,
  SPS: 7,
  PPS: 8,
  AccessUnitDelimiter: 9,
  EndOfSequence: 10,
  EndOfStream: 11,
  FillerData: 12,
  SEIExtenstion: 13,
  PrefixNalUnit: 14,
  SubsetSPS: 15,
};

const H265NalUnitTypes = {
  TRAIL_N: 0,
  TRAIL_R: 1,
  TSA_N: 2,
  TSA_R: 3,
  STSA_N: 4,
  STSA_R: 5,
  RADL_N: 6,
  RADL_R: 7,
  RASL_N: 8,
  RASL_R: 9,
  RSV_VCL_N10: 10,
  RSV_VCL_R11: 11,
  RSV_VCL_N12: 12,
  RSV_VCL_R13: 13,
  RSV_VCL_N14: 14,
  RSV_VCL_R15: 15,
  BLA_W_LP: 16,
  BLA_W_RADL: 17,
  BLA_N_LP: 18,
  IDR_W_RADL: 19,
  IDR_N_LP: 20,
  CRA_NUT: 21,
  RSV_IRAP_VCL22: 22,
  RSV_IRAP_VCL23: 23,
  RSV_VCL24: 24,
  RSV_VCL25: 25,
  RSV_VCL26: 26,
  RSV_VCL27: 27,
  RSV_VCL28: 28,
  RSV_VCL29: 29,
  RSV_VCL30: 30,
  RSV_VCL31: 31,
  VPS_NUT: 32,
  SPS_NUT: 33,
  PPS_NUT: 34,
  AUD_NUT: 35,
  EOS_NUT: 36,
  EOB_NUT: 37,
  FD_NUT: 38,
  PREFIX_SEI_NUT: 39,
  SUFFIX_SEI_NUT: 40,
  RSV_NVCL41: 41,
  RSV_NVCL42: 42,
  RSV_NVCL43: 43,
  RSV_NVCL44: 44,
  RSV_NVCL45: 45,
  RSV_NVCL46: 46,
  RSV_NVCL47: 47,
  UNSPEC48: 48,
  UNSPEC49: 49,
  UNSPEC50: 50,
  UNSPEC51: 51,
  UNSPEC52: 52,
  UNSPEC53: 53,
  UNSPEC54: 54,
  UNSPEC55: 55,
  UNSPEC56: 56,
  UNSPEC57: 57,
  UNSPEC58: 58,
  UNSPEC59: 59,
  UNSPEC60: 60,
  UNSPEC61: 61,
  UNSPEC62: 62,
  UNSPEC63: 63,
};

const H264Helpers = {
  getUnitType(frame) {
    return frame[0] & 0x1f;
  },
  splitHeader(frame) {
    return [frame.subarray(0, 1), frame.subarray(1)];
  },
  isAUD(unitType) {
    return unitType === H264NalUnitTypes.AccessUnitDelimiter;
  },
};

const H265Helpers = {
  getUnitType(frame) {
    return (frame[0] >> 1) & 0x3f;
  },
  splitHeader(frame) {
    return [frame.subarray(0, 2), frame.subarray(2)];
  },
  isAUD(unitType) {
    return unitType === H265NalUnitTypes.AUD_NUT;
  },
};

const emptyBuffer = Buffer.allocUnsafe(0);
const epbPrefix = Buffer.from([0x00, 0x00, 0x03]);
const nalSuffix = Buffer.from([0x00, 0x00, 0x01]);

class AnnexBNalSplitter extends Transform {
  constructor(nalFunctions) {
    super();
    this._buffer = null;
    this._accessUnit = [];
    this._nalFunctions = nalFunctions;
  }

  rbsp(data) {
    const newData = Buffer.allocUnsafe(data.length);
    let newLength = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const epbsPos = data.indexOf(epbPrefix);
      if (epbsPos === -1) {
        data.copy(newData, newLength);
        newLength += data.length;
        break;
      }
      const copyRange = data[epbsPos + 3] <= 0x03 ? epbsPos + 2 : epbsPos + 3;
      data.copy(newData, newLength, 0, copyRange);
      newLength += copyRange;
      data = data.subarray(epbsPos + 3);
    }

    return newData.subarray(0, newLength);
  }

  findNalStart(buf) {
    const pos = buf.indexOf(nalSuffix);
    if (pos === -1) return null;
    return pos > 0 && buf[pos - 1] === 0 ? { index: pos - 1, length: 4 } : { index: pos, length: 3 };
  }

  processFrame(frame) {
    if (frame.length === 0) return;

    const unitType = this._nalFunctions.getUnitType(frame);
    if (this._nalFunctions.isAUD(unitType) && this._accessUnit.length > 0) {
      const sizeOfAccessUnit = this._accessUnit.reduce((acc, nalu) => acc + nalu.length + 4, 0);
      const accessUnitBuf = Buffer.allocUnsafe(sizeOfAccessUnit);

      let offset = 0;
      this._accessUnit.forEach(nalu => {
        accessUnitBuf.writeUint32BE(nalu.length, offset);
        offset += 4;
        nalu.copy(accessUnitBuf, offset);
        offset += nalu.length;
      });

      this.push(accessUnitBuf);
      this._accessUnit = [];
    } else {
      this._accessUnit.push(this.removeEpbs(frame, unitType));
    }
  }

  _transform(chunk, encoding, callback) {
    let nalStart = this.findNalStart(chunk);
    if (!this._buffer) {
      if (!nalStart) {
        callback();
        return;
      }
      chunk = chunk.subarray(nalStart.index + nalStart.length);
      this._buffer = emptyBuffer;
    }

    chunk = Buffer.concat([this._buffer, chunk]);
    while ((nalStart = this.findNalStart(chunk))) {
      const frame = chunk.subarray(0, nalStart.index);
      this.processFrame(frame);
      chunk = chunk.subarray(nalStart.index + nalStart.length);
    }
    this._buffer = chunk;
    callback();
  }
}

class H264NalSplitter extends AnnexBNalSplitter {
  constructor() {
    super(H264Helpers);
  }

  removeEpbs(frame, unitType) {
    return unitType === H264NalUnitTypes.SPS || unitType === H264NalUnitTypes.SEI ? this.rbsp(frame) : frame;
  }
}

class H265NalSplitter extends AnnexBNalSplitter {
  constructor() {
    super(H265Helpers);
  }

  removeEpbs(frame) {
    return frame; // No specific processing for H265
  }
}

module.exports = {
  H264NalUnitTypes,
  H265NalUnitTypes,
  H264Helpers,
  H265Helpers,
  H264NalSplitter,
  H265NalSplitter,
};
