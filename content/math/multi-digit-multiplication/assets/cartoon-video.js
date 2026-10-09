(() => {
  // Cartoon "video" player: an SVG stage driven by a timeline, with captions,
  // chapters, seeking, pause-to-predict prompts and optional on-device narration.
  //
  // Contract (see lessons/0001-*.html):
  // - [data-video-shots] > li is the single source of the timeline and the
  //   readable transcript: data-shot (id), data-duration (seconds), optional
  //   data-chapter, data-pose (squirrel pose) and data-prompt (prompt id).
  // - Stage layers use data-from / data-until (shot ids), optional data-delay
  //   (seconds after data-from begins) and data-focus (space-separated ids).
  //   The stage also gets data-shot, data-pose and past-<id> classes.
  // - A layer that moves never carries a transform attribute: position its
  //   children instead, so CSS transforms do not replace the placement.
  // - [data-character] and [data-prop] placeholders are filled from CAST.

  const cone = () => `
    <path d="M0,-24 C15,-24 19,0 0,24 C-19,0 -15,-24 0,-24 Z" fill="#8b5a2b" stroke="#5c3a1a" stroke-width="3"/>
    <path d="M-10,-8 H10 M-12,4 H12 M-8,15 H8" stroke="#5c3a1a" stroke-width="3" stroke-linecap="round"/>`;

  const CAST = {
    squirrel: () => `
      <g class="sq">
        <g transform="translate(-40 -55)"><g class="sq-tail">
          <path d="M0,0 C-75,5 -125,-85 -105,-160 C-90,-215 -25,-225 -5,-185 C8,-155 -25,-150 -45,-125 C-70,-90 -40,-40 15,-30 Z" fill="#b5541c"/>
          <path d="M-12,-22 C-62,-25 -95,-95 -82,-150 C-74,-185 -40,-195 -25,-180 C-55,-150 -70,-95 -12,-22 Z" fill="#dc8a45"/>
        </g></g>
        <g transform="translate(-15 -112)"><g class="sq-arm-back">
          <path d="M0,0 L-22,44" stroke="#9c4a17" stroke-width="20" stroke-linecap="round"/>
          <circle cx="-22" cy="46" r="12" fill="#9c4a17"/>
        </g></g>
        <ellipse cx="0" cy="-82" rx="60" ry="74" fill="#c8682a"/>
        <ellipse cx="14" cy="-72" rx="34" ry="50" fill="#f7deb8"/>
        <ellipse cx="-24" cy="-8" rx="30" ry="12" fill="#9c4a17"/>
        <ellipse cx="34" cy="-8" rx="30" ry="12" fill="#9c4a17"/>
        <g transform="translate(15 -140)"><g class="sq-head">
          <path d="M-45,-95 L-55,-150 L-15,-108 Z" fill="#b5541c"/>
          <path d="M25,-108 L45,-152 L58,-95 Z" fill="#b5541c"/>
          <ellipse cx="0" cy="-55" rx="64" ry="56" fill="#c8682a"/>
          <ellipse cx="10" cy="-33" rx="34" ry="23" fill="#f7deb8"/>
          <circle cx="-44" cy="-38" r="10" fill="#f28b82" opacity=".6"/>
          <circle cx="54" cy="-38" r="10" fill="#f28b82" opacity=".6"/>
          <g transform="translate(-20 -64)"><g class="sq-eye">
            <ellipse rx="10" ry="13" fill="#2a1a10"/><circle cx="3" cy="-5" r="4" fill="#fff"/>
          </g></g>
          <g transform="translate(28 -64)"><g class="sq-eye">
            <ellipse rx="10" ry="13" fill="#2a1a10"/><circle cx="3" cy="-5" r="4" fill="#fff"/>
          </g></g>
          <ellipse cx="14" cy="-44" rx="8" ry="6" fill="#4a2a17"/>
          <path d="M0,-30 Q12,-20 24,-30" stroke="#4a2a17" stroke-width="4" fill="none" stroke-linecap="round"/>
          <g transform="translate(12 -24)"><ellipse class="sq-mouth-open" rx="9" ry="8" fill="#7a2626"/></g>
        </g></g>
        <g transform="translate(30 -112)"><g class="sq-arm-front">
          <path d="M0,0 L34,44" stroke="#9c4a17" stroke-width="20" stroke-linecap="round"/>
          <circle cx="36" cy="47" r="12" fill="#9c4a17"/>
        </g></g>
        <text class="sq-exclaim" x="95" y="-270" font-size="90" font-weight="900" fill="#c62828">!</text>
        <text class="sq-question" x="90" y="-270" font-size="80" font-weight="900" fill="#31289c">?</text>
      </g>`,
    basket: (label = "") => `
      <g transform="translate(-30 -66)">${cone()}</g>
      <g transform="translate(0 -74)">${cone()}</g>
      <g transform="translate(30 -66)">${cone()}</g>
      <path d="M-56,-48 L56,-48 L45,10 L-45,10 Z" fill="#d99b4c" stroke="#7d4a1c" stroke-width="4" stroke-linejoin="round"/>
      <path d="M-52,-26 H52 M-48,-6 H48" stroke="#7d4a1c" stroke-width="3" opacity=".55"/>
      <rect x="-62" y="-56" width="124" height="14" rx="7" fill="#b87a35" stroke="#7d4a1c" stroke-width="3"/>
      <rect x="-32" y="-40" width="64" height="40" rx="9" fill="#fffaf0" stroke="#7d4a1c" stroke-width="3"/>
      <text x="0" y="-9" text-anchor="middle" font-size="34" font-weight="900" fill="#3b2410">${label}</text>`,
    sack: (label = "") => `
      <path d="M-40,8 C-60,-12 -56,-58 -30,-72 L30,-72 C56,-58 60,-12 40,8 Z" fill="#c9a26b" stroke="#6d4c25" stroke-width="4" stroke-linejoin="round"/>
      <path d="M-24,-72 L-32,-92 L-10,-82 L0,-98 L10,-82 L32,-92 L24,-72 Z" fill="#b48a52" stroke="#6d4c25" stroke-width="3" stroke-linejoin="round"/>
      <rect x="-30" y="-78" width="60" height="9" rx="4" fill="#6d4c25"/>
      <rect x="-31" y="-52" width="62" height="40" rx="9" fill="#fffaf0" stroke="#6d4c25" stroke-width="3"/>
      <text x="0" y="-21" text-anchor="middle" font-size="32" font-weight="900" fill="#3b2410">${label}</text>`,
    cart: (label = "") => `
      <g transform="translate(-34 -58)">${cone()}</g>
      <g transform="translate(0 -64)">${cone()}</g>
      <g transform="translate(34 -58)">${cone()}</g>
      <rect x="-62" y="-50" width="124" height="52" rx="10" fill="#d94f3d" stroke="#7a2418" stroke-width="4"/>
      <rect x="-40" y="-42" width="80" height="36" rx="8" fill="#fffaf0" stroke="#7a2418" stroke-width="3"/>
      <text x="0" y="-14" text-anchor="middle" font-size="30" font-weight="900" fill="#3b2410">${label}</text>
      <circle cx="-36" cy="8" r="13" fill="#2f3542" stroke="#fff" stroke-width="3"/>
      <circle cx="36" cy="8" r="13" fill="#2f3542" stroke="#fff" stroke-width="3"/>
      <path d="M62,-20 H74" stroke="#7a2418" stroke-width="6" stroke-linecap="round"/>`,
    cone,
  };

  const formatTime = (seconds) => {
    const whole = Math.max(0, Math.floor(seconds));
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
  };

  const setup = (player) => {
    const frame = player.querySelector("[data-video-frame]");
    const stage = player.querySelector("[data-video-stage]");
    const caption = player.querySelector("[data-video-caption]");
    const startButton = player.querySelector("[data-video-start]");
    const playButton = player.querySelector("[data-video-play]");
    const prevButton = player.querySelector("[data-video-prev]");
    const nextButton = player.querySelector("[data-video-next]");
    const seek = player.querySelector("[data-video-seek]");
    const timeLabel = player.querySelector("[data-video-time]");
    const speed = player.querySelector("[data-video-speed]");
    const voiceButton = player.querySelector("[data-video-voice]");
    const voiceNote = player.querySelector("[data-video-voice-note]");
    const chapterList = player.querySelector("[data-video-chapters]");

    let start = 0;
    const shots = [...player.querySelectorAll("[data-video-shots] > li")].map((item, index) => {
      const shot = {
        id: item.dataset.shot,
        index,
        start,
        duration: Number(item.dataset.duration),
        caption: item.textContent.replace(/\s+/g, " ").trim(),
        chapter: item.dataset.chapter,
        pose: item.dataset.pose || "idle",
        prompt: item.dataset.prompt,
      };
      start += shot.duration;
      return shot;
    });
    const total = start;
    const indexOf = new Map(shots.map((shot) => [shot.id, shot.index]));
    const shotIndex = (id) => {
      if (!indexOf.has(id)) throw new Error(`Unknown video shot: ${id}`);
      return indexOf.get(id);
    };

    stage.querySelectorAll("[data-character], [data-prop]").forEach((element) => {
      const make = CAST[element.dataset.character || element.dataset.prop];
      if (!make) throw new Error(`Unknown cast member: ${element.dataset.character || element.dataset.prop}`);
      element.innerHTML = make(element.dataset.label);
    });

    const layers = [...stage.querySelectorAll("[data-from], [data-focus]")].map((element) => ({
      element,
      from: element.dataset.from ? shotIndex(element.dataset.from) : null,
      until: element.dataset.until ? shotIndex(element.dataset.until) : Infinity,
      delay: Number(element.dataset.delay || 0),
      focus: (element.dataset.focus || "").split(/\s+/).filter(Boolean).map(shotIndex),
    }));

    const prompts = new Map([...player.querySelectorAll("[data-video-prompt]")]
      .map((panel) => [panel.dataset.videoPrompt, panel]));
    shots.forEach((shot) => {
      if (shot.prompt && !prompts.has(shot.prompt)) throw new Error(`Missing video prompt: ${shot.prompt}`);
    });

    const chapterButtons = shots.filter((shot) => shot.chapter).map((shot) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${formatTime(shot.start)} ${shot.chapter}`;
      button.addEventListener("click", () => goTo(shot.start));
      item.append(button);
      chapterList?.append(item);
      return { shot, button };
    });

    let time = 0;
    let playing = false;
    let rate = 1;
    let lastFrame = 0;
    let heldSince = null;
    let current = null;
    let openPrompt = null;
    const promptsSeen = new Set();

    const synth = "speechSynthesis" in window ? window.speechSynthesis : null;
    let voice = null;
    let voiceOn = false;
    let speaking = false;
    let utterance = null;

    // Only on-device voices: narration text must not leave the device.
    const pickVoice = () => {
      const voices = synth ? synth.getVoices().filter((item) => item.localService
        && /^zh/i.test(item.lang) && !/HK|yue/i.test(item.lang)) : [];
      voice = voices.find((item) => /CN|Hans/i.test(item.lang)) || voices[0] || null;
      if (!voiceButton) return;
      voiceButton.disabled = !voice;
      if (voiceNote) {
        voiceNote.textContent = voice
          ? "朗读使用本机中文语音，不联网。"
          : "这台设备没有可离线使用的中文语音，请看字幕。";
      }
    };

    const stopSpeech = () => {
      utterance = null;
      speaking = false;
      synth?.cancel();
    };

    const speak = (text) => {
      if (!voiceOn || !voice || !playing) return;
      stopSpeech();
      const spoken = text.replace(/×/g, "乘").replace(/÷/g, "除以").replace(/=/g, "等于")
        .replace(/\+/g, "加").replace(/−/g, "减").replace(/>/g, "大于").replace(/</g, "小于");
      const next = new SpeechSynthesisUtterance(spoken);
      next.voice = voice;
      next.lang = voice.lang;
      next.rate = rate;
      next.onend = next.onerror = () => {
        if (utterance === next) speaking = false;
      };
      utterance = next;
      speaking = true;
      synth.speak(next);
    };

    const shotAt = (seconds) => {
      for (let index = shots.length - 1; index >= 0; index -= 1) {
        if (seconds >= shots[index].start) return shots[index];
      }
      return shots[0];
    };

    const hidePrompt = () => {
      if (!openPrompt) return;
      openPrompt.hidden = true;
      openPrompt = null;
    };

    const showPrompt = (shot) => {
      const panel = prompts.get(shot.prompt);
      pause();
      openPrompt = panel;
      panel.hidden = false;
      const continueButton = panel.querySelector("[data-video-continue]");
      const answered = panel.querySelector("[data-quiz]")?.dataset.answered === "true";
      continueButton.hidden = !answered;
      const focusTarget = answered ? continueButton : panel.querySelector("[data-choice]:not(:disabled)");
      focusTarget?.focus({ preventScroll: true });
      panel.scrollIntoView({ block: "nearest", behavior: "smooth" });
    };

    const enterShot = (shot) => {
      current = shot;
      stage.dataset.shot = shot.id;
      stage.dataset.pose = shot.pose;
      shots.forEach((item) => stage.classList.toggle(`past-${item.id}`, item.index <= shot.index));
      caption.textContent = shot.caption;
      const chapter = [...chapterButtons].reverse().find((item) => item.shot.index <= shot.index);
      chapterButtons.forEach((item) => {
        if (item === chapter) item.button.setAttribute("aria-current", "true");
        else item.button.removeAttribute("aria-current");
      });
      if (playing) {
        speak(shot.caption);
        if (shot.prompt && !promptsSeen.has(shot.prompt)) showPrompt(shot);
      }
    };

    const render = () => {
      const shot = shotAt(time);
      if (shot !== current) enterShot(shot);
      const elapsed = time - shot.start;
      layers.forEach(({ element, from, until, delay, focus }) => {
        if (from !== null) {
          const visible = shot.index <= until
            && (shot.index > from || (shot.index === from && elapsed >= delay));
          element.classList.toggle("is-on", visible);
        }
        if (focus.length) element.classList.toggle("is-focus", focus.includes(shot.index));
      });
      seek.value = String(time);
      const label = `${formatTime(time)} / ${formatTime(total)}`;
      timeLabel.textContent = label;
      seek.setAttribute("aria-valuetext", `${label}，第 ${shot.index + 1} 幕，共 ${shots.length} 幕`);
    };

    const setPlayingUi = () => {
      player.classList.toggle("is-playing", playing);
      playButton.textContent = playing ? "❚❚ 暂停" : "▶ 播放";
      playButton.setAttribute("aria-label", playing ? "暂停视频" : "播放视频");
    };

    const tick = (now) => {
      if (!playing) return;
      const step = Math.min((now - lastFrame) / 1000, 0.25) * rate;
      lastFrame = now;
      const shot = shotAt(time);
      const end = shot.start + shot.duration;
      let next = time + step;
      // Hold the last moment of a shot until its narration finishes (at most 6 s,
      // in case the speech engine never reports the end).
      if (speaking && next >= end - 0.05) {
        heldSince ??= now;
        if (now - heldSince < 6000) next = Math.max(time, end - 0.05);
        else speaking = false;
      } else {
        heldSince = null;
      }
      if (next >= total) {
        time = total;
        render();
        pause();
        startButton.hidden = false;
        startButton.querySelector("span").textContent = "↻ 再看一遍";
        startButton.setAttribute("aria-label", "从头再看一遍视频");
        return;
      }
      time = next;
      render();
      requestAnimationFrame(tick);
    };

    function play() {
      if (playing) return;
      if (time >= total) time = 0;
      startButton.hidden = true;
      playing = true;
      setPlayingUi();
      render();
      const shot = shotAt(time);
      if (shot.prompt && !promptsSeen.has(shot.prompt)) {
        showPrompt(shot);
        return;
      }
      hidePrompt();
      speak(shot.caption);
      lastFrame = performance.now();
      requestAnimationFrame(tick);
    }

    function pause() {
      playing = false;
      stopSpeech();
      setPlayingUi();
    }

    function goTo(seconds) {
      const wasPlaying = playing;
      pause();
      hidePrompt();
      time = Math.min(Math.max(seconds, 0), total);
      startButton.hidden = true;
      render();
      if (wasPlaying) play();
    }

    const step = (direction) => {
      const shot = shotAt(time);
      if (direction < 0 && time - shot.start > 1.5) goTo(shot.start);
      else goTo(shots[Math.min(Math.max(shot.index + direction, 0), shots.length - 1)].start);
    };

    seek.max = String(total);
    seek.step = "0.1";
    seek.addEventListener("input", () => goTo(Number(seek.value)));
    startButton.addEventListener("click", play);
    playButton.addEventListener("click", () => (playing ? pause() : play()));
    prevButton.addEventListener("click", () => step(-1));
    nextButton.addEventListener("click", () => step(1));
    speed?.addEventListener("change", () => {
      rate = Number(speed.value) || 1;
      if (speaking) speak(current.caption);
    });

    frame.addEventListener("keydown", (event) => {
      if (event.target !== frame) return;
      if (event.key === " " || event.key === "Enter" || event.key === "k") {
        event.preventDefault();
        playing ? pause() : play();
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        step(event.key === "ArrowLeft" ? -1 : 1);
      }
    });
    frame.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      playing ? pause() : play();
    });

    prompts.forEach((panel, id) => {
      const quiz = panel.querySelector("[data-quiz]");
      const continueButton = panel.querySelector("[data-video-continue]");
      // lesson.js handles the choice first; this bubbling listener only reveals "continue".
      panel.addEventListener("click", (event) => {
        if (event.target.closest("[data-choice]") && quiz.dataset.answered === "true") {
          continueButton.hidden = false;
        }
      });
      continueButton.addEventListener("click", () => {
        promptsSeen.add(id);
        hidePrompt();
        const shot = shots.find((item) => item.prompt === id);
        time = shot.start + shot.duration;
        frame.focus({ preventScroll: true });
        play();
      });
    });

    if (voiceButton) {
      pickVoice();
      synth?.addEventListener?.("voiceschanged", pickVoice);
      voiceButton.addEventListener("click", () => {
        voiceOn = !voiceOn;
        voiceButton.setAttribute("aria-pressed", String(voiceOn));
        voiceButton.textContent = voiceOn ? "🔊 朗读：开" : "🔈 朗读：关";
        if (voiceOn) speak(current.caption);
        else stopSpeech();
      });
    }

    player.classList.add("is-ready");
    setPlayingUi();
    render();
  };

  document.querySelectorAll("[data-cartoon-video]").forEach(setup);
})();
