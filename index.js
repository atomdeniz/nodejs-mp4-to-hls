const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const fs = require("fs/promises");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const INPUT = "videos/input.mp4";
const OUTPUT_DIR = "videos";

const VARIANTS = [
  {
    name: "360p",
    width: 640,
    height: 360,
    videoBitrate: "800k",
    maxrate: "856k",
    bufsize: "1200k",
    audioBitrate: "96k",
    bandwidth: 800000
  },
  {
    name: "480p",
    width: 842,
    height: 480,
    videoBitrate: "1400k",
    maxrate: "1498k",
    bufsize: "2100k",
    audioBitrate: "128k",
    bandwidth: 1400000
  },
  {
    name: "720p",
    width: 1280,
    height: 720,
    videoBitrate: "2800k",
    maxrate: "2996k",
    bufsize: "4200k",
    audioBitrate: "128k",
    bandwidth: 2800000
  }
];

function encodeVariant({ name, width, height, videoBitrate, maxrate, bufsize, audioBitrate }) {
  return new Promise((resolve, reject) => {
    ffmpeg(INPUT)
      .addOptions([
        "-profile:v main",
        `-vf scale=w=${width}:h=${height}:force_original_aspect_ratio=decrease`,
        "-c:v h264",
        "-crf 20",
        "-g 48",
        "-keyint_min 48",
        "-sc_threshold 0",
        `-b:v ${videoBitrate}`,
        `-maxrate ${maxrate}`,
        `-bufsize ${bufsize}`,
        "-c:a aac",
        "-ar 48000",
        `-b:a ${audioBitrate}`,
        "-hls_time 10",
        `-hls_segment_filename ${OUTPUT_DIR}/${name}_%03d.ts`,
        "-hls_playlist_type vod",
        "-f hls"
      ])
      .output(`${OUTPUT_DIR}/${name}.m3u8`)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}

async function createMasterPlaylist() {
  const lines = [
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    ...VARIANTS.flatMap(v => [
      `#EXT-X-STREAM-INF:BANDWIDTH=${v.bandwidth},RESOLUTION=${v.width}x${v.height}`,
      `${v.name}.m3u8`
    ])
  ];

  await fs.writeFile(`${OUTPUT_DIR}/index.m3u8`, lines.join("\n"));
}

async function run() {
  try {
    await Promise.all(VARIANTS.map(encodeVariant));
    await createMasterPlaylist();
    console.log("✅ HLS encoding tamamlandı");
  } catch (err) {
    console.error("❌ Hata:", err);
  }
}

run();
