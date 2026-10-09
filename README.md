# 知径（KnowTrail）

> 从一个知识点出发，走出自己的学习路径。

“知”代表可理解、可验证的知识单元，“径”代表由前置关系连接而成的个性化学习路径。

知径是一个以**知识单元**为核心、由 AI / Agent Skills 辅助建设的儿童学习仓库。项目希望从孩子真正需要理解的知识出发，而不是被某个年级、教材版本或固定课程顺序限制。

## 项目目标

- 覆盖语文、数学、英语、物理、化学、生物六个学科方向。
- 将知识拆成可独立学习、可检查掌握情况、可继续组合的知识单元。
- 用前置关系连接知识单元，让学习可以从薄弱点切入，并逐步形成个性化路径。
- 默认提供互动网页，同时为每个知识单元提供可独立使用的打印版。
- 借助可复用的 Agent Skills 生成、审查和持续改进教程，而不是一次性堆积内容。

## 当前默认学习者画像

当前默认面向一名小学三年级孩子，参考上海现行教材与日常学习情境，使用简体中文进行讲解；英语内容按学习目标保留必要的英文，并提供适龄解释。

学习者画像只影响讲解语言、例子、学习步长和难度，不决定知识单元的目录结构，也不把内容锁定在某个年级或教材版本。具体任务可以覆盖默认画像，并为其他年龄、基础或学习目标生成不同版本。

## 内容模型

### 知识单元

知识单元是仓库中的基本学习对象：围绕一个可以清楚描述和验证的学习目标，形成一份完整的小型教程。每个知识单元至少说明：

- 标题与所属学科；
- 可观察的学习目标；
- 前置知识单元；
- 难度与适龄提示；
- 预计时间和所需材料；
- 可选的年级、课标或教材映射；
- 学完后的掌握标准与推荐下一步。

一个单元可以带有多个学科标签，但应指定一个主要归属，避免重复维护同一份内容。

### 前置关系

知识单元通过前置关系形成知识网络，而不是一条固定年级路线。生成教程前先确认学习者是否具备必要前置知识；若不具备，应推荐或补充更基础的知识单元。

### 教程学习闭环

每个知识单元默认遵循四个阶段：

1. **诊断**：用少量问题或活动检查前置知识和常见误解。
2. **讲解**：使用适龄语言、直观例子和必要的正式表达建立理解。
3. **练习**：从模仿到迁移逐步提高，包含基础、应用和挑战层次。
4. **反馈**：提供答案解析、错误提示、掌握标准和下一步建议。

## 学科定位

| 学科 | 重点 |
| --- | --- |
| 语文 | 阅读、表达、词句理解、写作与文化积累 |
| 数学 | 数感、运算、空间、逻辑、问题解决与数学表达 |
| 英语 | 听说读写、自然语境、词汇语法与实际沟通 |
| 物理 | 从运动、力、声、光、热、电等生活现象建立初步模型 |
| 化学 | 从材料、变化、混合与微观想象建立初步概念 |
| 生物 | 从生命现象、人体、动植物、生态与观察实践建立理解 |

物理、化学、生物允许适度超前，但以年龄适配、现象理解和安全探索为前提，不直接照搬初高中课程的抽象程度与训练强度。

## 输出形态

### 在线访问与 GitHub Pages

