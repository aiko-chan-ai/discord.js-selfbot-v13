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
const VideoDispatcher = require('./VideoDispatcher');
const Util = require('../../../util/Util');
const { H264Helpers, H265Helpers } = require('../player/processing/AnnexBNalSplitter');

class AnnexBDispatcher extends VideoDispatcher {
  constructor(player, highWaterMark = 12, streams, fps, nalFunctions, payloadType) {
    super(player, highWaterMark, streams, fps, payloadType);
    this._nalFunctions = nalFunctions;
  }

  codecCallback(frame) {
    let accessUnit = frame;
    let offset = 0;

    // Extract NALUs from the access unit
    while (offset < accessUnit.length) {
      const naluSize = accessUnit.readUInt32BE(offset);
      offset += 4;
      const nalu = accessUnit.subarray(offset, offset + naluSize);
      const isLastNal = offset + naluSize >= accessUnit.length;
      if (nalu.length <= this.mtu) {
        // Send as Single NAL Unit Packet.
        this._playChunk(Buffer.concat([this.createPayloadExtension(), nalu]), isLastNal);
      } else {
        const [naluHeader, naluData] = this._nalFunctions.splitHeader(nalu);
        const dataFragments = this.partitionVideoData(naluData);
        // Send as Fragmentation Unit A (FU-A):
        for (let fragmentIndex = 0; fragmentIndex < dataFragments.length; fragmentIndex++) {
          const data = dataFragments[fragmentIndex];
          const isFirstPacket = fragmentIndex === 0;
          const isFinalPacket = fragmentIndex === dataFragments.length - 1;

          this._playChunk(
            Buffer.concat([
              this.createPayloadExtension(),
              this.makeFragmentationUnitHeader(isFirstPacket, isFinalPacket, naluHeader),
              data,
            ]),
            isLastNal && isFinalPacket,
          );
        }
      }
      offset += naluSize;
    }
  }
}

class H264Dispatcher extends AnnexBDispatcher {
  constructor(player, highWaterMark = 12, streams, fps) {
    super(player, highWaterMark, streams, fps, H264Helpers, Util.getPayloadType('H264'));
  }

  makeFragmentationUnitHeader(isFirstPacket, isLastPacket, naluHeader) {
    const nal0 = naluHeader[0];
    const fuPayloadHeader = Buffer.alloc(2);
    const nalType = H264Helpers.getUnitType(naluHeader);
    const fnri = nal0 & 0xe0;

    fuPayloadHeader[0] = 0x1c | fnri;

    if (isFirstPacket) {
      fuPayloadHeader[1] = 0x80 | nalType;
    } else if (isLastPacket) {
      fuPayloadHeader[1] = 0x40 | nalType;
    } else {
      fuPayloadHeader[1] = nalType;
    }

    return fuPayloadHeader;
  }
}

class H265Dispatcher extends AnnexBDispatcher {
  constructor(player, highWaterMark = 12, streams, fps) {
    super(player, highWaterMark, streams, fps, H265Helpers, Util.getPayloadType('H265'));
  }

  makeFragmentationUnitHeader(isFirstPacket, isLastPacket, naluHeader) {
    const fuIndicatorHeader = Buffer.allocUnsafe(3);
    naluHeader.copy(fuIndicatorHeader);
    const nalType = H265Helpers.getUnitType(naluHeader);

    fuIndicatorHeader[0] = (fuIndicatorHeader[0] & 0b10000001) | (49 << 1);

    if (isFirstPacket) {
      fuIndicatorHeader[2] = 0x80 | nalType;
    } else if (isLastPacket) {
      fuIndicatorHeader[2] = 0x40 | nalType;
    } else {
      fuIndicatorHeader[2] = nalType;
    }

    return fuIndicatorHeader;
  }
}

module.exports = {
  H264Dispatcher,
  H265Dispatcher,
};
