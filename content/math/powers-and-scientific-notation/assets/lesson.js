(() => {
  const checkpointSelector = "[data-checkpoint]";
  const lessonId = document.body.dataset.lessonId || "shared";
  const lessonVersion = document.body.dataset.lessonVersion;
  const storageKey = lessonVersion
    ? `knowtrail:${lessonId}:v${lessonVersion}:progress`
    : `knowtrail:${lessonId}:progress`;
  const emptyState = { completed: [], quizzes: [], milestones: [] };

  const loadState = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (!parsed || typeof parsed !== "object") return { ...emptyState };
      return {
        completed: Array.isArray(parsed.completed) ? parsed.completed : [],
        quizzes: Array.isArray(parsed.quizzes) ? parsed.quizzes : [],
        milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
      };
    } catch {
      return { ...emptyState };
    }
  };

  const state = loadState();

  const saveState = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // The lesson still works when local storage is unavailable.
    }
  };

  const addUnique = (key, value) => {
    if (!value || state[key].includes(value)) return;
    state[key].push(value);
    saveState();
  };

  const updateProgress = () => {
    const checkpoints = [...document.querySelectorAll(checkpointSelector)];
    const done = checkpoints.filter((item) => item.dataset.complete === "true").length;
    const percent = checkpoints.length === 0 ? 0 : Math.round((done / checkpoints.length) * 100);
    const progress = document.querySelector("[data-progress]");
    const label = document.querySelector("[data-progress-label]");

    if (progress) {
      progress.value = percent;
      progress.textContent = `${percent}%`;
    }
    if (label) {
      label.textContent = `${done}/${checkpoints.length} 项互动任务已完成`;
    }
  };

  const completeCheckpoint = (element) => {
    const checkpoint = element.closest(checkpointSelector);
    if (!checkpoint) return;
    checkpoint.dataset.complete = "true";
    addUnique("completed", checkpoint.dataset.checkpointId);
    updateProgress();
  };

  const focusFeedback = (feedback) => {
    if (!feedback) return;
    feedback.setAttribute("tabindex", "-1");
    feedback.focus({ preventScroll: true });
  };

  const setFeedback = (container, correct, message, shouldFocus = true) => {
    const feedback = container.querySelector("[data-feedback]");
    if (!feedback) return;
    feedback.textContent = message;
    feedback.classList.toggle("correct", correct);
    feedback.classList.toggle("incorrect", !correct);
    container.setAttribute("aria-invalid", String(!correct));
    if (shouldFocus) focusFeedback(feedback);
  };

  document.querySelectorAll(checkpointSelector).forEach((checkpoint) => {
    if (state.completed.includes(checkpoint.dataset.checkpointId)) {
      checkpoint.dataset.complete = "true";
    }
  });

  document.querySelectorAll("[data-quiz]").forEach((quiz) => {
    const quizId = quiz.dataset.quizId;
    const choices = [...quiz.querySelectorAll("[data-choice]")];
    const correctChoice = choices.find((choice) => choice.dataset.correct === "true");

    if (state.quizzes.includes(quizId) && correctChoice) {
      quiz.dataset.answered = "true";
      correctChoice.classList.add("is-correct");
      choices.forEach((choice) => {
        choice.setAttribute("aria-disabled", "true");
        choice.disabled = true;
      });
      setFeedback(quiz, true, correctChoice.dataset.success, false);
      completeCheckpoint(quiz);
    }

    choices.forEach((choice) => {
      choice.addEventListener("click", () => {
        if (quiz.dataset.answered === "true" || choice.getAttribute("aria-disabled") === "true") return;

        const correct = choice.dataset.correct === "true";
        if (correct) {
          quiz.dataset.answered = "true";
          choice.classList.add("is-correct");
          choices.forEach((button) => {
            button.setAttribute("aria-disabled", "true");
            button.disabled = true;
          });
          addUnique("quizzes", quizId);
          completeCheckpoint(quiz);
        } else {
          choice.classList.add("is-wrong");
          choice.setAttribute("aria-disabled", "true");
          choice.disabled = true;
        }

        setFeedback(
          quiz,
          correct,
          correct ? choice.dataset.success : choice.dataset.hint,
          correct,
        );

        if (!correct) {
          const choiceIndex = choices.indexOf(choice);
          const nextChoice = choices.find((button, index) => index > choiceIndex && !button.disabled)
            || choices.find((button) => !button.disabled);
          nextChoice?.focus();
        }
      });
    });
  });

  const setupLabCompletion = ({ container, button, feedback, completedLabel, completedFeedback }) => {
    const showCompleted = (shouldFocus = false) => {
      if (!button) return;
      button.textContent = completedLabel;
      button.setAttribute("aria-disabled", "true");
      button.disabled = true;
      if (feedback) {
        feedback.textContent = completedFeedback;
        feedback.classList.add("correct");
      }
      if (shouldFocus) focusFeedback(feedback);
    };

    const enable = (readyFeedback) => {
      if (container.dataset.complete === "true" || !button) return;
      button.setAttribute("aria-disabled", "false");
      button.disabled = false;
      if (feedback) feedback.textContent = readyFeedback;
    };

    button?.addEventListener("click", () => {
      if (button.disabled || button.getAttribute("aria-disabled") === "true") return;
      completeCheckpoint(button);
      showCompleted(true);
    });

    if (container.dataset.complete === "true") showCompleted(false);
    return { enable };
  };

  const lab = document.querySelector("[data-power-lab]");
  if (lab) {
    const baseInput = lab.querySelector("[data-base]");
    const exponentInput = lab.querySelector("[data-exponent]");
    const exponentLabel = lab.querySelector("[data-exponent-label]");
    const factorsOutput = lab.querySelector("[data-factors]");
    const powerOutput = lab.querySelector("[data-power]");
    const completeButton = lab.querySelector("[data-lab-complete]");
    const labFeedback = lab.querySelector("[data-lab-feedback]");
    const labAnnouncement = lab.querySelector("[data-power-lab-announcement]");

    const renderLab = (shouldAnnounce = false) => {
      const base = Number(baseInput.value);
      const exponent = Number(exponentInput.value);
      const factors = Array.from({ length: exponent }, () => String(base));
      exponentLabel.textContent = String(exponent);
      factorsOutput.textContent = factors.join(" × ");
      factorsOutput.setAttribute("aria-label", `${exponent} 个因数 ${base} 相乘`);
      powerOutput.replaceChildren(
        document.createTextNode(String(base)),
        Object.assign(document.createElement("sup"), { textContent: String(exponent) }),
      );
      powerOutput.setAttribute("aria-label", `${base} 的 ${exponent} 次方`);
      if (shouldAnnounce && labAnnouncement) {
        labAnnouncement.textContent = `底数 ${base}，指数 ${exponent}：${exponent} 个因数 ${base} 相乘。`;
      }
    };

    const completion = setupLabCompletion({
      container: lab,
      button: completeButton,
      feedback: labFeedback,
      completedLabel: "已完成幂压缩实验 ✓",
      completedFeedback: "活动完成：你已经观察了重复乘法与幂的对应关系。",
    });

    const handleLabChange = () => {
      renderLab(true);
      completion.enable("你已经换了一个例子，现在可以完成这项活动。");
    };

    baseInput.addEventListener("change", handleLabChange);
    exponentInput.addEventListener("input", handleLabChange);
    renderLab();
  }

  const tenLab = document.querySelector("[data-ten-lab]");
  if (tenLab) {
    const exponentInput = tenLab.querySelector("[data-ten-exponent]");
    const exponentLabel = tenLab.querySelector("[data-ten-exponent-label]");
    const factorsOutput = tenLab.querySelector("[data-ten-factors]");
    const powerOutput = tenLab.querySelector("[data-ten-power]");
    const valueOutput = tenLab.querySelector("[data-ten-value]");
    const zeroCountOutput = tenLab.querySelector("[data-zero-count]");
    const zeroStrip = tenLab.querySelector("[data-zero-strip]");
    const completeButton = tenLab.querySelector("[data-ten-lab-complete]");
    const labFeedback = tenLab.querySelector("[data-ten-lab-feedback]");
    const labAnnouncement = tenLab.querySelector("[data-ten-lab-announcement]");

    const renderTenLab = (shouldAnnounce = false) => {
      const exponent = Number(exponentInput.value);
      const value = `1${"0".repeat(exponent)}`;
      exponentLabel.textContent = String(exponent);
      factorsOutput.textContent = Array.from({ length: exponent }, () => "10").join(" × ");
      factorsOutput.setAttribute("aria-label", `${exponent} 个因数 10 相乘`);
      powerOutput.replaceChildren(
        document.createTextNode("10"),
        Object.assign(document.createElement("sup"), { textContent: String(exponent) }),
      );
      powerOutput.setAttribute("aria-label", `10 的 ${exponent} 次方`);
      valueOutput.textContent = value;
      valueOutput.setAttribute("aria-label", `数字 1 后面有 ${exponent} 个零`);
      zeroCountOutput.textContent = String(exponent);

      const digits = ["1", ...Array.from({ length: exponent }, () => "0")];
      zeroStrip.replaceChildren(
        ...digits.map((digit, index) => {
          const span = document.createElement("span");
          span.className = index === 0 ? "leading-digit" : "zero-digit";
          span.textContent = digit;
          span.setAttribute("aria-hidden", "true");
          return span;
        }),
      );
      zeroStrip.setAttribute("aria-label", `一个 1 后面跟着 ${exponent} 个零`);
      if (shouldAnnounce && labAnnouncement) {
        labAnnouncement.textContent = `指数 ${exponent}：10 的 ${exponent} 次方等于 ${value}，有 ${exponent} 个零。`;
      }
    };

    const completion = setupLabCompletion({
      container: tenLab,
      button: completeButton,
      feedback: labFeedback,
      completedLabel: "已完成 10 的幂实验 ✓",
      completedFeedback: "活动完成：你观察到指数、因数个数和零的个数怎样对应。",
    });

    const handleTenLabChange = () => {
      renderTenLab(true);
      completion.enable("你已经换了一个指数，现在可以完成这项活动。");
    };

    exponentInput.addEventListener("input", handleTenLabChange);
    renderTenLab();
  }

  const splitLab = document.querySelector("[data-split-lab]");
  if (splitLab) {
    const numberSelect = splitLab.querySelector("[data-split-number]");
    const strip = splitLab.querySelector("[data-split-strip]");
    const equationOutput = splitLab.querySelector("[data-split-equation]");
    const statusOutput = splitLab.querySelector("[data-split-status]");
    const leftButton = splitLab.querySelector("[data-split-left]");
    const rightButton = splitLab.querySelector("[data-split-right]");
    const completeButton = splitLab.querySelector("[data-split-complete]");
    const labFeedback = splitLab.querySelector("[data-split-feedback]");
    const labAnnouncement = splitLab.querySelector("[data-split-announcement]");
    const requiredSplits = 2;
    const solvedNumbers = new Set();
    let digits = numberSelect.value;
    let jumps = 0;

    const groupThousands = (integerText) =>
      integerText.replace(/\B(?=(\d{3})+$)/g, " ");

    const coefficientText = () => {
      const integerPart = digits.slice(0, digits.length - jumps) || "0";
      const fractionPart = digits.slice(digits.length - jumps).replace(/0+$/, "");
      return fractionPart ? `${groupThousands(integerPart)}.${fractionPart}` : groupThousands(integerPart);
    };

    const renderSplitLab = (shouldAnnounce = false) => {
      const coefficient = coefficientText();
      const grouped = groupThousands(digits);
      const isValid = jumps === digits.length - 1;
      const pointPosition = digits.length - jumps;

      const cells = [];
      digits.split("").forEach((digit, index) => {
        if (index === pointPosition) {
          const point = document.createElement("span");
          point.className = "point-digit";
          point.textContent = ".";
          point.setAttribute("aria-hidden", "true");
          cells.push(point);
        }
        const span = document.createElement("span");
        span.className = index === 0 ? "leading-digit" : "strip-digit";
        span.textContent = digit;
        span.setAttribute("aria-hidden", "true");
        cells.push(span);
      });
      if (pointPosition === digits.length) {
        const point = document.createElement("span");
        point.className = "point-digit";
        point.textContent = ".";
        point.setAttribute("aria-hidden", "true");
        cells.push(point);
      }
      strip.replaceChildren(...cells);
      strip.setAttribute(
        "aria-label",
        jumps === 0
          ? `${grouped}，小数点在末尾，还没有跳格`
          : `小数点向左跳了 ${jumps} 格，开头的数变成 ${coefficient}`,
      );

      if (jumps === 0) {
        equationOutput.textContent = `${grouped} = ${grouped}`;
        equationOutput.setAttribute("aria-label", `${grouped} 还没有拆分`);
      } else {
        equationOutput.replaceChildren(
          document.createTextNode(`${grouped} = ${coefficient} × 10`),
          Object.assign(document.createElement("sup"), { textContent: String(jumps) }),
        );
        equationOutput.setAttribute(
          "aria-label",
          `${grouped} 等于 ${coefficient} 乘 10 的 ${jumps} 次方`,
        );
      }

      let statusMessage;
      if (jumps === 0) {
        statusMessage = "小数点在整数末尾。请向左跳格，每跳一格补一个因数 10。";
      } else if (isValid) {
        statusMessage = `✓ 拆分规范：开头的数 ${coefficient} 在 1 和 10 之间，指数 ${jumps} 就是跳格数。`;
      } else if (jumps < digits.length - 1) {
        statusMessage = `开头的数 ${coefficient} 还不小于 10，请继续向左跳。`;
      } else {
        statusMessage = `开头的数 ${coefficient} 比 1 小，跳过头了，请向右跳一格。`;
      }
      statusOutput.textContent = statusMessage;
      statusOutput.classList.toggle("correct", isValid);

      leftButton.disabled = jumps >= digits.length;
      leftButton.setAttribute("aria-disabled", String(leftButton.disabled));
      rightButton.disabled = jumps <= 0;
      rightButton.setAttribute("aria-disabled", String(rightButton.disabled));

      if (shouldAnnounce && labAnnouncement) {
        labAnnouncement.textContent = statusMessage;
      }
      return isValid;
    };

    const completion = setupLabCompletion({
      container: splitLab,
      button: completeButton,
      feedback: labFeedback,
      completedLabel: "已完成拆数实验 ✓",
      completedFeedback: "活动完成：你已经规范拆好了两个不同的大数。",
    });

    const afterChange = () => {
      const isValid = renderSplitLab(true);
      if (isValid) {
        solvedNumbers.add(digits);
        if (solvedNumbers.size >= requiredSplits) {
          completion.enable("你已经规范拆好了两个不同的数，现在可以完成这项活动。");
        } else if (splitLab.dataset.complete !== "true" && labFeedback) {
          labFeedback.textContent = "已规范拆好 1 个数。请换一个数，再拆一次。";
        }
      }
    };

    leftButton.addEventListener("click", () => {
      if (jumps >= digits.length) return;
      jumps += 1;
      afterChange();
    });

    rightButton.addEventListener("click", () => {
      if (jumps <= 0) return;
      jumps -= 1;
      afterChange();
    });

    numberSelect.addEventListener("change", () => {
      digits = numberSelect.value;
      jumps = 0;
      renderSplitLab(true);
    });

    renderSplitLab();
  }

  const compareLab = document.querySelector("[data-compare-lab]");
  if (compareLab) {
    let rounds;
    try {
      rounds = JSON.parse(compareLab.dataset.compareRounds || "[]");
    } catch {
      rounds = [];
    }
    const counterOutput = compareLab.querySelector("[data-compare-counter]");
    const cardButtons = [...compareLab.querySelectorAll("[data-compare-card]")];
    const nextButton = compareLab.querySelector("[data-compare-next]");
    const feedback = compareLab.querySelector("[data-compare-feedback]");
    let index = 0;

    const renderSide = (button, side) => {
      const value = document.createElement("span");
      value.className = "compare-value";
      value.append(`${side.coef} × 10`);
      value.append(Object.assign(document.createElement("sup"), { textContent: side.exp }));
      if (side.unit) value.append(` ${side.unit}`);
      const children = [value];
      if (side.label) {
        const label = document.createElement("span");
        label.className = "compare-label";
        label.textContent = side.label;
        children.push(label);
      }
      button.replaceChildren(...children);
      button.setAttribute(
        "aria-label",
        `${side.label ? `${side.label}，` : ""}${side.coef} 乘 10 的 ${side.exp} 次方${side.unit ? ` ${side.unit}` : ""}`,
      );
    };

    const setCardsDisabled = (disabled) => {
      cardButtons.forEach((button) => {
        button.disabled = disabled;
        button.setAttribute("aria-disabled", String(disabled));
      });
    };

    const renderRound = () => {
      const round = rounds[index];
      cardButtons.forEach((button) => {
        renderSide(button, round[button.dataset.side]);
        button.classList.remove("is-correct", "is-wrong");
      });
      setCardsDisabled(false);
      counterOutput.textContent = `第 ${index + 1}/${rounds.length} 题`;
      nextButton.hidden = true;
      feedback.textContent = "点击更大的那个数。";
      feedback.classList.remove("correct", "incorrect");
    };

    if (rounds.length > 0) {
      renderRound();
      if (compareLab.dataset.complete === "true") {
        setCardsDisabled(true);
        counterOutput.textContent = `全部 ${rounds.length} 题完成`;
        feedback.textContent = "活动已完成：先比指数，指数相同再比开头的数。";
        feedback.classList.add("correct");
      }

      cardButtons.forEach((button) => {
        button.addEventListener("click", () => {
          if (button.disabled || button.getAttribute("aria-disabled") === "true") return;
          const round = rounds[index];
          const isAnswer = button.dataset.side === round.answer;
          if (isAnswer) {
            button.classList.add("is-correct");
            setCardsDisabled(true);
            feedback.classList.add("correct");
            feedback.classList.remove("incorrect");
            if (index < rounds.length - 1) {
              feedback.textContent = round.success;
              nextButton.hidden = false;
              nextButton.focus();
            } else {
              completeCheckpoint(compareLab);
              counterOutput.textContent = `全部 ${rounds.length} 题完成`;
              feedback.textContent = `${round.success} 比大小实验完成！`;
            }
          } else {
            button.classList.add("is-wrong");
            button.disabled = true;
            button.setAttribute("aria-disabled", "true");
            feedback.textContent = round.hint;
            feedback.classList.add("incorrect");
            feedback.classList.remove("correct");
          }
        });
      });

      nextButton.addEventListener("click", () => {
        index += 1;
        renderRound();
      });
    }
  }

  const lockMasteryForm = (form) => {
    form.querySelectorAll("input[data-correct]").forEach((input) => {
      input.value = input.dataset.correct;
      input.readOnly = true;
      input.setAttribute("aria-invalid", "false");
    });
    const submitButton = form.querySelector("button[type='submit']");
    if (submitButton) {
      submitButton.setAttribute("aria-disabled", "true");
      submitButton.disabled = true;
    }
  };

  const showTransfer = (shouldFocus = false) => {
    const panel = document.querySelector("[data-transfer-panel]");
    if (!panel) return;
    panel.hidden = false;
    if (shouldFocus) {
      const heading = panel.querySelector("h3");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus();
    }
  };

  const showTeachbackPanel = () => {
    const panel = document.querySelector("[data-teachback-panel]");
    if (panel) panel.hidden = false;
  };

  document.querySelectorAll("[data-mastery-stage]").forEach((form) => {
    const milestoneId = form.dataset.milestoneId;
    const isRestored = state.milestones.includes(milestoneId);

    if (isRestored) {
      lockMasteryForm(form);
      setFeedback(form, true, form.dataset.success, false);
      if (form.dataset.milestoneId === "mastery-practice") showTransfer(false);
      if (form.dataset.milestoneId === "mastery-transfer" && !document.querySelector("[data-teachback-form]")) {
        completeCheckpoint(form);
      }
      if (milestoneId !== "mastery-practice" && milestoneId !== "mastery-transfer") {
        completeCheckpoint(form);
      }
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (state.milestones.includes(milestoneId)) return;

      const inputs = [...form.querySelectorAll("input[data-correct]")];
      const normalizeAnswer = (value) => value.replace(/[\s,_，]/g, "").trim();
      const incorrect = inputs.filter(
        (input) => normalizeAnswer(input.value) !== normalizeAnswer(input.dataset.correct),
      );
      inputs.forEach((input) => {
        input.setAttribute("aria-invalid", String(incorrect.includes(input)));
      });

      if (incorrect.length > 0) {
        setFeedback(form, false, form.dataset.hint, false);
        incorrect[0].focus();
        return;
      }

      addUnique("milestones", milestoneId);
      lockMasteryForm(form);
      setFeedback(form, true, form.dataset.success);

      if (milestoneId === "mastery-practice") {
        showTransfer(true);
      } else if (milestoneId === "mastery-transfer") {
        if (document.querySelector("[data-teachback-form]")) {
          showTeachbackPanel();
        } else {
          completeCheckpoint(form);
        }
        const status = document.querySelector("[data-mastery-status]");
        if (status) {
          status.hidden = false;
          focusFeedback(status);
        }
      } else {
        completeCheckpoint(form);
      }
    });
  });

  if (state.milestones.includes("mastery-transfer")) {
    showTransfer(false);
    showTeachbackPanel();
    const status = document.querySelector("[data-mastery-status]");
    if (status) status.hidden = false;
  }

  document.querySelectorAll("[data-teachback-form]").forEach((form) => {
    const milestoneId = form.dataset.milestoneId;
    const checkbox = form.querySelector("input[type='checkbox']");
    const submitButton = form.querySelector("button[type='submit']");

    const lockTeachbackForm = () => {
      checkbox.checked = true;
      checkbox.disabled = true;
      submitButton.disabled = true;
      submitButton.setAttribute("aria-disabled", "true");
    };

    if (state.milestones.includes(milestoneId)) {
      showTeachbackPanel();
      lockTeachbackForm();
      setFeedback(form, true, form.dataset.success, false);
      completeCheckpoint(form);
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (state.milestones.includes(milestoneId)) return;
      if (!checkbox.checked) {
        setFeedback(form, false, form.dataset.hint, false);
        checkbox.focus();
        return;
      }

      addUnique("milestones", milestoneId);
      lockTeachbackForm();
      setFeedback(form, true, form.dataset.success);
      completeCheckpoint(form);
    });
  });

  document.querySelectorAll("[data-complete-checkpoint]").forEach((button) => {
    if (button.closest(checkpointSelector)?.dataset.complete === "true") {
      button.textContent = button.dataset.completedLabel || "这个互动任务已完成 ✓";
      button.setAttribute("aria-disabled", "true");
      button.disabled = true;
    }
    button.addEventListener("click", () => {
      if (button.getAttribute("aria-disabled") === "true") return;
      completeCheckpoint(button);
      button.textContent = button.dataset.completedLabel || "这个互动任务已完成 ✓";
      button.setAttribute("aria-disabled", "true");
      button.disabled = true;
    });
  });

  document.querySelectorAll("[data-print]").forEach((button) => {
    button.addEventListener("click", () => window.print());
  });

  document.querySelectorAll("[data-reveal]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.getAttribute("aria-controls"));
      if (!target) return;
      target.hidden = !target.hidden;
      button.setAttribute("aria-expanded", String(!target.hidden));
      button.textContent = target.hidden ? "查看提示" : "收起提示";
    });
  });

  document.querySelector("[data-reset-progress]")?.addEventListener("click", () => {
    if (!window.confirm("确定要清除这节课保存在本机的进度吗？")) return;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Nothing else is required when storage is unavailable.
    }
    window.location.reload();
  });

  updateProgress();
})();
