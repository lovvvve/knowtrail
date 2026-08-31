(() => {
  const checkpointSelector = "[data-checkpoint]";
  const lessonId = document.body.dataset.lessonId || "shared";
  const storageKey = `knowtrail:${lessonId}:progress`;
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
      choices.forEach((choice) => choice.setAttribute("aria-disabled", "true"));
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
          choices.forEach((button) => button.setAttribute("aria-disabled", "true"));
          addUnique("quizzes", quizId);
          completeCheckpoint(quiz);
        } else {
          choice.classList.add("is-wrong");
          choice.setAttribute("aria-disabled", "true");
        }

        setFeedback(
          quiz,
          correct,
          correct ? choice.dataset.success : choice.dataset.hint,
          correct,
        );
      });
    });
  });

  const lab = document.querySelector("[data-power-lab]");
  if (lab) {
    const baseInput = lab.querySelector("[data-base]");
    const exponentInput = lab.querySelector("[data-exponent]");
    const exponentLabel = lab.querySelector("[data-exponent-label]");
    const factorsOutput = lab.querySelector("[data-factors]");
    const powerOutput = lab.querySelector("[data-power]");
    const completeButton = lab.querySelector("[data-lab-complete]");
    const labFeedback = lab.querySelector("[data-lab-feedback]");

    const renderLab = () => {
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
    };

    const handleLabChange = () => {
      renderLab();
      if (lab.dataset.complete !== "true" && completeButton) {
        completeButton.setAttribute("aria-disabled", "false");
        if (labFeedback) labFeedback.textContent = "你已经换了一个例子，现在可以完成这项活动。";
      }
    };

    baseInput.addEventListener("change", handleLabChange);
    exponentInput.addEventListener("input", handleLabChange);
    completeButton?.addEventListener("click", () => {
      if (completeButton.getAttribute("aria-disabled") === "true") return;
      completeCheckpoint(completeButton);
      completeButton.textContent = "已完成幂压缩实验 ✓";
      completeButton.setAttribute("aria-disabled", "true");
      if (labFeedback) {
        labFeedback.textContent = "活动完成：你已经观察了重复乘法与幂的对应关系。";
        labFeedback.classList.add("correct");
      }
      focusFeedback(labFeedback);
    });

    if (lab.dataset.complete === "true" && completeButton) {
      completeButton.textContent = "已完成幂压缩实验 ✓";
      completeButton.setAttribute("aria-disabled", "true");
      if (labFeedback) {
        labFeedback.textContent = "活动完成：你已经观察了重复乘法与幂的对应关系。";
        labFeedback.classList.add("correct");
      }
    }
    renderLab();
  }

  const lockMasteryForm = (form) => {
    form.querySelectorAll("input[data-correct]").forEach((input) => {
      input.value = input.dataset.correct;
      input.readOnly = true;
      input.setAttribute("aria-invalid", "false");
    });
    form.querySelector("button[type='submit']")?.setAttribute("aria-disabled", "true");
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

  document.querySelectorAll("[data-mastery-stage]").forEach((form) => {
    const milestoneId = form.dataset.milestoneId;
    const isRestored = state.milestones.includes(milestoneId);

    if (isRestored) {
      lockMasteryForm(form);
      setFeedback(form, true, form.dataset.success, false);
      if (form.dataset.milestoneId === "mastery-practice") showTransfer(false);
      if (form.dataset.milestoneId === "mastery-transfer") completeCheckpoint(form);
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (state.milestones.includes(milestoneId)) return;

      const inputs = [...form.querySelectorAll("input[data-correct]")];
      const incorrect = inputs.filter((input) => input.value.trim() !== input.dataset.correct);
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
        completeCheckpoint(form);
        const status = document.querySelector("[data-mastery-status]");
        if (status) {
          status.hidden = false;
          focusFeedback(status);
        }
      }
    });
  });

  if (state.milestones.includes("mastery-transfer")) {
    showTransfer(false);
    const status = document.querySelector("[data-mastery-status]");
    if (status) status.hidden = false;
  }

  document.querySelectorAll("[data-complete-checkpoint]").forEach((button) => {
    if (button.closest(checkpointSelector)?.dataset.complete === "true") {
      button.textContent = button.dataset.completedLabel || "这个互动任务已完成 ✓";
      button.setAttribute("aria-disabled", "true");
    }
    button.addEventListener("click", () => {
      if (button.getAttribute("aria-disabled") === "true") return;
      completeCheckpoint(button);
      button.textContent = button.dataset.completedLabel || "这个互动任务已完成 ✓";
      button.setAttribute("aria-disabled", "true");
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
