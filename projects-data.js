// Project data shared by portfolio.html (preview cards) and project.html (detail view).
window.PROJECT_ORDER = ['dime', 'gd', 'pihole', 'motor', 'heart', 'sensor'];

window.PROJECTS = {
  dime: {
    name: 'Dime — Inverted Pendulum',
    meta: 'C++, ESP32, KiCad · Summer 2024',
    desc: 'Self-balancing robot on custom PCBs with nested PID controllers.',
    longDesc: [
      'Dime is a two-wheeled self-balancing robot built around a custom ESP32 carrier board. Two nested PID loops — one for tilt angle, another for wheel velocity — keep it upright while letting it accept position commands over Wi-Fi.',
      'The mainboard fuses an MPU-6050 IMU with high-resolution magnetic encoders, runs a complementary filter to estimate tilt, and drives a pair of brushed DC motors through an onboard H-bridge with current sensing. A second daughterboard handles power conversion from a 3S Li-ion pack.',
      'Tuning was the hard part: too much P and it oscillated, too little D and it fell. The final loop runs at 500 Hz on the ESP32, with telemetry streamed to a small browser dashboard for live PID gain tweaking.'
    ],
    media: [],
    pcb: {
      glbPath: 'dime_preview.glb',
      glbPathFull: 'dime3dmodeluncompressed.glb',
      w: 3.0, h: 2.0,
      traces: [
        { x1: -0.1, z1: -0.1, x2: -0.8, z2: -0.2 }, { x1: -0.1, z1: -0.1, x2: 0.5, z2: 0.15 },
        { x1: -0.8, z1: -0.2, x2: -1.2, z2: 0.1, w: 0.032 }, { x1: 0.5, z1: 0.15, x2: 0.8, z2: 0.5, w: 0.02 },
        { x1: -0.8, z1: -0.2, x2: -0.7, z2: 0.5 }, { x1: 0.1, z1: 0.6, x2: -0.1, z2: -0.1, w: 0.015 },
        { x1: 0.4, z1: -0.5, x2: -0.1, z2: -0.1, w: 0.015 }, { x1: -0.1, z1: -0.1, x2: 0.8, z2: -0.25 },
        { x1: 0.8, z1: -0.25, x2: 1.2, z2: -0.1, w: 0.025 }, { x1: -0.1, z1: -0.1, x2: 0.0, z2: 0.8, w: 0.015 },
        { x1: -0.8, z1: -0.2, x2: -0.4, z2: -0.7, w: 0.018 },
      ],
      components: [
        { t: 'ic', x: -0.1, z: -0.1, w: 0.42, d: 0.42, col: 0x1e1e1e },
        { t: 'ic', x: -0.8, z: -0.2, w: 0.52, d: 0.52, col: 0x161616 },
        { t: 'ic', x: 0.8, z: -0.25, w: 0.22, d: 0.32, col: 0x2a2a2a },
        { t: 'cap', x: 0.5, z: 0.15, r: 0.07, h: 0.22, col: 0x1a1a3a },
        { t: 'cap', x: 0.7, z: -0.25, r: 0.062, h: 0.18, col: 0x1a1a3a },
        { t: 'cap', x: -0.45, z: 0.5, r: 0.052, h: 0.15, col: 0x222244 },
        { t: 'res', x: 0.1, z: 0.6 }, { t: 'res', x: 0.3, z: 0.6, col: 0x8a3a3a },
        { t: 'res', x: 0.4, z: -0.5 }, { t: 'res', x: -0.3, z: -0.65, col: 0x3a6a3a },
        { t: 'res', x: -0.1, z: -0.65 }, { t: 'res', x: 0.6, z: 0.5, col: 0x7a6040 },
        { t: 'conn', x: -1.2, z: 0.1, w: 0.22, d: 0.16, h: 0.16, col: 0xf8f8f8 },
        { t: 'conn', x: 1.2, z: 0.1, w: 0.20, d: 0.16, h: 0.16, col: 0xf8f8f8 },
        { t: 'conn', x: 1.2, z: -0.3, w: 0.20, d: 0.16, h: 0.16, col: 0xeeeeee },
        { t: 'crystal', x: -0.7, z: 0.5 },
        { t: 'led', x: 0.0, z: 0.8, col: 0x00cc44 },
      ]
    }
  },

  gd: {
    name: 'Geometry Dash Clone',
    meta: 'C, MSPM0G3507 · Spring 2026',
    desc: 'Beat-synced platformer. Voted "Best Game" at ECE319K showcase.',
    longDesc: [
      'A from-scratch Geometry Dash clone running bare-metal on a TI MSPM0G3507. Beat-synced level generation, hardware-accelerated sprite blits, and a custom audio engine driving a piezo via DMA-paced PWM.',
      'The render loop pushes pixels to a 320×240 SPI LCD at 60 FPS by double-buffering in SRAM. Collisions are sub-pixel against an obstacle list, and difficulty scales with the BPM of the loaded track.',
      'Won "Best Game" at the UT Austin ECE319K end-of-semester showcase, beating ~70 teams. Source includes the level editor used to author the demo tracks.'
    ],
    media: [],
    pcb: {
      w: 2.6, h: 3.4,
      traces: [
        { x1: 0, z1: 0, x2: 0, z2: -1.35, w: 0.025 }, { x1: 0, z1: 0, x2: 0, z2: 1.55, w: 0.025 },
        { x1: 0, z1: 0, x2: -1.1, z2: 0.1, w: 0.020 }, { x1: 0, z1: 0, x2: 1.1, z2: 0.1, w: 0.020 },
        { x1: 0, z1: 0, x2: -0.7, z2: 0.85, w: 0.018 }, { x1: 0, z1: 0, x2: 0.7, z2: 0.85, w: 0.018 },
        { x1: 0, z1: 0, x2: 0.82, z2: -0.75, w: 0.018 }, { x1: -0.25, z1: 0.75, x2: 0, z2: 0, w: 0.015 },
        { x1: 0, z1: 0, x2: 0.48, z2: 0.5, w: 0.015 }, { x1: 0, z1: 0, x2: -0.5, z2: -0.5, w: 0.015 },
        { x1: 0, z1: 0, x2: 0.5, z2: -0.5, w: 0.015 },
      ],
      components: [
        { t: 'ic', x: 0, z: 0, w: 0.75, d: 0.75, col: 0x151515 },
        { t: 'conn', x: 0, z: -1.35, w: 1.1, d: 0.14, h: 0.14, col: 0xeeeeee },
        { t: 'conn', x: 0, z: 1.55, w: 0.38, d: 0.16, h: 0.16, col: 0xaaaaaa },
        { t: 'ic', x: -0.72, z: 0.85, w: 0.16, d: 0.16, h: 0.10, col: 0x2a2a2a },
        { t: 'ic', x: 0.72, z: 0.85, w: 0.16, d: 0.16, h: 0.10, col: 0x2a2a2a },
        { t: 'cap', x: -0.44, z: 0.4, r: 0.054, h: 0.16, col: 0x1a1a3a },
        { t: 'cap', x: 0.44, z: 0.4, r: 0.054, h: 0.16, col: 0x1a1a3a },
        { t: 'cap', x: -0.44, z: -0.4, r: 0.048, h: 0.14, col: 0x22224a },
        { t: 'cap', x: 0.44, z: -0.4, r: 0.048, h: 0.14, col: 0x22224a },
        { t: 'cap', x: 0.82, z: -0.75, r: 0.095, h: 0.17, col: 0x111111 },
        { t: 'res', x: -0.85, z: 0.1 }, { t: 'res', x: -0.85, z: -0.1, col: 0x3a6a3a },
        { t: 'res', x: -0.85, z: -0.3, col: 0x8a3a3a }, { t: 'res', x: 0.62, z: -0.75 },
        { t: 'res', x: 0.48, z: 0.5, col: 0x7a6040 }, { t: 'res', x: -0.48, z: -0.55 },
        { t: 'led', x: 0.82, z: 0.45, col: 0x00ee44 },
        { t: 'conn', x: -1.1, z: 0.1, w: 0.14, d: 1.1, h: 0.14, col: 0x111111 },
        { t: 'conn', x: 1.1, z: 0.1, w: 0.14, d: 1.1, h: 0.14, col: 0x111111 },
        { t: 'ic', x: 0, z: -0.88, w: 0.52, d: 0.20, col: 0x252525 },
        { t: 'crystal', x: -0.25, z: 0.75 },
      ]
    }
  },

  pihole: {
    name: 'Pi-hole Adblocker',
    meta: 'Raspberry Pi, DNS, Linux',
    desc: 'Network-wide DNS sinkhole on a Raspberry Pi.',
    longDesc: [
      'A Raspberry Pi 4 running Pi-hole as the LAN DNS sinkhole, blocking ads and trackers for every device on the network without per-device clients.',
      'Configured with custom blocklists, a static lease in the home router, and a Cloudflare-over-HTTPS upstream. About 28% of all DNS queries on the network get black-holed at the resolver.',
      'The "PCB" here is the actual Raspberry Pi 4 board model — nostalgic rendering of the layout I keep behind the TV.'
    ],
    media: [],
    pcb: {
      w: 2.8, h: 2.2,
      traces: [
        { x1: -0.8, z1: 0, x2: 0.8, z2: 0, w: 0.04 }, { x1: 0, z1: -0.8, x2: 0, z2: 0.8, w: 0.03 },
        { x1: -0.6, z1: -0.5, x2: 0.6, z2: 0.5, w: 0.02 }, { x1: -1.1, z1: -0.2, x2: -0.5, z2: 0, w: 0.025 },
      ],
      components: [
        { t: 'ic', x: 0, z: 0, w: 0.65, d: 0.65, col: 0x181818 },
        { t: 'ic', x: -0.6, z: -0.5, w: 0.3, d: 0.2, col: 0x222222 },
        { t: 'cap', x: 0.5, z: 0.4, r: 0.06, h: 0.18, col: 0x1a1a3a },
        { t: 'conn', x: -1.1, z: -0.2, w: 0.18, d: 0.55, h: 0.18, col: 0xcccccc },
        { t: 'conn', x: 1.1, z: 0.2, w: 0.16, d: 0.4, h: 0.14, col: 0xdddddd },
        { t: 'res', x: 0.3, z: -0.6 }, { t: 'res', x: -0.3, z: -0.6, col: 0x3a6a3a },
        { t: 'led', x: 0.6, z: -0.4, col: 0x00cc44 }, { t: 'led', x: 0.8, z: -0.4, col: 0xff2200 },
        { t: 'crystal', x: -0.8, z: 0.3 },
      ]
    }
  },

  motor: {
    name: 'Motor Driver Board',
    meta: 'KiCad, H-Bridge, MOSFETs',
    desc: 'Custom H-bridge motor driver with gate drive and current sensing.',
    longDesc: [
      'A four-MOSFET H-bridge designed for 12 V brushed DC motors up to ~10 A continuous. Synchronous rectification, dedicated gate driver IC, and high-side current sensing through a low-Ω shunt.',
      'Layout uses 2 oz copper power planes for the bridge and a separate signal ground for the gate driver. Bulk electrolytics decouple motor commutation spikes; ceramics sit right at the gate driver pins.',
      'Designed in KiCad, fabbed by JLCPCB. Drives the wheels on the Dime balancing robot.'
    ],
    media: [],
    pcb: {
      w: 3.4, h: 2.2,
      traces: [
        { x1: -0.4, z1: 0.1, x2: 0.6, z2: 0.1, w: 0.048 }, { x1: -0.4, z1: 0.1, x2: -1.0, z2: 0.3, w: 0.035 },
        { x1: 0.6, z1: 0.1, x2: 1.2, z2: 0.3, w: 0.035 }, { x1: -0.4, z1: 0.1, x2: -1.4, z2: 0.1, w: 0.055 },
        { x1: 0.6, z1: 0.1, x2: 1.5, z2: 0.1, w: 0.055 }, { x1: 0.1, z1: 0.95, x2: -0.4, z2: 0.75, w: 0.042 },
        { x1: 0.1, z1: 0.95, x2: 0.6, z2: 0.75, w: 0.042 }, { x1: -0.4, z1: 0.1, x2: -0.4, z2: 0.75 },
        { x1: 0.6, z1: 0.1, x2: 0.6, z2: 0.75 }, { x1: -0.9, z1: -0.5, x2: -0.4, z2: 0.1, w: 0.025 },
        { x1: 1.1, z1: -0.5, x2: 0.6, z2: 0.1, w: 0.025 }, { x1: 0.1, z1: -0.95, x2: -0.4, z2: 0.1, w: 0.03 },
        { x1: -0.4, z1: 0.1, x2: -0.05, z2: -0.4, w: 0.02 }, { x1: 0.6, z1: 0.1, x2: 0.25, z2: -0.4, w: 0.02 },
      ],
      components: [
        { t: 'ic', x: -0.4, z: 0.1, w: 0.72, d: 0.52, h: 0.08, col: 0x0e0e0e },
        { t: 'ic', x: 0.6, z: 0.1, w: 0.72, d: 0.52, h: 0.08, col: 0x0e0e0e },
        { t: 'cap', x: -0.4, z: 0.75, r: 0.115, h: 0.42, col: 0x1a1a3a },
        { t: 'cap', x: 0.6, z: 0.75, r: 0.115, h: 0.42, col: 0x1a1a3a },
        { t: 'cap', x: -0.4, z: -0.62, r: 0.09, h: 0.30, col: 0x22224a },
        { t: 'cap', x: 0.6, z: -0.62, r: 0.09, h: 0.30, col: 0x22224a },
        { t: 'mosfet', x: -1.0, z: 0.3 }, { t: 'mosfet', x: 1.2, z: 0.3 },
        { t: 'inductor', x: -0.9, z: -0.5 }, { t: 'inductor', x: 1.1, z: -0.5 },
        { t: 'conn', x: -1.4, z: 0.1, w: 0.18, d: 0.44, h: 0.20, col: 0x228822 },
        { t: 'conn', x: 1.5, z: 0.1, w: 0.18, d: 0.44, h: 0.20, col: 0x228822 },
        { t: 'conn', x: 0.1, z: 0.95, w: 0.48, d: 0.18, h: 0.20, col: 0xcc2222 },
        { t: 'conn', x: 0.1, z: -0.95, w: 0.32, d: 0.18, h: 0.18, col: 0xf8f8f8 },
        { t: 'res', x: -0.05, z: 0.5 }, { t: 'res', x: 0.2, z: 0.5, col: 0x8a3a3a },
        { t: 'res', x: -0.05, z: -0.4, col: 0x3a6a3a }, { t: 'res', x: 0.2, z: -0.4 },
        { t: 'ic', x: -1.1, z: -0.2, w: 0.22, d: 0.18, col: 0x303030 },
      ]
    }
  },

  heart: {
    name: 'Heart PCB',
    meta: 'KiCad, Charlieplexed LEDs',
    desc: 'Heart-shaped art PCB with animated LED patterns.',
    longDesc: [
      'A heart-shaped art PCB with charlieplexed surface-mount LEDs driven by an ATtiny. Five GPIOs control 20 LEDs with no external drivers — just careful pin sequencing in firmware.',
      'The board outline is drawn directly in KiCad as a custom edge cut, with silkscreen accents echoing the heart shape. Designed as a Valentine\'s Day gift; a few extras live on my desk.',
      'Animations include a slow heartbeat pulse, a sparkle pattern, and a chase that traces the outline.'
    ],
    media: [],
    pcb: {
      w: 2.2, h: 2.4,
      traces: [
        { x1: 0, z1: 0.3, x2: -0.5, z2: -0.3, w: 0.02 }, { x1: 0, z1: 0.3, x2: 0.5, z2: -0.3, w: 0.02 },
        { x1: -0.5, z1: -0.3, x2: 0, z2: -0.9, w: 0.02 }, { x1: 0.5, z1: -0.3, x2: 0, z2: -0.9, w: 0.02 },
        { x1: -0.3, z1: 0, x2: 0.3, z2: 0, w: 0.015 },
      ],
      components: [
        { t: 'ic', x: 0, z: 0, w: 0.3, d: 0.3, col: 0x1e1e1e },
        { t: 'led', x: -0.5, z: -0.3, col: 0xff1144 }, { t: 'led', x: 0.5, z: -0.3, col: 0xff1144 },
        { t: 'led', x: -0.3, z: 0.1, col: 0xff3366 }, { t: 'led', x: 0.3, z: 0.1, col: 0xff3366 },
        { t: 'led', x: 0, z: -0.6, col: 0xff1144 }, { t: 'led', x: 0, z: 0.5, col: 0xff3366 },
        { t: 'led', x: -0.7, z: -0.1, col: 0xff2255 }, { t: 'led', x: 0.7, z: -0.1, col: 0xff2255 },
        { t: 'res', x: -0.2, z: -0.8 }, { t: 'cap', x: -0.4, z: 0.5, r: 0.04, h: 0.12, col: 0x1a1a3a },
        { t: 'conn', x: 0, z: -1.0, w: 0.2, d: 0.1, h: 0.1, col: 0xdddddd },
      ]
    }
  },

  sensor: {
    name: 'Sensor Module Board',
    meta: 'KiCad, I²C, STM32',
    desc: 'Compact multi-sensor breakout — IMU, baro, and temp/humidity over I²C.',
    longDesc: [
      'A small four-layer sensor breakout that aggregates an IMU, a barometric pressure sensor, and a temperature/humidity probe behind a single STM32G0 bridge MCU. Talks to a host over UART or USB-CDC, exposes raw and fused data.',
      'The G0 runs a Madgwick fusion filter at 200 Hz and time-stamps every packet against a hardware timer so downstream consumers see jitter-free sample intervals. There\'s a tiny SPI flash for firmware updates over DFU.',
      'Designed as a reusable building block for future projects — drone, weather logger, or anything that needs clean attitude/pressure data on a small footprint.'
    ],
    media: [],
    pcb: {
      w: 2.6, h: 1.8,
      traces: [
        { x1: 0, z1: 0, x2: -0.7, z2: 0.0, w: 0.024 },
        { x1: 0, z1: 0, x2: 0.7, z2: 0.0, w: 0.024 },
        { x1: 0, z1: 0, x2: 0.0, z2: -0.6, w: 0.020 },
        { x1: 0, z1: 0, x2: 0.0, z2: 0.6, w: 0.020 },
        { x1: 0, z1: 0, x2: -0.45, z2: 0.55, w: 0.015 },
        { x1: 0, z1: 0, x2: 0.45, z2: 0.55, w: 0.015 },
        { x1: 0, z1: 0, x2: -0.45, z2: -0.55, w: 0.015 },
        { x1: 0, z1: 0, x2: 0.45, z2: -0.55, w: 0.015 },
        { x1: -0.7, z1: 0.0, x2: -1.05, z2: 0.0, w: 0.030 },
        { x1: 0.7, z1: 0.0, x2: 1.05, z2: 0.0, w: 0.030 },
      ],
      components: [
        // central STM32G0 bridge MCU
        { t: 'ic', x: 0, z: 0, w: 0.46, d: 0.46, col: 0x131313 },
        // IMU (left), baro (top), temp/humidity (right)
        { t: 'ic', x: -0.7, z: 0.0, w: 0.22, d: 0.22, col: 0x222222 },
        { t: 'ic', x: 0.0, z: 0.6, w: 0.20, d: 0.20, col: 0x202020 },
        { t: 'ic', x: 0.7, z: 0.0, w: 0.22, d: 0.16, col: 0x1a1a1a },
        // SPI flash
        { t: 'ic', x: 0.0, z: -0.6, w: 0.18, d: 0.14, col: 0x282828 },
        // bypass caps
        { t: 'cap', x: -0.30, z: 0.30, r: 0.045, h: 0.13, col: 0x1a1a3a },
        { t: 'cap', x: 0.30, z: 0.30, r: 0.045, h: 0.13, col: 0x1a1a3a },
        { t: 'cap', x: -0.30, z: -0.30, r: 0.045, h: 0.13, col: 0x22224a },
        { t: 'cap', x: 0.30, z: -0.30, r: 0.045, h: 0.13, col: 0x22224a },
        // pull-ups + termination
        { t: 'res', x: -0.55, z: 0.30 }, { t: 'res', x: 0.55, z: 0.30, col: 0x8a3a3a },
        { t: 'res', x: -0.55, z: -0.30, col: 0x3a6a3a }, { t: 'res', x: 0.55, z: -0.30 },
        // edge connectors
        { t: 'conn', x: -1.05, z: 0.0, w: 0.16, d: 0.50, h: 0.16, col: 0xf0f0f0 },
        { t: 'conn', x: 1.05, z: 0.0, w: 0.16, d: 0.50, h: 0.16, col: 0xf0f0f0 },
        // status LED + crystal
        { t: 'led', x: 0.0, z: 0.78, col: 0x00cc55 },
        { t: 'crystal', x: -0.15, z: -0.78 },
      ]
    }
  }
};
