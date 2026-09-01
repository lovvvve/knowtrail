# 幂与科学记数法 Resources

## Knowledge

- [OpenStax, _Prealgebra 2e_, §2.1 “Use the Language of Algebra”](https://openstax.org/books/prealgebra-2e/pages/2-1-use-the-language-of-algebra)
  “Simplify Expressions with Exponents”把 exponential notation 解释为同一因数的重复乘法，明确 base 是重复的因数，exponent 表示底数作为因数出现的个数。用于：核验正整数指数下幂、底数和指数的正式含义。访问日期：2026-09-01。
- [Common Core State Standards for Mathematics（官方无障碍版 PDF，6.EE.A.1 见文内第 44 页；8.EE.A.1、8.EE.A.3–4 见文内第 54 页）](https://corestandards.org/wp-content/uploads/2023/09/ADA-Compliant-Math-Standards.pdf)
  6.EE.A.1 要求六年级写出并求含 whole-number exponents 的数值表达式；8.EE.A.1 在八年级处理整数指数性质；8.EE.A.3–4 在八年级处理“一个一位数乘以 10 的整数次幂”、极大或极小数量以及科学记数法运算。用于：核验美国 Common Core 路径中的通常课程阶段，而不是把它当作所有地区的统一年级规定。访问日期：2026-09-01。
- [OpenStax, _Prealgebra 2e_, §10.5 “Integer Exponents and Scientific Notation”](https://openstax.org/books/prealgebra-2e/pages/10-5-integer-exponents-and-scientific-notation)
  原始章节定义科学记数法为 `a × 10^n`，其中 `a ≥ 1`、`a < 10`，且 `n` 为整数；同时说明科学记数法惯用乘号 `×`，可表示很大或很小的数。用于：核验规范形式、系数范围、指数条件及本单元“大正整数”子范围。访问日期：2026-09-01。
- [NIST Special Publication 811, §7.10.3](https://www.nist.gov/pml/special-publication-811/nist-guide-si-chapter-7-rules-and-style-conventions-expressing-values#7103)；[同一出版物 §10.5.4](https://www.nist.gov/pml/special-publication-811/nist-guide-si-chapter-10-more-printing-and-using-symbols-and-numbers#1054)
  §7.10.3 指出 `10^9` 及以上数名在不同国家并不统一，表达大数时宜使用 10 的幂；§10.5.4 规定采用小数点时，数字相乘首选真正的乘号 `×`。用于：核验大数采用 10 的幂的书写理由与乘号规范；不用于推断课程年级或系数范围。访问日期：2026-09-01。
- [NASA Science, “Moon Facts”](https://science.nasa.gov/moon/facts/)
  月球到地球平均距离为 384,400 千米（238,855 英里）。用于：核验第四课“地球到月球约 380 000 千米 = 3.8 × 10⁵”的近似值。访问日期：2026-09-01。
- [NASA Science, “Sun Facts”](https://science.nasa.gov/sun/facts/)
  太阳到地球约 1.5 亿千米（93 million miles / 150 million kilometers），太阳直径约 140 万千米（865,000 miles / 1.4 million kilometers）。用于：核验第四课“地球到太阳约 150 000 000 千米 = 1.5 × 10⁸”与“太阳直径约 1 400 000 千米 = 1.4 × 10⁶”的近似值。访问日期：2026-09-01。
- [NASA Science, “Earth Facts”](https://science.nasa.gov/earth/facts/)
  地球赤道直径为 12,756 千米（7,926 英里）。用于：核验第四课“地球赤道直径约 13 000 千米 = 1.3 × 10⁴”的近似值。访问日期：2026-09-01。
- [NASA Science, “Mars Facts”](https://science.nasa.gov/mars/facts/)
  火星半径为 3,390 千米（2,106 英里）。用于：核验第三课“火星半径约 3 400 千米 = 3.4 × 10³”的近似值。访问日期：2026-09-01。

### 核验结论与教学依据

- **幂的定义边界：** 第一课只取正整数指数 `n`：`a^n` 表示 `n` 个相同因数 `a` 相乘；`a` 是底数，`n` 是指数。这里指数数的是因数个数，不是乘号个数。零指数、负指数和指数运算律不由这一定义步骤引入。
- **课程阶段：** 在 Common Core 这一条官方课程路径中，whole-number exponents 出现在六年级，整数指数性质和科学记数法出现在八年级。因此本项目面向小学三年级时应明确标为**拓展**，先依赖整数乘法和位值基础；这不是对其他国家或地区年级安排的概括。
- **第一课范围：** 只教“同一因数的重复乘法 → 幂”，并辨认底数与指数；暂不进入科学记数法。
- **第二课范围：** 只在正整数指数 2 到 6 内连接 `10ⁿ`、十进位值与末尾零的个数；强调指数首先表示因数个数，添零规律依赖底数 10，不引入零指数或科学记数法。
- **第三课范围：** 只做“大整数 → `a × 10ⁿ`”的拆分、还原与规范检查，例子的指数取 3 到 6，系数最多一位小数。“移动小数点”按 OpenStax §10.5 的转换方法教学，并用位值解释（每乘一个 10 位值扩大十倍），不作为脱离位值的独立规则；不引入很小的小数和负指数。v2 起以中文数级（千=10³、万=10⁴、十万=10⁵、百万=10⁶，属常识性数词对应）作为引入支架，正式规则仍以 OpenStax 的规范条件为准。
- **第四课范围：** 正式命名“科学记数法”，在 NASA 核验的天文近似值情境中书写与比较；例子的指数扩展到 8（“1 后面 n 个零”规律由因数个数推得，继续有效）。比较规则限定在单位相同的规范形式：位数 = 指数 + 1，故先比指数、同指数再比系数；这是位值推理，不是新公理。真实数量一律取一位小数以内的近似值并标注“约”；不引入很小的小数、负指数和科学记数法运算。
- **科学记数法规范：** 正数写成 `a × 10^n` 时必须满足 `1 ≤ a < 10`，`n` 为整数；`a` 可以是小数，但小数点左边只能保留一位非零数字。
- **先教大整数：** 第一阶段只选择转换后 `n > 0` 的正整数（即数值至少为 `10`，实际例题选用多位大数），不把小于 `1` 的小数作为待表示对象，也不出现负指数。`10` 只是这个教学子范围的下界，不是“大数”的通用定义；科学记数法本身没有固定的最大整数上限。
- **书写规范：** 系数与 `10^n` 之间使用乘号 `×`，不用字母 `x`。

## Wisdom (Communities)

本研究范围内没有核验到能直接支持上述正式定义或课程阶段结论的高信任度社区资源，因此不列 Wisdom；后续教学解释以 Knowledge 来源为准。