- 站点地址：[知径在线课程](https://lovvvve.github.io/knowtrail/)。根目录 `index.html` 提供课程、纸笔材料和速查卡入口。
- 首次启用：仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。此后推送到 `main` 自动部署，也可在 **Actions → Deploy GitHub Pages → Run workflow** 手动运行。
- [部署工作流](./.github/workflows/pages.yml) 使用 GitHub 官方 Pages Actions；PR 只构建并检查内部链接，`main` 构建通过后才发布。
- 本地运行 `python3 tools/build_site.py`，生成并验证 `_site/`；再运行 `python3 -m http.server 8000 --directory _site`，访问 `http://localhost:8000/` 预览。两条命令均只需 Python 3.9+ 标准库，无需安装前端依赖。
- 构建保留课程相对路径，发布首页及课程目录中的静态资源；`NOTES.md`、学习记录、Skills 和仓库配置不进入站点产物。既有课程中的 Markdown 资料链接在发布副本中指向 GitHub 源文件；课程页增加返回首页入口。
- `_site/` 是可重复生成的产物，不纳入 Git。新增知识单元后，在 `index.html` 更新课程索引；其 `lessons/`、`reference/`、`printable/`、`assets/` 中支持的静态文件会自动收集并检查链接。
- 在线课程的互动完成标记仍仅保存在当前浏览器，与直接打开本地 HTML 的进度分开；没有账号、作答上传或跨设备同步。

### 互动网页（优先）

网页互动应服务于学习目标，例如操作、预测、即时反馈、分步提示或可视化。页面需要兼顾儿童使用、键盘操作、移动设备和清晰反馈；纯装饰性动画不算有效互动。

需要视频讲解时，优先用页面内代码绘制的动画（参考 [`cartoon-video.js`](./content/math/multi-digit-multiplication/assets/cartoon-video.js)）：时间线以页面中的文字稿为唯一来源，提供字幕、章节、可拖动进度和暂停预测，离线可用，不嵌入外部视频或联网语音。

### 可打印版（配套）

打印版应在离线和纸笔环境中独立完成学习闭环。网页中的关键互动需要转换成等价的观察、绘制、排序、填写、实验记录或讨论任务，而不是简单截图网页。

## 预期目录

目录按真实需求渐进创建，不要求一次建全：

```text
content/
└── <subject>/
    └── <unit-slug>/
        ├── unit.md          # 元数据、教学设计与共享内容
        ├── MISSION.md       # 该主题的真实学习使命
        ├── RESOURCES.md     # 经核验的知识与实践来源
        ├── NOTES.md         # 教学偏好与工作备注
        ├── lessons/         # 编号的互动 HTML 课程
        ├── reference/       # 可快速查阅和打印的参考卡
        ├── printable/       # 独立的可打印材料及答案
        ├── assets/          # 多节课程共用的组件与样式
        └── learning-records/ # 有学习证据后再创建
templates/                 # 知识单元与审查模板
.agents/
└── skills/                # 项目级 Agent Skills
tools/                     # 构建、检查与转换工具
skills-lock.json           # 第三方 Skills 的来源与内容锁定
```

路径使用稳定的英文 `kebab-case` 名称，面向学习者的标题与正文使用自然中文。尚未存在的目录应在首次真正需要时创建。

## 已安装的 Agent Skill

- [`teach`](./.agents/skills/teach/SKILL.md)：通过 `/teach <学习主题>` 启动一个可跨会话持续推进的教学工作区，生成短小的互动 HTML 课程、参考资料和学习记录。来源：[mattpocock/skills](https://github.com/mattpocock/skills/tree/main/skills/productivity/teach)。

`teach` 是仅由用户显式调用的 Skill，命令名称是 `/teach`，不是 `/tech`。在本仓库中，每个 `content/<subject>/<unit-slug>/` 都是一个独立教学工作区，分别维护自己的使命、资源、课程和学习记录。

## 协作入口

- 人类维护者先阅读本文件，了解项目目标和内容模型。
- 所有智能体必须遵循 [`AGENTS.md`](./AGENTS.md)。
- Claude 从 [`CLAUDE.md`](./CLAUDE.md) 进入，并以 `AGENTS.md` 为唯一规则源。

## 当前状态

新增数学知识单元 [“多位数乘多位数”](./content/math/multi-digit-multiplication/unit.md)，包含三节短课：[拆开乘，再相加](./content/math/multi-digit-multiplication/lessons/0001-two-digit-no-carry.html)、[进位不慌](./content/math/multi-digit-multiplication/lessons/0002-two-digit-with-carry.html)、[三位数乘两位数](./content/math/multi-digit-multiplication/lessons/0003-three-digit-by-two-digit.html)，以及[速查卡](./content/math/multi-digit-multiplication/reference/multiplication-quick-reference.html)和各课独立打印材料。每课含一段约 2 分钟的卡通动画视频，由页面代码绘制，带字幕、章节、文字稿和中途暂停预测题；课程齐备不表示学习者已经掌握。

新增数学知识单元 [“四则运算：添括号与去括号”](./content/math/arithmetic-parentheses/unit.md)，包含三节短课：[加减法](./content/math/arithmetic-parentheses/lessons/0001-addition-and-subtraction.html)、[乘除法](./content/math/arithmetic-parentheses/lessons/0002-multiplication-and-division.html)、[混合运算的边界](./content/math/arithmetic-parentheses/lessons/0003-mixed-operations.html)，以及[速查卡](./content/math/arithmetic-parentheses/reference/parentheses-quick-reference.html)和各课独立打印材料。默认从第一课诊断开始，乘除与分配律作为拓展；课程齐备不表示学习者已经掌握。

仓库已完成初始化，并建立首个数学知识单元 [“幂与科学记数法”](./content/math/powers-and-scientific-notation/unit.md)。该单元的课程已全部编写完成：四节教学课（[第一课“重复乘法的秘密缩写”](./content/math/powers-and-scientific-notation/lessons/0001-repeated-multiplication-to-powers.html)、[第二课“10 的幂与零”](./content/math/powers-and-scientific-notation/lessons/0002-powers-of-ten-and-zeros.html)、[第三课“移动小数点表示大数”](./content/math/powers-and-scientific-notation/lessons/0003-split-big-numbers-with-ten-powers.html)、[第四课“大数的科学记数法”](./content/math/powers-and-scientific-notation/lessons/0004-scientific-notation-for-big-numbers.html)），以及收官的 [第五课“宇宙数字总复习”](./content/math/powers-and-scientific-notation/lessons/0005-cosmic-numbers-unit-review.html)、[单元术语速查卡](./content/math/powers-and-scientific-notation/reference/0005-unit-glossary-and-map.html)和[可打印掌握检查卷](./content/math/powers-and-scientific-notation/printable/0005-unit-mastery-check.html)。课程文件可以预先准备，但学习路径仍需依据学习者的实际表现推进。
