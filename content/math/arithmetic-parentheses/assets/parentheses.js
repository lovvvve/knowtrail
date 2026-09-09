(() => {
  // Reuse the existing mastery widget while accepting ordinary keyboard symbols.
  document.addEventListener("submit", (event) => {
    if (!event.target.matches("[data-mastery-stage]")) return;
    event.target.querySelectorAll("input[data-correct]").forEach((input) => {
      input.value = input.value.normalize("NFKC")
        .replace(/[-–—]/g, "−").replace(/[xX*]/g, "×").replace(/\//g, "÷");
    });
  }, true);

  document.querySelectorAll("[data-compare]").forEach((lab) => {
    const select = lab.querySelector("select");
    const candidate = lab.querySelector("[data-candidate]");
    const feedback = lab.querySelector("[data-lab-feedback]");
    const result = lab.querySelector("[data-result]");
    const reset = () => {
      candidate.textContent = select.selectedOptions[0].dataset.expression;
      lab.querySelectorAll("input[type=radio]").forEach((input) => { input.checked = false; });
      result.hidden = true;
      feedback.textContent = "先心算或在纸上算，再预测两边的值是否相同。";
      feedback.classList.remove("correct", "incorrect");
    };
    select.addEventListener("change", reset);
    lab.querySelector("[data-compare-check]").addEventListener("click", () => {
      const prediction = lab.querySelector("input:checked");
      if (!prediction) {
        feedback.textContent = "先选一个预测：结果相同，还是结果不同。";
        lab.querySelector("input[type=radio]").focus();
        return;
      }
      const option = select.selectedOptions[0];
      const original = Number(lab.dataset.originalValue);
      const alternative = Number(option.dataset.value);
      const equal = original === alternative;
      const correct = prediction.value === String(equal);
      lab.querySelector("[data-original-result]").textContent = `${lab.dataset.original} = ${original}`;
      lab.querySelector("[data-candidate-result]").textContent = `${option.dataset.expression} = ${alternative}`;
      const largest = Math.max(original, alternative, 1);
      lab.querySelector("[data-original-bar]").style.width = `${original / largest * 100}%`;
      lab.querySelector("[data-candidate-bar]").style.width = `${alternative / largest * 100}%`;
      result.hidden = false;
      feedback.textContent = `${correct ? "预测与计算一致。" : "这次预测与计算不同。"}${option.dataset.explanation}`;
      feedback.classList.toggle("correct", correct);
      feedback.classList.toggle("incorrect", !correct);
    });
    reset();
  });
})();
