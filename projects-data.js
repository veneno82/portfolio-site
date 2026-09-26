// Project data shared by portfolio.html (preview cards) and project.html (detail view).
// Scrolled is hidden until the app is out: put 'scrolled' back at the front and uncomment its entry below.
window.PROJECT_ORDER = ['gd', 'motor', 'sensor', 'pihole', 'dime', 'heart', 'comingsoon'];

window.PROJECTS = {
  /* Hidden until Scrolled launches (its terms and privacy pages stay up at /scrolled/terms and /scrolled/privacy).
  // An app, not a board: no `pcb`, so the card shows `previewImg` and the
  // detail page shows `screens` (a row of phone screenshots) instead of a 3D model.
  scrolled: {
    name: 'Scrolled',
    previewImg: 'project%20media/scrolled%20preview.png',
    previewFit: 'contain',
    meta: 'Swift, SwiftUI, Screen Time API · Summer 2026, ongoing',
    desc: 'An iPhone app that gives your endless feeds an ending.',
    longDesc: [
      "Scrolled is an iPhone app that makes short form feeds actually end. Movies and books have an ending, short video feeds don't. In Scrolled you open Instagram, TikTok, YouTube, X, Reddit or Facebook in a built in browser that counts every clip you get through against a daily allowance you pick during setup. Once it's spent, the feed stops on an \"all caught up\" screen and that's it for the day.",
      "By default the allowance is shared between all of them on purpose, so running out on Instagram can't just send you over to TikTok. After the first week you can lower it whenever you want but only raise it once a week, since the moment you want more clips is right after your feed runs out.",
      "So you can't just open the real apps instead, Scrolled can also block them with Apple's Screen Time API (you pick which ones). The real app gets a custom block screen that points you back to Scrolled. You can unlock it for 1 to 5 minutes when you actually need it, and there's an optional hard mode where turning blocking off takes 24 hours.",
      "The onboarding ended up being the biggest part of the app, more than a third of all the Swift. It's around 20 screens, and most of them run on your own numbers: you scroll a little feed that actually has a bottom, put in your real Screen Time hours, and see how much of your free time they eat up on a \"your life in weeks\" calendar. Near the end you make a pinky promise by holding down a pad, and the paywall right after it is built out of your own answers instead of testimonials or countdown timers.",
      "Some other stuff in it:",
      [
        'A streak for opening the app every day, with nine tiers from spark to celestial, each with its own animated scene drawn in code',
        'A stats page that only shows what the app actually measured, plus how much time you kept for yourself',
        'Four themes, including an adaptive one with an animated Metal shader background in the colors of whatever feed you pick, plus a grayscale mode that turns the whole app, feeds included, black and white',
        'Home screen widgets that show how many clips you have left',
        'A Shortcuts and Siri action that opens a feed in Scrolled'
      ],
      "It started in July as an Expo/React Native prototype, and in August I ported the whole thing to native Swift. It's built in SwiftUI (with UIKit only where it has to bridge, like the web view) with zero third party packages, and it's split into the app plus 7 extensions (Screen Time, widgets and the share sheet among them). Scrolled has no servers or analytics of its own, and nothing you do in it gets sent to me. It's not on the App Store yet.",
      "Scrolled isn't affiliated with or endorsed by any of the apps it works with. Their names and logos belong to their owners."
    ],
    screens: [
      { kind: 'image', src: 'project%20media/scrolled%20home.jpg',      name: 'Home',                 caption: "today's clips on the ring." },
      { kind: 'video', src: 'project%20media/scrolled%20streak.mp4',    name: 'Streak',               caption: 'every tier has its own scene, drawn in code.', poster: 'project%20media/scrolled%20streak%20poster.jpg' },
      { kind: 'image', src: 'project%20media/scrolled%20welcome.jpg',   name: 'First screen',         caption: 'where the onboarding starts.' },
      { kind: 'image', src: 'project%20media/scrolled%20when.jpg',      name: 'When does it get you', caption: 'six rooms, one for each part of the day.' },
      { kind: 'image', src: 'project%20media/scrolled%20calendar.jpg',  name: 'Your life in weeks',   caption: 'one dot per week, one row per year.' },
      { kind: 'image', src: 'project%20media/scrolled%20allowance.jpg', name: 'How much is a day',    caption: 'picking the daily allowance.' },
      { kind: 'image', src: 'project%20media/scrolled%20promise.jpg',   name: 'Pinky promise',        caption: 'hold the pad to make it.' },
      { kind: 'image', src: 'project%20media/scrolled%20caught%20up.jpg', name: 'The ending',         caption: 'the paywall shows how a feed ends.' }
    ],
    legal: [
      { label: 'Terms of Use',   href: '/scrolled/terms',   caption: 'effective september 25, 2026.' },
      { label: 'Privacy Policy', href: '/scrolled/privacy', caption: 'effective september 25, 2026.' }
    ]
  },
  */

  dime: {
    name: 'Dime (Inverted Pendulum)',
    previewImg: 'project%20media/dimepic.png',
    meta: 'C++, Raspberry Pi, ODrive · Summer 2024',
    desc: 'A two wheeled robot that balances itself using model predictive control.',
    longDesc: [
      "Dime is a two wheeled robot that balances itself. Instead of the usual PID loop it uses model predictive control (MPC), which basically looks a little bit into the future and picks the best move. It also runs on brushless drone motors instead of cheap DC motors, which makes it a lot more agile.",
      "The Pi reads the IMU and the gamepad, runs the controller 200 times a second, and tells the ODrive how much current to send to each motor. Everything mounts on a piece of 2040 V-slot aluminum cut to 250mm, with 3D printed mounts for the electronics.",
      "Getting MPC right took forever. For a while a plain PID was honestly balancing it better, but once it was dialed in it could take a solid shove and settle right back without overshooting. It still has a tiny wobble when it's standing still that more tuning should fix.",
      "The main hardware:",
      [
        'Raspberry Pi 3B',
        'ODrive 3.5 motor controller',
        'BMI160 IMU',
        '2x Tarot 4108 brushless motors',
        '2x CUI AMT102 encoders',
        'Logitech F710 wireless gamepad',
        '5V 3A BEC to power the Pi',
        '2040 V-slot aluminum frame with 3D printed mounts'
      ]
    ],
    media: [
      { kind: 'image', type: 'photo',   src: 'project%20media/dimepic.png',         name: 'Dime, assembled',       caption: 'the finished robot.' },
      { kind: 'image', type: 'diagram', src: 'project%20media/dime%20diagram.jpeg', name: 'Exploded view diagram', caption: 'every part of the robot, pulled apart.', span: 'wide' }
    ],
    pcb: {
      glbPath: 'models%20(draco%26mobile)/dime3dmodeluncompressed.glb',
      glbPathFull: 'models%20(pc)/dime3dmodel40mb.glb',
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
    previewImg: 'project%20media/GD%20pic%202.jpg',
    meta: 'C, MSPM0G3507 · Spring 2026',
    desc: 'Geometry Dash on a microcontroller. Won 1st place in ECE319K.',
    longDesc: [
      "A DIY Geometry Dash clone running on a TI MSPM0G3507. Features beat synced levels, hand made sprites, sub-pixel collision detection and an ergonomic handheld embedded controller (the breadboard).",
      "It has three levels (Stereo Madness, Dry Out and Jumper), cube mode and ship mode (you fly the ship with a slide pot), a few skins, and you can play it in English or Spanish. It all runs at 30 FPS on a tiny 160x128 LCD.",
      "Getting the music to be read by the archaic card reader on the LCD screen was very infuriating, but rewarding. The songs stream off the SD card through the 12 bit DAC, and the jump and death sounds live in flash so they play instantly.",
      "It ended up taking 1st place in the ECE319K final project competition across every section in Spring 2026. A top 100 Geometry Dash player also beat my hardest level on it, which is in the video below."
    ],
    links: [
      { label: 'source on github', href: 'https://github.com/veneno82/Geometry-dash-MSPM0-clone' }
    ],
    media: [
      { kind: 'video', type: 'video', youtube: 'lGc8fcmo3Zs', name: 'Gameplay demo', caption: 'the showcase, plus a top 100 player beating my hardest level.', span: 'wide' },
      { kind: 'image', type: 'photo', src: 'project%20media/GD%20pic%20png.jpg', name: 'Gameplay on hardware', caption: 'a level running on the LCD.' },
      { kind: 'image', type: 'photo', src: 'project%20media/GD%20pic%202.jpg',   name: 'Showcase day',         caption: 'at the ECE319K showcase.' }
    ],
    pcb: {
      glbPath: 'models%20(draco%26mobile)/Gd%203D%20model(blended)glb.glb',
      glbPathFull: 'models%20(pc)/Gd%203D%20model(blended)glb-compressed.glb',
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
    previewImg: 'project%20media/pi%20hole%20setup.png',
    meta: 'Raspberry Pi Zero 2 W, Linux',
    desc: 'A network wide ad blocker on a Raspberry Pi Zero.',
    longDesc: [
      "A Raspberry Pi Zero running Pi-hole, a network wide ad blocker.",
      "The setup is simple: a Raspberry Pi Zero 2 W with an Adafruit PiOLED (128x32) on top for logs. A simple ethernet to USB-C adapter from my router to the Pi lets it act as a middleman between the devices on the network and the router, and it intercepts any requests that are deemed ads.",
      "Every device on the network gets ad blocking without having to install anything."
    ],
    media: [
      { kind: 'image', type: 'photo',     src: 'project%20media/pi%20hole%20setup.png',       name: 'Hardware setup',  caption: 'the Pi Zero with the OLED showing its stats.' },
      { kind: 'image', type: 'photo',     src: 'project%20media/pi-hole-dash.png',         name: 'Admin dashboard', caption: 'the Pi-hole dashboard.' },
      { kind: 'image', type: 'photo',     src: 'project%20media/pi%20hole%20performance.png', name: 'Performance',     caption: 'CPU and memory usage over a week.' }
    ],
    pcb: {
      glbPath: 'models%20(draco%26mobile)/PiHole%20render%20FINAL.glb',
      glbPathFull: 'models%20(pc)/PiHole%20render%20FINAL-compressed.glb',
      mvMinOrbit: 'auto auto 30m',
      pivotOffset: { x: 0.0, y: 0.0, z: 0.0 },
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
    previewImg: 'project%20media/bldc%20pic%20png.jpg',
    name: 'Motor Driver Board',
    meta: 'KiCad, TMC2209',
    desc: 'A simple linear BLDC motor driver.',
    longDesc: [
      "This is a simple linear BLDC motor driver. It uses a TMC2209 to handle the rotation.",
      "The main goal for this project was originally to control a high speed projectile mechanism that was unfortunately never built. Maybe one day."
    ],
    media: [
      { kind: 'image', type: 'photo',     src: 'project%20media/bldc%20pic%20png.jpg',              name: 'Fabbed board',   caption: 'the assembled board.' },
      { kind: 'image', type: 'render',    src: 'project%20media/bldc%20render%20IMAGE.png',         name: 'Render, top',    caption: 'KiCad render, top side.' },
      { kind: 'image', type: 'render',    src: 'project%20media/bldc%20render%20IMAGE%20(back).png', name: 'Render, bottom', caption: 'KiCad render, bottom side.' },
      { kind: 'image', type: 'schematic', src: 'project%20media/BLDC%20schematic.png',               name: 'Schematic',      caption: 'the full schematic.', span: 'wide' }
    ],
    pcb: {
      glbPath: 'models%20(draco%26mobile)/bldc%201%20compressed.glb',
      glbPathFull: 'models%20(pc)/final%20bldc%201.glb',
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

  sensor: {
    previewImg: 'project%20media/can2usb%20pic%20png.png',
    name: 'CAN Bootloader',
    meta: 'C, CAN, KiCad',
    desc: 'The bootloader my robotics team used on all of our CAN boards.',
    longDesc: [
      "This is a general purpose bootloader that my robotics team used on all of our CAN boards. Normally, putting new code on a board means plugging a debugger straight into it, which gets old really fast when the board is buried inside a robot. With this we could send new firmware to every board over the same CAN wires the robot already uses to talk.",
      "It also keeps a tiny config saved on each board (an ID, a name, what kind of board it is, and how many times it's been wiped) so we always knew which board was which.",
      "What it does:",
      [
        "Flashes new firmware over CAN, no touching the board",
        "It's fast. A typical firmware (a few hundred KB) goes over in a few seconds",
        "Can flash a bunch of boards at once if they all need the same firmware",
        "Keeps track of every board by its ID, name, type, and wipe count",
        "On power up it waits a few seconds for commands before starting the actual program",
        "Checks the program at boot, so a broken or half written firmware never runs"
      ]
    ],
    media: [
      { kind: 'image', type: 'photo',     src: 'project%20media/can2usb%20pic%20png.png',              name: 'Assembled board', caption: 'the assembled board.' },
      { kind: 'image', type: 'render',    src: 'project%20media/can2usb%20render%20IMAGE.png',         name: 'Render, top',     caption: 'KiCad render, top side.' },
      { kind: 'image', type: 'render',    src: 'project%20media/can2usb%20render%20IMAGE%20(back).png', name: 'Render, bottom',  caption: 'KiCad render, bottom side.' },
      { kind: 'image', type: 'schematic', src: 'project%20media/can2usb%20schematic.png',               name: 'Schematic',       caption: 'the full schematic.', span: 'wide' }
    ],
    pcb: {
      glbPath: 'models%20(draco%26mobile)/can2usb(blended).glb',
      glbPathFull: 'models%20(pc)/can2usb(blended).glb',
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
        { t: 'ic', x: 0, z: 0, w: 0.46, d: 0.46, col: 0x131313 },
        { t: 'ic', x: -0.7, z: 0.0, w: 0.22, d: 0.22, col: 0x222222 },
        { t: 'ic', x: 0.0, z: 0.6, w: 0.20, d: 0.20, col: 0x202020 },
        { t: 'ic', x: 0.7, z: 0.0, w: 0.22, d: 0.16, col: 0x1a1a1a },
        { t: 'ic', x: 0.0, z: -0.6, w: 0.18, d: 0.14, col: 0x282828 },
        { t: 'cap', x: -0.30, z: 0.30, r: 0.045, h: 0.13, col: 0x1a1a3a },
        { t: 'cap', x: 0.30, z: 0.30, r: 0.045, h: 0.13, col: 0x1a1a3a },
        { t: 'cap', x: -0.30, z: -0.30, r: 0.045, h: 0.13, col: 0x22224a },
        { t: 'cap', x: 0.30, z: -0.30, r: 0.045, h: 0.13, col: 0x22224a },
        { t: 'res', x: -0.55, z: 0.30 }, { t: 'res', x: 0.55, z: 0.30, col: 0x8a3a3a },
        { t: 'res', x: -0.55, z: -0.30, col: 0x3a6a3a }, { t: 'res', x: 0.55, z: -0.30 },
        { t: 'conn', x: -1.05, z: 0.0, w: 0.16, d: 0.50, h: 0.16, col: 0xf0f0f0 },
        { t: 'conn', x: 1.05, z: 0.0, w: 0.16, d: 0.50, h: 0.16, col: 0xf0f0f0 },
        { t: 'led', x: 0.0, z: 0.78, col: 0x00cc55 },
        { t: 'crystal', x: -0.15, z: -0.78 },
      ]
    }
  },

  heart: {
    previewImg: 'project%20media/heartpcb%20pic%20png.png',
    name: 'Heart PCB',
    meta: 'KiCad, ATtiny45, Charlieplexing',
    desc: 'A heart shaped PCB with 20 charlieplexed LEDs.',
    longDesc: [
      "Just a heart shaped PCB with 20 charlieplexed LEDs driven by an ATtiny45.",
      "Charlieplexing is a very clever way to control a large number of LEDs with very few MCU pins and resistors. An LED only lights up when current flows through it one way, so you can put two LEDs back to back between any two pins. To turn one on, I set one pin high, one pin low, and switch every other pin to an input so it basically disappears from the circuit.",
      "With n pins you get n × (n - 1) LEDs, so 5 pins gets you all 20. Only one LED is actually on at any moment, but the ATtiny cycles through them so fast that your eyes see them all lit up at once. Pretty cool stuff."
    ],
    media: [
      { kind: 'video', type: 'video',     src: 'project%20media/heartpcb%20vid.mp4',                    name: 'Animation demo', caption: 'the board running.', poster: 'project%20media/heartpcb%20vid%20poster.jpg', span: 'wide' },
      { kind: 'image', type: 'photo',     src: 'project%20media/heartpcb%20pic%20png.png',              name: 'Lit up',         caption: 'all 20 LEDs on.' },
      { kind: 'image', type: 'render',    src: 'project%20media/heartpcb%20render%20IMAGE.png',         name: 'Render, front',  caption: 'KiCad render, front side.' },
      { kind: 'image', type: 'render',    src: 'project%20media/heartpcb%20render%20(back)%20IMAGE.png', name: 'Render, back',   caption: 'KiCad render, back side.' },
      { kind: 'image', type: 'schematic', src: 'project%20media/heartpcb%20schematic.png',               name: 'Schematic',      caption: 'the full schematic.', span: 'wide' }
    ],
    pcb: {
      glbPath: 'models%20(draco%26mobile)/heartpcb.glb',
      glbPathFull: 'models%20(pc)/heartpcb.glb',
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

  comingsoon: {
    name: 'coming soon!',
    meta: '',
    desc: '',
    comingSoon: true,
  }
};
