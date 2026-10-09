(() => {
  // Moon-phase components for this unit. Load after lesson.js and before
  // cartoon-video.js (all with `defer`).
  //
  // - [data-moon="<angle>"]: renders the Moon as seen from the northern
  //   hemisphere with the Moon high in the southern sky. angle = degrees the
  //   Moon is past new moon (0 new, 90 first quarter, 180 full, 270 last
  //   quarter). Optional data-moon-label overrides the spoken shape.
  // - [data-orbit-lab], [data-sequence-game], [data-sky-lab], [data-tonight]:
  //   the unit's interactive models (markup contract in lessons/*.html).
  // - window.KnowtrailVideoCast: extra characters and props for cartoon-video.js.
  //
  // Everything runs on the device; nothing is fetched or sent.

  const SYNODIC = 29.530588861; // mean synodic month in days
  const DAY_MS = 86400000;
  const BEIJING_MS = 8 * 3600000;
  const rad = (degrees) => (degrees * Math.PI) / 180;
  const norm = (degrees) => ((degrees % 360) + 360) % 360;

  // Teaching names by lunar day (农历日). USNO data for 2024–2036 put first
  // quarter mostly on 初八/初九, full moon on 十五–十七 and last quarter around
  // 廿三 (Beijing time), hence the three-day spans. Pictures use the Moon's age.
  const PHASES = [
    { id: "new", name: "新月", days: [1, 1], waxing: true },
    { id: "waxing-crescent", name: "蛾眉月", days: [2, 6], waxing: true },
    { id: "first-quarter", name: "上弦月", days: [7, 9], waxing: true },
    { id: "waxing-gibbous", name: "凸月", days: [10, 14], waxing: true },
    { id: "full", name: "满月", days: [15, 17], waxing: true },
    { id: "waning-gibbous", name: "凸月", days: [18, 21], waxing: false },
    { id: "last-quarter", name: "下弦月", days: [22, 24], waxing: false },
    { id: "waning-crescent", name: "残月", days: [25, 29], waxing: false },
    { id: "new", name: "新月", days: [30, 30], waxing: false },
  ];
  const phaseForDay = (day) => PHASES.find((phase) => day >= phase.days[0] && day <= phase.days[1]);
  const phaseLabel = (phase) => {
    if (phase.id === "waxing-gibbous") return "凸月（越来越圆）";
    if (phase.id === "waning-gibbous") return "凸月（越来越缺）";
    return phase.name;
  };

  // Tonight's name comes from the Moon's real angle, not the lunar-day table:
  // the four main phases get a window of about ±1 day (±12°).
  const nameForAngle = (angle) => {
    const a = norm(angle);
    if (a < 12 || a > 348) return "接近新月，几乎看不到";
    if (a < 78) return "是蛾眉月";
    if (a <= 102) return "接近上弦月";
    if (a < 168) return "是凸月（越来越圆）";
    if (a <= 192) return "接近满月";
    if (a < 258) return "是凸月（越来越缺）";
    if (a <= 282) return "接近下弦月";
    return "是残月";
  };

  const DAY_NAMES = ["初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
    "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
    "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"];
  const dayName = (day) => DAY_NAMES[day - 1];

  // Average age of the Moon at hour h of lunar day n: new moon falls, on
  // average, at noon of 初一.
  const ageAt = (day, hour = 20) => day - 1.5 + hour / 24;
  const angleForAge = (age) => norm((age / SYNODIC) * 360);

  const shapeText = (angle) => {
    const a = norm(angle);
    if (a < 12 || a > 348) return "几乎全暗，看不到亮的部分";
    if (a < 80) return "右边亮着弯弯的一条";
    if (a <= 100) return "右边一半亮";
    if (a < 168) return "右边大部分亮，左边缺一块";
    if (a <= 192) return "整个圆都亮";
    if (a < 260) return "左边大部分亮，右边缺一块";
    if (a <= 280) return "左边一半亮";
    return "左边亮着弯弯的一条";
  };

  // SVG markup for the Moon disc, centred on 0,0 with radius r. Waxing shapes
  // are lit on the right; waning shapes are their mirror image.
  const moonMarkup = (angle, r = 45) => {
    const a = norm(angle);
    const cos = Math.cos(rad(a));
    const rx = Math.abs(cos) * r;
    const termSweep = cos > 0 ? 0 : 1;
    const lit = `M0,${-r} A${r},${r} 0 0 1 0,${r} A${rx.toFixed(2)},${r} 0 0 ${termSweep} 0,${-r} Z`;
    const mirror = a > 180 ? ' transform="scale(-1 1)"' : "";
    return `<circle class="moon-dark" r="${r}"/>`
      + `<path class="moon-lit" d="${lit}"${mirror}/>`
      + `<circle class="moon-rim" r="${r}" fill="none"/>`;
  };

  const moonSvg = (angle, label) => `<svg class="moon-svg" viewBox="-50 -50 100 100" role="img" aria-label="${label || shapeText(angle)}" focusable="false">${moonMarkup(angle)}</svg>`;

  document.querySelectorAll("[data-moon]").forEach((element) => {
    element.innerHTML = moonSvg(Number(element.dataset.moon), element.dataset.moonLabel);
  });

  // [data-orbit-mini="<angle>"]: small top view for quizzes and paper. Sunlight
  // comes from the left; the Moon sits `angle` degrees past new moon,
  // counter-clockwise (seen from above the North Pole).
  const SIDES = ["右", "右上", "上", "左上", "左", "左下", "下", "右下"];
  const sideOf = (phi) => SIDES[Math.round(norm(phi) / 45) % 8];
  document.querySelectorAll("[data-orbit-mini]").forEach((element, index) => {
    const angle = Number(element.dataset.orbitMini);
    const phi = 180 + angle;
    const mx = 120 + 50 * Math.cos(rad(phi));
    const my = 75 - 50 * Math.sin(rad(phi));
    const label = element.dataset.orbitMiniLabel || `俯视图：阳光从左边照来，月球在地球的${sideOf(phi)}边`;
    const rays = [30, 60, 90, 120].map((y) => `<path class="orbit-ray" d="M8,${y} H40" marker-end="url(#mini-arrow-${index})"/>`).join("");
    element.innerHTML = `<svg class="orbit-mini-svg" viewBox="0 0 200 150" role="img" aria-label="${label}" focusable="false">
      <defs><marker id="mini-arrow-${index}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" class="orbit-ray-head"/></marker></defs>
      <rect class="orbit-space" width="200" height="150" rx="10"/>${rays}
      <circle class="orbit-path" cx="120" cy="75" r="50"/>
      <g transform="translate(120 75)"><circle class="earth-day" r="15"/><path class="earth-night" d="M0,-15 A15,15 0 0 1 0,15 Z"/><circle class="earth-rim" r="15"/></g>
      <g transform="translate(${mx.toFixed(1)} ${my.toFixed(1)})"><circle class="moon-dark" r="10"/><path class="moon-lit" d="M0,-10 A10,10 0 0 0 0,10 Z"/><circle class="moon-rim" r="10" fill="none"/></g>
    </svg>`;
  });

  /* ---------- Astronomy: true new moons (Meeus, Astronomical Algorithms ch. 49) ---------- */

  const newMoonJde = (k) => {
    const T = k / 1236.85;
    const T2 = T * T;
    const T3 = T2 * T;
    const T4 = T3 * T;
    const s = (degrees) => Math.sin(rad(degrees));
    const E = 1 - 0.002516 * T - 0.0000074 * T2;
    const M = 2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3;
    const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4;
    const F = 160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4;
    const O = 124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3;
    let jde = 2451550.09766 + SYNODIC * k + 0.00015437 * T2 - 0.00000015 * T3 + 0.00000000073 * T4;
    jde += -0.4072 * s(Mp) + 0.17241 * E * s(M) + 0.01608 * s(2 * Mp) + 0.01039 * s(2 * F)
      + 0.00739 * E * s(Mp - M) - 0.00514 * E * s(Mp + M) + 0.00208 * E * E * s(2 * M)
      - 0.00111 * s(Mp - 2 * F) - 0.00057 * s(Mp + 2 * F) + 0.00056 * E * s(2 * Mp + M)
      - 0.00042 * s(3 * Mp) + 0.00042 * E * s(M + 2 * F) + 0.00038 * E * s(M - 2 * F)
      - 0.00024 * E * s(2 * Mp - M) - 0.00017 * s(O) - 0.00007 * s(Mp + 2 * M)
      + 0.00004 * s(2 * Mp - 2 * F) + 0.00004 * s(3 * M) + 0.00003 * s(Mp + M - 2 * F)
      + 0.00003 * s(2 * Mp + 2 * F) - 0.00003 * s(Mp + M + 2 * F) + 0.00003 * s(Mp - M + 2 * F)
      - 0.00002 * s(Mp - M - 2 * F) - 0.00002 * s(3 * Mp + M) + 0.00002 * s(4 * Mp);
    const planetary = [
      [0.000325, 299.77 + 0.107408 * k - 0.009173 * T2], [0.000165, 251.88 + 0.016321 * k],
      [0.000164, 251.83 + 26.651886 * k], [0.000126, 349.42 + 36.412478 * k],
      [0.00011, 84.66 + 18.206239 * k], [0.000062, 141.74 + 53.303771 * k],
      [0.00006, 207.14 + 2.453732 * k], [0.000056, 154.84 + 7.30686 * k],
      [0.000047, 34.52 + 27.261239 * k], [0.000042, 207.19 + 0.121824 * k],
      [0.00004, 291.34 + 1.844379 * k], [0.000037, 161.72 + 24.198154 * k],
      [0.000035, 239.56 + 25.513099 * k], [0.000023, 331.55 + 3.592518 * k],
    ];
    planetary.forEach(([coefficient, argument]) => { jde += coefficient * s(argument); });
    return jde;
  };

  const DELTA_T_DAYS = 69 / 86400; // TT − UT, about 69 s in the 2020s
  const newMoonMs = (k) => (newMoonJde(k) - DELTA_T_DAYS - 2440587.5) * DAY_MS;

  // Latest true new moon strictly before the instant `ms`.
  const lastNewMoonBefore = (ms) => {
    let k = Math.floor((ms / DAY_MS + 2440587.5 - 2451550.09766) / SYNODIC);
    while (newMoonMs(k) >= ms) k -= 1;
    while (newMoonMs(k + 1) < ms) k += 1;
    return newMoonMs(k);
  };

  const beijingDayNumber = (ms) => Math.floor((ms + BEIJING_MS) / DAY_MS);

  // Lunar day (农历日) of a Beijing calendar date: 初一 is the day that
  // contains the new moon, in Beijing time.
  const lunarDayOf = (ms) => {
    const today = beijingDayNumber(ms);
    const endOfToday = (today + 1) * DAY_MS - BEIJING_MS;
    const newMoon = lastNewMoonBefore(endOfToday);
    return today - beijingDayNumber(newMoon) + 1;
  };

  // Moon–Sun angle (elongation, degrees past new moon) at the instant `ms`,
  // from low-precision ecliptic longitudes (main terms of Meeus ch. 47 and the
  // Astronomical Almanac solar formula). The Moon's speed varies, so the age in
  // days alone can be off by about 10° near full moon.
  const elongationAt = (ms) => {
    const d = ms / DAY_MS + 2440587.5 - 2451545.0;
    const s = (degrees) => Math.sin(rad(degrees));
    const g = 357.529 + 0.98560028 * d;
    const sun = 280.459 + 0.98564736 * d + 1.915 * s(g) + 0.02 * s(2 * g);
    const D = 297.8502 + 12.19074912 * d;
    const Mp = 134.9634 + 13.06499295 * d;
    const F = 93.2721 + 13.22935024 * d;
    const moon = 218.3165 + 13.17639648 * d + 6.289 * s(Mp) + 1.274 * s(2 * D - Mp)
      + 0.658 * s(2 * D) + 0.214 * s(2 * Mp) - 0.186 * s(g) - 0.114 * s(2 * F);
    return norm(moon - sun);
  };

  // Age of the Moon (days since the last new moon) at the instant `ms`.
  const moonAgeAt = (ms) => (ms - lastNewMoonBefore(ms)) / DAY_MS;

  /* ---------- Shared widget helpers ---------- */

  const enableCompletion = (container, message) => {
    const button = container.querySelector("[data-complete-checkpoint]");
    const feedback = container.querySelector("[data-lab-feedback]");
    if (container.dataset.complete === "true" || !button) return;
    button.disabled = false;
    button.setAttribute("aria-disabled", "false");
    if (feedback) {
      feedback.textContent = message;
      feedback.classList.add("correct");
    }
  };

  const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Orbit lab: Sun on the left, view from above the North Pole ---------- */

  const ORBIT = { cx: 270, cy: 165, r: 112, earth: 30, moon: 19 };

  const orbitSvgBase = () => `
    <defs>
      <marker id="orbit-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" class="orbit-ray-head"/></marker>
    </defs>
    <rect class="orbit-space" width="460" height="330" rx="14"/>
    <g class="orbit-sun"><circle cx="-30" cy="165" r="70"/></g>
    <text class="orbit-text" x="14" y="28">阳光</text>
    ${[60, 115, 215, 270].map((y) => `<path class="orbit-ray" d="M48,${y} H120" marker-end="url(#orbit-arrow)"/>`).join("")}
    <circle class="orbit-path" cx="${ORBIT.cx}" cy="${ORBIT.cy}" r="${ORBIT.r}"/>
    ${[["初一", 180], ["初八", 270], ["十五", 0], ["廿三", 90]].map(([label, phi]) => {
      const x = ORBIT.cx + (ORBIT.r + 34) * Math.cos(rad(phi));
      const y = ORBIT.cy - (ORBIT.r + 34) * Math.sin(rad(phi)) + 5;
      return `<text class="orbit-tick" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle">${label}</text>`;
    }).join("")}
    <g transform="translate(${ORBIT.cx} ${ORBIT.cy})">
      <circle class="earth-day" r="${ORBIT.earth}"/>
      <path class="earth-night" d="M0,${-ORBIT.earth} A${ORBIT.earth},${ORBIT.earth} 0 0 1 0,${ORBIT.earth} Z"/>
      <circle class="earth-rim" r="${ORBIT.earth}"/>
    </g>
    <text class="orbit-text" x="${ORBIT.cx}" y="${ORBIT.cy + 52}" text-anchor="middle">地球</text>
    <line class="orbit-sight" data-orbit-sight/>
    <circle class="orbit-observer" r="5" data-orbit-observer/>
    <g data-orbit-moon>
      <circle class="moon-dark" r="${ORBIT.moon}"/>
      <path class="moon-lit" d="M0,${-ORBIT.moon} A${ORBIT.moon},${ORBIT.moon} 0 0 0 0,${ORBIT.moon} Z"/>
      <circle class="moon-rim" r="${ORBIT.moon}" fill="none"/>
      <path class="orbit-facing" data-orbit-facing/>
    </g>
    <text class="orbit-text" data-orbit-moon-label text-anchor="middle">月球</text>`;

  document.querySelectorAll("[data-orbit-lab]").forEach((lab) => {
    const svg = lab.querySelector("[data-orbit-svg]");
    const eye = lab.querySelector("[data-orbit-eye]");
    const slider = lab.querySelector("[data-orbit-day]");
    const dayLabel = lab.querySelector("[data-orbit-day-label]");
    const readout = lab.querySelector("[data-orbit-readout]");
    const playButton = lab.querySelector("[data-orbit-play]");
    const required = (lab.dataset.orbitRequired || "new first-quarter full last-quarter").split(/\s+/);
    const seen = new Set();
    let timer = null;

    svg.setAttribute("viewBox", "0 0 460 330");
    svg.innerHTML = orbitSvgBase();
    const moon = svg.querySelector("[data-orbit-moon]");
    const facing = svg.querySelector("[data-orbit-facing]");
    const moonLabel = svg.querySelector("[data-orbit-moon-label]");
    const observer = svg.querySelector("[data-orbit-observer]");
    const sight = svg.querySelector("[data-orbit-sight]");

    const render = (announce = false) => {
      const day = Number(slider.value);
      const angle = angleForAge(ageAt(day));
      const phase = phaseForDay(day);
      const phi = 180 + angle; // Moon's position, counter-clockwise from the right
      const mx = ORBIT.cx + ORBIT.r * Math.cos(rad(phi));
      const my = ORBIT.cy - ORBIT.r * Math.sin(rad(phi));
      moon.setAttribute("transform", `translate(${mx.toFixed(1)} ${my.toFixed(1)})`);
      // Dashed arc: the half of the Moon that faces Earth.
      const toEarth = phi + 180;
      const arcR = ORBIT.moon + 6;
      const p1 = [arcR * Math.cos(rad(toEarth - 90)), -arcR * Math.sin(rad(toEarth - 90))];
      const p2 = [arcR * Math.cos(rad(toEarth + 90)), -arcR * Math.sin(rad(toEarth + 90))];
      facing.setAttribute("d", `M${p1[0].toFixed(1)},${p1[1].toFixed(1)} A${arcR},${arcR} 0 0 0 ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`);
      const ox = ORBIT.cx + ORBIT.earth * Math.cos(rad(phi));
      const oy = ORBIT.cy - ORBIT.earth * Math.sin(rad(phi));
      observer.setAttribute("cx", ox.toFixed(1));
      observer.setAttribute("cy", oy.toFixed(1));
      sight.setAttribute("x1", ox.toFixed(1));
      sight.setAttribute("y1", oy.toFixed(1));
      sight.setAttribute("x2", (mx - (ORBIT.moon + 8) * Math.cos(rad(phi))).toFixed(1));
      sight.setAttribute("y2", (my + (ORBIT.moon + 8) * Math.sin(rad(phi))).toFixed(1));
      // Label the Moon a little further along its orbit, clear of Earth's label.
      moonLabel.setAttribute("x", (ORBIT.cx + ORBIT.r * Math.cos(rad(phi + 24))).toFixed(1));
      moonLabel.setAttribute("y", (ORBIT.cy - ORBIT.r * Math.sin(rad(phi + 24)) + 5).toFixed(1));

      const name = phaseLabel(phase);
      eye.innerHTML = moonSvg(angle, `从地球上看：${shapeText(angle)}`);
      dayLabel.textContent = `农历${dayName(day)}`;
      slider.setAttribute("aria-valuetext", `农历${dayName(day)}，${name}`);
      svg.setAttribute("aria-label", `俯视图：阳光从左边照来，月球朝太阳的一半总是亮的。农历${dayName(day)}，月球在地球的${["右", "上", "左", "下"][Math.round(norm(phi) / 90) % 4]}边。`);
      const text = `农历${dayName(day)}：${name}。从地球上看，${shapeText(angle)}。`;
      if (readout) readout.textContent = text;
      if (announce && readout) readout.setAttribute("aria-live", "polite");

      seen.add(phase.id);
      if (required.every((id) => seen.has(id))) {
        enableCompletion(lab, "新月、上弦月、满月、下弦月都找到了。说一说：月球亮的一半朝着哪里？");
      }
    };

    const stop = () => {
      clearInterval(timer);
      timer = null;
      if (playButton) playButton.textContent = "▶ 连续走一个月";
    };

    const step = (delta) => {
      const next = Math.min(30, Math.max(1, Number(slider.value) + delta));
      slider.value = String(next);
      render(true);
    };

    slider.addEventListener("input", () => { stop(); render(true); });
    lab.querySelector("[data-orbit-prev]")?.addEventListener("click", () => { stop(); step(-1); });
    lab.querySelector("[data-orbit-next]")?.addEventListener("click", () => { stop(); step(1); });
    playButton?.addEventListener("click", () => {
      if (timer) { stop(); return; }
      if (Number(slider.value) >= 30) slider.value = "1";
      playButton.textContent = "❚❚ 停下";
      timer = setInterval(() => {
        if (Number(slider.value) >= 30) { stop(); return; }
        step(1);
      }, prefersReducedMotion() ? 1200 : 650);
    });
    render();
  });

  /* ---------- Sequence game: tap the phases in order ---------- */

  document.querySelectorAll("[data-sequence-game]").forEach((game) => {
    const track = game.querySelector("[data-sequence-track]");
    const pool = game.querySelector("[data-sequence-pool]");
    const feedback = game.querySelector("[data-sequence-feedback]");
    const cards = [...pool.querySelectorAll("[data-moon-card]")];
    const order = [...cards].sort((a, b) => Number(a.dataset.moonCard) - Number(b.dataset.moonCard));
    const slots = [...track.querySelectorAll("li")];
    let placed = 0;

    cards.forEach((card) => {
      const angle = Number(card.dataset.moonCard);
      card.innerHTML = moonSvg(angle);
    });

    const place = (card) => {
      const slot = slots[placed];
      const angle = Number(card.dataset.moonCard);
      slot.innerHTML = `${moonSvg(angle)}<span class="sequence-name">${card.dataset.name || ""}</span>`;
      slot.classList.add("is-filled");
      card.hidden = true;
      placed += 1;
    };

    const finish = () => {
      if (feedback) {
        feedback.textContent = game.dataset.success || "排好了！亮的部分先从右边变多，满月以后从右边开始变少。";
        feedback.classList.add("correct");
        feedback.classList.remove("incorrect");
      }
      enableCompletion(game, game.dataset.success || "排好了！");
    };

    if (game.dataset.complete === "true") {
      order.forEach(place);
      finish();
      return;
    }

    cards.forEach((card) => {
      card.addEventListener("click", () => {
        const expected = order[placed];
        if (card === expected) {
          place(card);
          if (feedback) {
            feedback.textContent = placed === order.length ? "" : `对！第 ${placed} 张放好了，下一张是哪一个？`;
            feedback.classList.add("correct");
            feedback.classList.remove("incorrect");
          }
          if (placed === order.length) finish();
          else pool.querySelector("[data-moon-card]:not([hidden])")?.focus();
          return;
        }
        const angle = Number(card.dataset.moonCard);
        const want = Number(expected.dataset.moonCard);
        let hint = "再比一比：亮的部分每天只变一点点，选和上一张最像、只多变了一点的那张。";
        if (want <= 180 && angle > 180) hint = "前半个月，亮光先出现在右边，越来越多。这张是左边亮，后面才轮到它。";
        if (want > 180 && angle > want) hint = "满月以后，月亮从右边开始变缺。先选缺得少一点的那张。";
        if (want === 0) hint = "一个月从新月开始：先找完全暗、看不到亮面的那张。";
        card.classList.add("is-wrong");
        setTimeout(() => card.classList.remove("is-wrong"), 700);
        if (feedback) {
          feedback.textContent = hint;
          feedback.classList.add("incorrect");
          feedback.classList.remove("correct");
        }
      });
    });
  });

  /* ---------- Sky lab: where is the Moon at a given hour? ---------- */

  const SKY = { cx: 230, cy: 210, rx: 190, ry: 150 };
  const skyPoint = (hoursSinceRise) => {
    const beta = 180 - hoursSinceRise * 15;
    return {
      x: SKY.cx + SKY.rx * Math.cos(rad(beta)),
      y: SKY.cy - SKY.ry * Math.sin(rad(beta)),
      altitude: Math.sin(rad(beta)),
    };
  };
  const clockText = (hour) => {
    const h = Math.floor(hour);
    const m = hour % 1 ? "30" : "00";
    let part = "上午";
    if (h < 5) part = "凌晨";
    else if (h < 8) part = "清晨";
    else if (h < 12) part = "上午";
    else if (h < 17) part = "下午";
    else if (h < 19) part = "傍晚";
    else part = "晚上";
    const twelve = h % 12 === 0 ? 12 : h % 12;
    if (h === 0) return `半夜 12:${m}`;
    return `${part} ${twelve}:${m}`;
  };

  const skyState = (day, hour) => {
    const age = ageAt(day, hour);
    const elongation = angleForAge(age);
    const sun = skyPoint(hour - 6);
    const moon = skyPoint(hour - 6 - elongation / 15);
    const nearSun = elongation < 20 || elongation > 340;
    const dark = sun.altitude < -0.08;
    const twilight = !dark && sun.altitude < 0.08;
    const up = moon.altitude > 0.03;
    let where = "南边";
    if (moon.x < SKY.cx - SKY.rx / 3) where = "东边";
    else if (moon.x > SKY.cx + SKY.rx / 3) where = "西边";
    const height = moon.altitude < 0.5 ? "低低的" : "高高的";
    let visibility;
    if (!up) visibility = "在地平线下面，看不到";
    else if (nearSun) visibility = "离太阳太近，被阳光淹没，看不到";
    else if (dark || twilight) visibility = `在${where}天空，${height}，能看到`;
    else visibility = `在${where}天空，${height}；白天天很亮，月亮颜色淡，要仔细找`;
    return { age, elongation, sun, moon, nearSun, dark, twilight, up, visibility };
  };

  document.querySelectorAll("[data-sky-lab]").forEach((lab) => {
    const svg = lab.querySelector("[data-sky-svg]");
    const daySlider = lab.querySelector("[data-sky-day]");
    const timeSlider = lab.querySelector("[data-sky-time]");
    const dayLabel = lab.querySelector("[data-sky-day-label]");
    const timeLabel = lab.querySelector("[data-sky-time-label]");
    const readout = lab.querySelector("[data-sky-readout]");
    const needed = Number(lab.dataset.skyRequired || 4);
    const seen = new Set();

    svg.setAttribute("viewBox", "0 0 460 270");
    const stars = Array.from({ length: 22 }, (_, i) => {
      const x = (i * 97) % 440 + 10;
      const y = (i * 53) % 150 + 12;
      return `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.4 : 2.2}"/>`;
    }).join("");
    svg.innerHTML = `
      <rect class="sky-bg" data-sky-bg width="460" height="270"/>
      <g class="sky-stars" data-sky-stars>${stars}</g>
      <path class="sky-path" d="M${SKY.cx - SKY.rx},${SKY.cy} A${SKY.rx},${SKY.ry} 0 0 1 ${SKY.cx + SKY.rx},${SKY.cy}"/>
      <g data-sky-sun><circle class="sky-sun" r="18"/></g>
      <g data-sky-moon><g data-sky-moon-disc></g></g>
      <rect class="sky-ground" y="${SKY.cy}" width="460" height="${270 - SKY.cy}"/>
      <text class="sky-dir" x="${SKY.cx - SKY.rx + 4}" y="${SKY.cy + 28}" text-anchor="middle">东</text>
      <text class="sky-dir" x="${SKY.cx}" y="${SKY.cy + 28}" text-anchor="middle">南</text>
      <text class="sky-dir" x="${SKY.cx + SKY.rx - 4}" y="${SKY.cy + 28}" text-anchor="middle">西</text>
      <text class="sky-note" x="${SKY.cx}" y="${SKY.cy + 50}" text-anchor="middle">面朝南方看天空</text>`;
    const bg = svg.querySelector("[data-sky-bg]");
    const starLayer = svg.querySelector("[data-sky-stars]");
    const sunLayer = svg.querySelector("[data-sky-sun]");
    const moonLayer = svg.querySelector("[data-sky-moon]");
    const moonDisc = svg.querySelector("[data-sky-moon-disc]");

    const render = () => {
      const day = Number(daySlider.value);
      const hour = Number(timeSlider.value);
      const state = skyState(day, hour);
      const phase = phaseForDay(day);
      bg.setAttribute("class", `sky-bg ${state.dark ? "is-night" : state.twilight ? "is-twilight" : "is-day"}`);
      starLayer.style.opacity = state.dark ? "1" : "0";
      sunLayer.setAttribute("transform", `translate(${state.sun.x.toFixed(1)} ${state.sun.y.toFixed(1)})`);
      // The lit side of the Moon always points towards the Sun.
      const toSun = Math.atan2(state.sun.y - state.moon.y, state.sun.x - state.moon.x) * 180 / Math.PI;
      const turn = state.elongation <= 180 ? toSun : toSun - 180;
      moonLayer.setAttribute("transform", `translate(${state.moon.x.toFixed(1)} ${state.moon.y.toFixed(1)})`);
      moonDisc.setAttribute("transform", `rotate(${turn.toFixed(1)}) scale(0.38)`);
      moonDisc.innerHTML = moonMarkup(state.elongation);
      moonLayer.style.opacity = state.nearSun ? "0.25" : "1";

      dayLabel.textContent = `农历${dayName(day)}（${phaseLabel(phase)}）`;
      timeLabel.textContent = clockText(hour);
      daySlider.setAttribute("aria-valuetext", `农历${dayName(day)}，${phaseLabel(phase)}`);
      timeSlider.setAttribute("aria-valuetext", clockText(hour));
      let sunText = state.sun.altitude > 0.03 ? "太阳在天上" : "太阳在地平线下面";
      if (Math.abs(state.sun.altitude) <= 0.03) sunText = hour < 12 ? "太阳正从东边升起" : "太阳正在西边落下";
      const text = `农历${dayName(day)} ${clockText(hour)}：${phaseLabel(phase)}${state.visibility}。${sunText}。`;
      readout.textContent = text;
      svg.setAttribute("aria-label", text);

      if (hour === 6 || hour === 18) {
        seen.add(`${day}-${hour}`);
        const windows = new Set([...seen].map((key) => key.split("-")[1]));
        if (seen.size >= needed && windows.size === 2) {
          enableCompletion(lab, "你已经在傍晚和清晨都查过月亮了。找到规律了吗？");
        }
      }
    };

    daySlider.addEventListener("input", render);
    timeSlider.addEventListener("input", render);
    lab.querySelectorAll("[data-sky-at]").forEach((button) => {
      button.addEventListener("click", () => {
        timeSlider.value = button.dataset.skyAt;
        render();
      });
    });
    lab.querySelectorAll("[data-sky-today]").forEach((button) => {
      button.addEventListener("click", () => {
        daySlider.value = String(lunarDayOf(Date.now()));
        render();
      });
    });
    render();
  });

  /* ---------- Tonight: estimate from this device's date ---------- */

  document.querySelectorAll("[data-tonight]").forEach((box) => {
    const now = Date.now();
    const day = lunarDayOf(now);
    const today = beijingDayNumber(now);
    const evening = today * DAY_MS - BEIJING_MS + 20 * 3600000; // 20:00 Beijing time
    const angle = elongationAt(evening);
    const picture = box.querySelector("[data-tonight-moon]");
    const text = box.querySelector("[data-tonight-text]");
    if (picture) picture.innerHTML = moonSvg(angle, `今晚 8 点前后的月亮：${shapeText(angle)}`);
    if (text) {
      text.textContent = `按这台设备的日期，今天大约是农历${dayName(day)}，今晚 8 点前后的月亮${nameForAngle(angle)}。以日历上的农历日期为准。`;
    }
    box.hidden = false;
  });

  /* ---------- Characters and props for cartoon-video.js ---------- */

  const sunProp = () => `
    <g class="sun-rays">${Array.from({ length: 12 }, (_, i) => `<path d="M0,-92 L0,-122" transform="rotate(${i * 30})" stroke="#f6a623" stroke-width="12" stroke-linecap="round"/>`).join("")}</g>
    <circle r="78" fill="#ffd23f" stroke="#f6a623" stroke-width="6"/>`;

  window.KnowtrailVideoCast = {
    owl: () => `
      <g class="ow">
        <g transform="translate(-66 -128)"><g class="ow-wing-back">
          <path d="M0,0 C-38,18 -44,84 -12,116 C4,84 8,40 0,0 Z" fill="#5d4330"/>
        </g></g>
        <ellipse cx="0" cy="-92" rx="74" ry="92" fill="#8b6b4a"/>
        <ellipse cx="0" cy="-70" rx="50" ry="62" fill="#f4e3c3"/>
        <path d="M-20,-92 l8,8 l8,-8 M4,-92 l8,8 l8,-8 M-8,-66 l8,8 l8,-8 M-28,-44 l8,8 l8,-8 M12,-44 l8,8 l8,-8" stroke="#c9a77b" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M-30,0 v-12 M-40,0 l10,-12 M-20,0 l-10,-12 M30,0 v-12 M20,0 l10,-12 M40,0 l-10,-12" stroke="#e8902c" stroke-width="7" stroke-linecap="round"/>
        <g transform="translate(0 -176)"><g class="ow-head">
          <path d="M-60,-62 L-72,-118 L-26,-80 Z" fill="#5d4330"/>
          <path d="M60,-62 L72,-118 L26,-80 Z" fill="#5d4330"/>
          <ellipse cx="0" cy="-40" rx="80" ry="66" fill="#8b6b4a"/>
          <circle cx="-33" cy="-42" r="35" fill="#f4e3c3"/>
          <circle cx="33" cy="-42" r="35" fill="#f4e3c3"/>
          <g transform="translate(-33 -42)"><g class="ow-eye"><circle r="22" fill="#fff"/><circle r="13" fill="#24180f"/><circle cx="5" cy="-5" r="5" fill="#fff"/></g></g>
          <g transform="translate(33 -42)"><g class="ow-eye"><circle r="22" fill="#fff"/><circle r="13" fill="#24180f"/><circle cx="5" cy="-5" r="5" fill="#fff"/></g></g>
          <circle cx="-58" cy="-8" r="9" fill="#f28b82" opacity=".55"/>
          <circle cx="58" cy="-8" r="9" fill="#f28b82" opacity=".55"/>
          <g transform="translate(0 2)"><path class="ow-beak-open" d="M-8,0 L8,0 L0,13 Z" fill="#b8641f"/></g>
          <path d="M-12,-16 L12,-16 L0,6 Z" fill="#f2a33a"/>
        </g></g>
        <g transform="translate(66 -128)"><g class="ow-wing">
          <path d="M0,0 C38,18 44,84 12,116 C-4,84 -8,40 0,0 Z" fill="#5d4330"/>
        </g></g>
        <text class="ow-exclaim" x="92" y="-290" font-size="90" font-weight="900" fill="#c62828">!</text>
        <text class="ow-question" x="88" y="-290" font-size="80" font-weight="900" fill="#31289c">?</text>
      </g>`,
    moon: (angle = "180") => `<g class="video-moon">${moonMarkup(Number(angle), 60)}</g>`,
    "moon-top": () => `
      <circle r="34" fill="#4a5163"/>
      <path d="M0,-34 A34,34 0 0 0 0,34 Z" fill="#fff2b3"/>
      <circle r="34" fill="none" stroke="#1c2233" stroke-width="4"/>`,
    sun: sunProp,
    earth: (night = "") => `
      <circle r="60" fill="#3b82c4"/>
      <path d="M-34,-36 C-10,-50 14,-30 6,-12 C-2,4 -30,0 -38,-14 Z M10,14 C30,6 48,20 40,40 C26,52 6,40 10,14 Z M-46,18 C-34,14 -24,30 -32,40 C-42,40 -50,30 -46,18 Z" fill="#5fb35a"/>
      ${night ? '<path d="M0,-60 A60,60 0 0 1 0,60 Z" fill="#0b1430" opacity=".55"/>' : ""}
      <circle r="60" fill="none" stroke="#1c3d66" stroke-width="5"/>`,
    flashlight: () => `
      <path class="beam" d="M60,-18 L330,-120 L330,120 L60,18 Z" fill="#fff3a6" opacity=".45"/>
      <rect x="-70" y="-22" width="110" height="44" rx="12" fill="#3d6fb6" stroke="#1d3a66" stroke-width="5"/>
      <path d="M40,-30 L66,-38 L66,38 L40,30 Z" fill="#9db7dc" stroke="#1d3a66" stroke-width="5" stroke-linejoin="round"/>
      <rect x="-40" y="-30" width="22" height="10" rx="4" fill="#1d3a66"/>`,
    ball: () => `
      <path d="M0,40 L0,170" stroke="#9a6b3d" stroke-width="10" stroke-linecap="round"/>
      <circle r="40" fill="#f2f2ee" stroke="#6b6f7a" stroke-width="4"/>`,
    calendar: (label = "") => `
      <rect x="-80" y="-96" width="160" height="176" rx="16" fill="#fffaf0" stroke="#7a2418" stroke-width="5"/>
      <rect x="-80" y="-96" width="160" height="48" rx="16" fill="#d94f3d"/>
      <rect x="-80" y="-64" width="160" height="16" fill="#d94f3d"/>
      <text x="0" y="-62" text-anchor="middle" font-size="28" font-weight="800" fill="#fff">农历</text>
      <text x="0" y="30" text-anchor="middle" font-size="56" font-weight="900" fill="#3b2410">${label}</text>`,
    star: () => '<path d="M0,-14 L4,-4 L14,-4 L6,3 L9,13 L0,7 L-9,13 L-6,3 L-14,-4 L-4,-4 Z" fill="#ffe680"/>',
    cloud: () => `
      <path d="M-70,20 C-90,20 -92,-12 -66,-14 C-62,-44 -22,-48 -10,-26 C2,-52 48,-46 50,-14 C78,-16 84,20 60,20 Z" fill="#fff" stroke="#c7d3e3" stroke-width="4"/>`,
  };

  window.KnowtrailMoon = { elongationAt, nameForAngle, moonSvg, moonMarkup, shapeText, lunarDayOf, moonAgeAt, newMoonMs, phaseForDay, ageAt, angleForAge, skyState, dayName };
})();
