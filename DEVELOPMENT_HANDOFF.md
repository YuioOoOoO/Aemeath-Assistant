# 爱弥斯桌面助手开发交接文档

> 最后核对时间：2026-08-30（Asia/Shanghai）  
> 工作区：`F:\Projects\VoiceAssistant\Open-LLM-VTuber`  
> 用途：供后续新的开发对话快速接手当前项目。

## 0. 接手前必须先看

1. **不要执行 `git reset --hard`、`git clean`、覆盖式重新克隆或回退整个工作区。**
2. 当前仓库基线仍是上游提交 `992309c`，绝大多数定制开发均未提交。
3. `frontend-desktop/` 是目前真正使用的 Electron 桌面前端。它本身是一个独立 Git 仓库，但在外层主仓库中仍显示为整个未跟踪目录；处理版本控制时必须分别检查两层仓库。
4. `frontend` 是原上游前端子模块，当前也显示有改动；不要把它与 `frontend-desktop/` 混淆。
5. `conf.yaml` 中存在真实的模型与语音服务凭据。本文件不会记录密钥；检查、展示日志或提交代码时也不得泄露。
6. 修改任何功能前先运行 `git status --short`，只改本次目标涉及的文件，保留用户现有工作。

## 1. 项目目标与当前形态

本项目从 Open-LLM-VTuber 二次开发而来，现已改造成“爱弥斯桌面助手”。核心目标是：

- 以爱弥斯为默认 Live2D 角色。
- 同时支持窗口模式与 Pet 桌宠模式。
- 保留并整合对话框、任务栏、系统托盘、模型右键菜单。
- 使用 DeepSeek 进行对话，使用火山引擎进行中文语音合成。
- 支持麦克风输入、语音情绪分段、Live2D 动作/表情与口型联动。
- 支持内置联网搜索 MCP。
- 可打包为 Windows 安装程序，点击桌面图标时自动启动随包后端。

工作区上一级还保留原素材目录：

- `F:\Projects\VoiceAssistant\爱弥斯桌宠`
- 点击动作/表情配置表：`F:\Projects\VoiceAssistant\爱弥斯桌宠\表情动作桌宠配置.xlsx`

## 2. 用户明确要求的交互规则

### 2.1 鼠标点击动作与表情

- 完全使用模型原生动作和表情，不额外加入淡入、淡出或其他渲染过渡。
- 不采用“播放若干秒后自动清空表情”的逻辑。
- 表情应在**下一个表情开始时**清理，而不是由固定计时器清理。
- 点击侧的打断规则：
  - 待机动作可以被打断。
  - 其他非待机动作和表情不可被点击打断。
- 一次点击只能触发并播放一次动作，不能无限循环。
- “出现猫耳”和“戳猫耳”是两个不同动作，修改时不能混淆。
- “出现猫耳”的点击区域曾与左侧头发区域的“食指-鬼点子”触发条件冲突，已按优先级/命中范围调整。后续改命中判定时须同时回归这两项。
- 点击映射以 `表情动作桌宠配置.xlsx` 和当前代码实现共同为准。

### 2.2 语音动作、表情和情绪

- 长回复会拆成多个带情绪的小句子，分别交给火山引擎 TTS。
- 情绪标记格式为 `[emotion:intensity]`，强度范围 1–5。
- 一个情绪可以映射多个动作/表情，根据情绪强度选择更合适的组合。
- 当前动作选择虽接收 1–5，但实际只划分为 `weak(1–2)`、`medium(3)`、`strong(4–5)` 三档，不是五套完全独立动作；若以后宣传或调整“强度五档”，需先扩展模型映射。
- 语音侧后到的动作/表情可以直接打断当前语音动作/表情。
- 一句话最后一个情绪分段播放结束后，不能立即用待机覆盖；应等待最后动作/表情完成，再回到待机。
- 控制权边界：
  - 从“开始说话”到“说话结束并回到待机”为语音系统控制。
  - 其他时间由鼠标点击系统控制。
- 语音结束必须同时完成：
  - 清除“思考/说话中”状态；
  - 平滑收口；
  - 播放完最后动作/表情；
  - 最终恢复默认/待机状态。

当前 `model_dict.json` 中爱弥斯（内部模型名 `xiaoai`）的语音情绪映射已经重新设计。强度分档仍为 `weak(1–2)`、`medium(3)`、`strong(4–5)`；同一档位存在多个候选时，代码会随机选择一个表情和一个动作。

| 情绪 | 弱（1–2） | 中（3） | 强（4–5） |
|---|---|---|---|
| `neutral` | 无 | 点头 | 点头 / 摇头 |
| `joy` | `》《` + 点头/笑 | `》《` + 笑/笑2/剪刀手 | `》《` + 笑3/跳一下/剪刀手 |
| `smirk` | 咬嘴 + Wink | 呲牙/咬嘴 + Wink/食指鬼点子 | 吐舌/呲牙 + 食指鬼点子/摇头 |
| `sadness` | 可怜 | 可怜 + 抱抱 | 哭 + 哭泣动作 |
| `surprise` | 点头 | 惊讶动作 | 惊讶动作/跳一下 |
| `anger` | 生气 + 摇头 | 生气 + 摇头/食指鬼点子 | 生气/黑化 + 拿剑/食指鬼点子 |
| `disgust` | 横眼 + 摇头 | 横眼 + 摇头/捂嘴 | 横眼/黑化 + 摇头/拿剑 |
| `fear` | 可怜 | 可怜 + 抱抱/捂嘴 | 可怜/晕 + 晕/摇晃或跳一下 |

用户明确要求语音情绪映射中**不要使用**以下三个表情：`豆豆眼`（ID 0）、`呆`（ID 4）、`嘟嘴`（ID 12）。2026-08-30 已用 JSON 解析脚本确认当前 `voiceEmotionMap` 不含这三个 ID。后续调整映射时必须继续保持这一限制；不要误改鼠标点击映射。

### 2.3 口型规则

- 说话期间，语音口型必须覆盖动作自带嘴型。
- 语音开始的第一帧就应接管嘴型，不能先闪出一次动作嘴型再跳到说话嘴型。
- 说话结束后应平滑释放口型，不能从张嘴直接跳成待机嘴型。
- 嘴型张合频率曾被要求放慢。
- 用户多次要求增大口型。目前 `use-audio-task.ts` 中先以 `lipSyncScale = 2.0` 放大 RMS，`lappmodel.ts` 更新参数时又有约 2.6 倍放大并执行 clamp，因此最终视觉幅度不是简单的“2.0 倍”。这与对话中提出过的“2.3 倍、再放大”不能直接一一对应。后续调口型应以实际视觉效果为准，并同时检查两处缩放和平滑/上限，避免只改一处看不出变化。

### 2.4 “倾听中”动态状态图标

Live2D 角色头部右上方已增加粉白金配色的动态倾听图标，图形由白色翅膀式耳朵、粉色双侧声波和暖金色星星组成，背景完全透明。图标采用 SVG/CSS 动画，不修改或重新生成 Live2D 模型。

显示条件必须同时满足：

- 麦克风逻辑状态为开启（`micOn`）；
- VAD 音频管线实际运行（`isVadRunning`）；
- 全局状态条为 `AiStateEnum.LISTENING`。

因此它不会在普通 `idle`、思考、AI 说话、麦克风关闭或 VAD 未启动时显示。图标使用 `pointer-events: none`，隐藏后不运行位置采样；支持 `prefers-reduced-motion`。位置基于 Live2D 当前可见 drawable 边界计算，并与角色缩放、拖动和窗口尺寸联动。

集中配置位于：

- `frontend-desktop/src/renderer/src/components/canvas/listening-indicator-config.ts`
- 当前主要参数：`anchorXRatio=0.79`、`anchorYRatio=0.85`、水平偏移 `0.13`、垂直偏移 `-0.055`、宽度比例 `0.18`、范围 `36–104px`、位置采样 `30fps`。

实现文件：

- `frontend-desktop/src/renderer/src/components/canvas/listening-indicator.tsx`
- `frontend-desktop/src/renderer/src/components/canvas/listening-indicator.css`
- `frontend-desktop/src/renderer/src/components/canvas/live2d.tsx`
- `frontend-desktop/src/renderer/src/context/vad-context.tsx`

`resources/listening-indicator-preview.svg` 是预览/参考资源；运行时图标由组件内 SVG/CSS 渲染，不应直接裁剪整张参考图作为图标。

## 3. 爱弥斯模型与角色配置

- 爱弥斯 Live2D 素材已从 `爱弥斯桌宠` 导入本项目。
- 默认角色预设为 `aimisi`。
- 当前 Live2D 模型配置名在部分配置中仍为 `xiaoai`，这是现有内部标识，不要仅凭名字误判成错误角色。
- 头像和 Windows 应用图标已替换为爱弥斯大头照。
- 应用图标已重建为 16–256 像素多尺寸 ICO，解决任务栏小尺寸图标异常。
- Windows 应用标识：`com.aimisi.desktop-assistant`。
- 应用可执行文件名：`AimisiDesktopAssistant`。

关键配置/素材入口：

- `model_dict.json`
- `live2d-models/`
- `avatars/`
- `prompts/utils/live2d_expression_prompt.txt`
- `src/open_llm_vtuber/live2d_model.py`

## 4. 窗口模式与 UI 设计要求

窗口模式已经过多轮重做，后续应保持现有设计语言：

- 暗紫梅色 + 爱弥斯粉色点缀。
- 大圆角、低对比半透明层次、简洁高级感。
- 不要重新引入纯黑大框、纯白滚动条或黑色低对比文字。
- 窗口外层、主界面、设置、群组、历史、底栏均采用统一圆角风格。

已经完成的界面调整：

- 爱弥斯为默认角色，启动时应是正常中性表情，不应默认加载“豆豆眼”等情绪表情。
- 字幕显示可由用户自由关闭，并纳入持久化。
- “新对话”和连接状态已移动到底部输入栏右侧。
- 右侧两项为上下结构、宽度一致；连接状态为细长状态条，“新对话”为常规操作按钮。
- 左侧和中间的麦克风、打断及输入框布局不应随意改动。
- 左侧栏有收起/展开按钮；收起后只显示主界面，不能残留黑边。
- 设置页改为类似群组页的大型圆角抽屉。
- 设置页底部保存/取消栏已重新设计并固定。
- 群组和历史页已去掉底部关闭按钮，统一使用右上角主题化关闭按钮。
- 下拉菜单已处理层级/Portal，不能再被设置面板裁切。
- 下拉菜单颜色与背景已拉开层次。
- 角色预设下拉列表曾出现两个 `aimisi`，已做去重；后续合并服务端列表与本地默认项时仍须保持按值去重。
- 设置页和历史页滚动条应使用统一的暗紫/粉色主题，不应出现原生白色滚动条。
- “关于”页文字颜色已针对暗色背景调整。
- 顶栏“爱弥斯 · 桌面助手”已向右留出空间。
- 最外层 Electron 窗口使用透明背景，由渲染层形成圆角外观。
- Pet 切回窗口模式时 Live2D 曾消失，当前模式切换握手已包含重新布局/渲染确认；修改该链路必须回归模型可见性。

主要 UI 文件：

- `frontend-desktop/src/renderer/src/components/sidebar/`
- `frontend-desktop/src/renderer/src/components/sidebar/setting/setting-ui.tsx`
- `frontend-desktop/src/renderer/src/components/sidebar/setting/setting-styles.ts`
- `frontend-desktop/src/renderer/src/components/sidebar/setting/common.tsx`
- `frontend-desktop/src/renderer/src/components/sidebar/setting/general.tsx`
- `frontend-desktop/src/renderer/src/components/sidebar/setting/about.tsx`
- `frontend-desktop/src/renderer/src/components/sidebar/setting/models.tsx`

## 5. 窗口模式、Pet 模式、任务栏与托盘

目标行为：

| 场景 | 任务栏图标 | 最小化 | 点击关闭 |
|---|---|---|---|
| 窗口模式 | 显示 | 收到任务栏 | 隐藏到托盘，并从任务栏消失 |
| Pet 模式 | 不显示 | 保持现有 Pet 行为 | 保持现有 Pet/托盘行为 |

相关实现集中在：

- `frontend-desktop/src/main/window-manager.ts`
- `frontend-desktop/src/main/menu-manager.ts`
- `frontend-desktop/src/main/index.ts`

注意事项：

- 该功能曾反复修改并发生过回滚；当前代码中使用 `setSkipTaskbar(...)` 按模式切换。
- 不要再把主窗口改成 Electron `toolbar` 类型，Windows 上会导致任务栏图标恢复不可靠。
- 修改后必须分别验证：窗口模式启动、最小化、关闭到托盘、托盘恢复、切 Pet、Pet 再切窗口、重启后恢复上次模式。

## 6. 托盘与模型右键菜单

- 托盘使用自定义暗紫圆角菜单，不使用系统原生白色菜单。
- 已去掉托盘弹出菜单外围多余半透明圈。
- Pet 模型右键菜单也使用自定义主题。
- 菜单状态必须来自实际运行状态，不能只依赖旧缓存。例如：
  - 对话框显示/隐藏；
  - 麦克风开/关；
  - 屏幕共享；
  - 鼠标穿透；
  - 滚轮缩放；
  - 当前窗口/Pet 模式。
- 右键菜单曾被对话框遮挡，已通过置顶层级和 `moveTop()` 等逻辑修复。改窗口层级时需回归。
- PowerShell 输出中部分中文字符串可能显示乱码，但实际应用此前能正常显示中文。不要只看终端显示就批量重编码；先检查文件实际 UTF-8 字节和应用渲染。

## 7. 设置与状态持久化

### 7.1 主进程窗口状态

`frontend-desktop/src/main/window-manager.ts` 将窗口状态保存到：

`%APPDATA%\open-llm-vtuber\window-state.json`

保存内容包括：

- 窗口位置和大小；
- 是否最大化；
- 当前窗口/Pet 模式。

### 7.2 渲染层用户设置

前端通过 localStorage 保存用户可调状态，包括但不限于：

- 窗口模式和 Pet 模式下各自的 Live2D 位置；
- 对话框宽度/位置；
- 字幕显示和紧凑状态；
- 背景图/自定义背景；
- 角色预设；
- 设置页当前标签；
- 鼠标穿透；
- 其他前端开关。

主要代码：

- `frontend-desktop/src/renderer/src/hooks/utils/use-local-storage.tsx`
- `frontend-desktop/src/main/window-manager.ts`

后续新增任何用户可修改参数，应同时纳入持久化，并验证重启恢复。

## 8. 麦克风、识别和对话状态

曾修复的问题：

- 界面显示麦克风关闭，但 VAD/模型实际仍在监听。
- 每次重启后必须先关闭再开启麦克风，角色才能听到。
- 语音结束后仍停留在“思考/说话中”。
- 语音结束后表情未恢复默认。

后续修改麦克风逻辑时必须保证：

- UI 状态、音频上下文、VAD 状态、WebSocket 状态一致。
- 启动时若保存状态为开启，应真正初始化音频采集，而不是只把按钮设为开启。
- 结束、错误、打断、WebSocket 断开各路径都应清理说话状态和口型所有权。
- 音频的 `ended/error` 事件已有防重复结束处理，避免一次语音触发多次收尾。
- `isVadRunning` 表示实际 VAD 音频管线是否运行，不能用 `micOn` 或按钮外观代替。倾听状态图标依赖这两个状态与全局 `LISTENING` 状态同时成立。

相关入口：

- `frontend-desktop/src/renderer/src/hooks/utils/use-audio-task.ts`
- `frontend-desktop/src/renderer/src/hooks/utils/use-ipc-handlers.ts`
- `frontend-desktop/src/renderer/src/utils/audio-manager.ts`
- `frontend-desktop/src/renderer/src/hooks/canvas/`
- `frontend-desktop/src/renderer/WebSDK/src/lappadapter.ts`
- `frontend-desktop/src/renderer/WebSDK/src/lappmodel.ts`

## 9. 当前 LLM 与 TTS

当前配置采用：

- LLM 提供商：DeepSeek（OpenAI 兼容接口）。
- 当前模型：`deepseek-v4-flash-vision-exp`。
- 基础地址：`https://api.deepseek.com/v1`。
- 温度：`0.7`。
- TTS：火山引擎 `volcengine_tts`。
- 火山资源：`seed-tts-2.0`。
- 当前音色：`ICL_uranus_zh_female_huoponvhai_tob`。
- 采样率：24000。
- 使用 V3 WebSocket 合成接口。
- 启用情绪，当前 emotion scale 为 4.25。

不要在交接消息、提交记录或截图中复制真实 API 密钥。

重要文件：

- `conf.yaml`
- `src/open_llm_vtuber/config_manager/tts.py`
- `src/open_llm_vtuber/tts/volcengine_tts.py`
- `src/open_llm_vtuber/tts/tts_factory.py`
- `src/open_llm_vtuber/conversations/tts_manager.py`

## 10. 模型供应商设置页

设置中已新增模型配置页：

- 前端：`frontend-desktop/src/renderer/src/components/sidebar/setting/models.tsx`
- 后端：`src/open_llm_vtuber/websocket_handler.py`
- WebSocket 消息：
  - `fetch-model-config`
  - `update-model-config`

当前支持的 LLM 类型：

- OpenAI compatible
- OpenAI
- Gemini
- Zhipu
- DeepSeek
- Groq
- Mistral

当前支持的 TTS 类型：

- Volcengine
- OpenAI-compatible TTS
- SiliconFlow
- Fish Audio

安全设计：

- 后端读取配置时不会把密钥返回前端，只返回是否已配置。
- 密钥输入留空表示保留原密钥。
- 更新后会校验配置、写入 `conf.yaml` 并重新初始化相关服务。

已知设计债务：打包版当前仍把 `conf.yaml` 放在安装目录资源中。覆盖安装可能替换它，且安装目录写权限在不同机器上可能不同。长期应把用户配置迁移到 `%APPDATA%\open-llm-vtuber`，首次启动复制默认配置，后续安装只更新模板而不覆盖用户配置。

## 11. 联网搜索 MCP

联网已启用：

```yaml
use_mcpp: true
mcp_enabled_servers:
  - ddg-search
```

`mcp_servers.json` 中的兼容名称仍是 `ddg-search`，但**当前运行入口**已改为项目内置搜索服务，不再调用原外部 DuckDuckGo MCP：

- `src/open_llm_vtuber/mcpp/web_search_server.py`
- 搜索源：Bing RSS。
- MCP 工具：`search`、`fetch_content`。
- 一般在中国大陆可直接访问，不要求 VPN。

原因与修复历史：

1. 原 DuckDuckGo MCP 在测试环境可启动，但查询经常被反爬验证拦截并返回空结果。
2. 改为内置 Bing RSS 搜索，减少外部包与反爬依赖。
3. 打包安装后曾无法联网，根因不是 VPN，而是 MCP 子进程未继承打包 Python 的 `PYTHONPATH`，导致无法导入 `httpx`。
4. 已在 `src/open_llm_vtuber/mcpp/mcp_client.py` 中以父进程环境为基础构造子进程环境，再叠加服务器配置。
5. `src/open_llm_vtuber/mcpp/server_registry.py` 会把配置中的 `python` 解析为当前 `sys.executable`，确保打包版使用随包 Python。
6. 已用打包运行时验证：服务器连接成功、两个工具可见、Bing 返回 HTTP 200 和搜索结果。

注意：`pyproject.toml`、requirements、锁文件和已打包 site-packages 中仍残留 `duckduckgo-mcp-server` 依赖，因此只是运行入口已替换，依赖和包体尚未真正清理。

当前配置：

```json
{
  "mcp_servers": {
    "ddg-search": {
      "command": "python",
      "args": ["-m", "src.open_llm_vtuber.mcpp.web_search_server"]
    }
  }
}
```

临时测试脚本 `scripts/test_web_search.py` 当前仍是未跟踪文件。它只用于验证打包运行时，正式整理提交前可以删除，或明确转为正式回归测试。

## 12. 对话延迟与 Conversation Error

已定位的主要延迟来源：

- DeepSeek 首 token 等待时间。
- 每个情绪小句都需要建立/执行一次火山 TTS 合成。
- 联网请求只有真正调用 MCP 时才增加耗时。
- 之前搜索 MCP 空结果会诱发代理重试，造成明显额外延迟；内置搜索修复后应减轻。
- 本地 Sherpa ASR 不是主要延迟来源。

当前启用 `faster_first_response: true`。

“conversation error” 偶发问题曾检查过，可能来自模型接口或流式响应中断。再次出现时不要先猜 UI，优先查看：

- 开发后端控制台；
- `logs/`；
- 打包版 `%APPDATA%\open-llm-vtuber\logs\backend.log`；
- DeepSeek 请求状态码/超时；
- TTS WebSocket 异常；
- MCP 工具是否陷入重复调用。

## 13. 后端和前端关键文件索引

后端核心：

- `conf.yaml`
- `model_dict.json`
- `prompts/utils/live2d_expression_prompt.txt`
- `src/open_llm_vtuber/live2d_model.py`
- `src/open_llm_vtuber/agent/output_types.py`
- `src/open_llm_vtuber/agent/transformers.py`
- `src/open_llm_vtuber/conversations/conversation_utils.py`
- `src/open_llm_vtuber/conversations/single_conversation.py`
- `src/open_llm_vtuber/conversations/group_conversation.py`
- `src/open_llm_vtuber/conversations/tts_manager.py`
- `src/open_llm_vtuber/tts/volcengine_tts.py`
- `src/open_llm_vtuber/tts/tts_factory.py`
- `src/open_llm_vtuber/websocket_handler.py`
- `src/open_llm_vtuber/mcpp/web_search_server.py`
- `src/open_llm_vtuber/mcpp/mcp_client.py`
- `src/open_llm_vtuber/mcpp/server_registry.py`

桌面前端核心：

- `frontend-desktop/src/main/index.ts`
- `frontend-desktop/src/main/backend-manager.ts`
- `frontend-desktop/src/main/window-manager.ts`
- `frontend-desktop/src/main/menu-manager.ts`
- `frontend-desktop/src/renderer/src/components/sidebar/`
- `frontend-desktop/src/renderer/src/components/sidebar/setting/`
- `frontend-desktop/src/renderer/src/hooks/utils/use-audio-task.ts`
- `frontend-desktop/src/renderer/src/hooks/utils/use-ipc-handlers.ts`
- `frontend-desktop/src/renderer/src/hooks/utils/use-local-storage.tsx`
- `frontend-desktop/src/renderer/src/hooks/canvas/use-live2d-model.ts`
- `frontend-desktop/src/renderer/src/hooks/canvas/use-live2d-expression.ts`
- `frontend-desktop/src/renderer/src/hooks/canvas/use-live2d-resize.ts`
- `frontend-desktop/src/renderer/src/components/canvas/listening-indicator.tsx`
- `frontend-desktop/src/renderer/src/components/canvas/listening-indicator.css`
- `frontend-desktop/src/renderer/src/components/canvas/listening-indicator-config.ts`
- `frontend-desktop/src/renderer/src/utils/audio-manager.ts`
- `frontend-desktop/src/renderer/WebSDK/src/lappadapter.ts`
- `frontend-desktop/src/renderer/WebSDK/src/lappmodel.ts`

## 14. 开发启动方式

后端：

```powershell
cd F:\Projects\VoiceAssistant\Open-LLM-VTuber
.\.venv\Scripts\python.exe run_server.py
```

前端：

```powershell
cd F:\Projects\VoiceAssistant\Open-LLM-VTuber\frontend-desktop
npm.cmd run dev
```

默认端口：

- 后端 WebSocket/HTTP：`12393`
- 前端开发服务器：`5173`

2026-08-30 最后一次操作已重启后端和 Electron 开发前端：后端当时监听 `localhost:12393`，前端开发服务器为 `localhost:5173`。进程状态会随机器重启或终端关闭变化，接手时仍应重新检查，不能只依赖本记录。

Windows PowerShell 环境优先使用 `npm.cmd`，避免执行策略拦截 `npm.ps1`。

## 15. 构建与发布

普通前端构建：

```powershell
cd F:\Projects\VoiceAssistant\Open-LLM-VTuber\frontend-desktop
npm.cmd run build
```

完整 Windows 安装包：

```powershell
npm.cmd run build:win
```

打包流程：

- `frontend-desktop/src/main/backend-manager.ts`：安装版启动时自动启动随包后端，等待 `127.0.0.1:12393` 就绪，退出应用时停止自己启动的后端。
- `frontend-desktop/scripts/prepare-backend.mjs`：生成随包 `backend-runtime`，包含 Python、site-packages、项目源码、资源、Live2D、模型、配置和离线 ASR。它目前**没有携带 `ffmpeg.exe`**，因此尚不能视为在所有干净 Windows 机器上完全自包含。
- `frontend-desktop/scripts/set-windows-icon.mjs`：修补应用图标与 Windows 元数据。
- `frontend-desktop/build-tools/rcedit-x64.exe`：Windows 资源修改工具。

最近一次完整构建和打包已成功。TypeScript 严格类型检查仍会报告不少上游 Live2D SDK 遗留类型错误；当前实际发布门槛是生产构建成功，不要把所有既有类型错误误判为本次回归。

### 最新可用安装包

- 路径：`F:\Projects\VoiceAssistant\Open-LLM-VTuber\frontend-desktop\release\1.2.1\AimisiDesktopAssistant-1.2.1-setup.exe`
- 大小：`438570214` 字节（约 418 MiB）
- SHA-256：`6E0137C22306FBEC0690EE3898234D0A5C379437F9F4EE84EBF56A1F04F47486`
- 生成时间：`2026-08-30 17:36:57`

这是包含最新倾听图标、重新设计的语音情绪映射，以及此前“安装后 MCP 子进程环境丢失”修复的安装包。已核对随包 `backend-runtime/app/model_dict.json`，语音映射的表情 ID 为 `1,2,3,5,6,7,8,9,10,11`，不含被禁用的 `0,4,12`。更早安装包不应继续作为最新版本分发。

可以覆盖安装，但安装前应完全退出应用和托盘进程。覆盖安装对用户模型配置的长期保存仍存在第 10 节所述设计债务。

## 16. 当前版本控制状态

当前 HEAD：

```text
992309c docs(readme): Fix Trendshift badge link in README
```

当前主要状态：

- 多个后端配置、对话、TTS、MCP、Live2D 文件已修改。
- `frontend` 子模块有改动。
- 外层仓库仍有大量已跟踪改动和未跟踪文件，且本文件 `DEVELOPMENT_HANDOFF.md` 本身仍未跟踪；不要依赖旧的精确数量，接手时以新的 `git status --short` 为准。
- `frontend-desktop/` 在外层仓库中整体未跟踪，但其目录内部另有独立 Git 仓库：`main` 分支，HEAD `d176e7d`。该内层仓库本身也有大量未提交改动，并新增了倾听图标组件、配置、样式与预览资源。
- 新增且未跟踪：
  - `src/open_llm_vtuber/mcpp/web_search_server.py`
  - `src/open_llm_vtuber/tts/volcengine_tts.py`
  - `scripts/test_web_search.py`
  - `tests/`
  - `frontend-desktop/src/renderer/src/components/canvas/listening-indicator.tsx`
  - `frontend-desktop/src/renderer/src/components/canvas/listening-indicator.css`
  - `frontend-desktop/src/renderer/src/components/canvas/listening-indicator-config.ts`
  - `frontend-desktop/resources/listening-indicator-preview.svg`

这意味着当前所有成果主要依赖工作区文件，尚未形成可靠提交历史。正式继续开发前建议先：

1. 审核 `.gitignore`，排除 `node_modules/`、`release/`、`backend-runtime/`、日志、缓存和含密钥配置。
2. 先决定 `frontend-desktop/` 应作为独立仓库、子模块还是并入主仓库，再把真正的源码、资源和构建脚本纳入可靠版本控制。
3. 明确 `conf.yaml`/用户密钥的安全策略。
4. 将现有成果分为若干可审查提交，避免一次超大提交。

注意：这四项属于整理建议，不应在未检查敏感信息前直接执行 `git add -A`。

## 17. 接手后的最低回归清单

每次涉及相关模块时至少验证：

- [ ] 后端能正常启动，端口 12393 可用。
- [ ] 前端自动连接后端，安装版能自动拉起随包后端。
- [ ] 麦克风启动后立即可用，不需要手动关开一次。
- [ ] 麦克风按钮状态与真实监听状态一致。
- [ ] 倾听图标只在 `micOn + isVadRunning + LISTENING` 时显示；`idle`、思考、AI 说话、关闭麦克风和错误状态下隐藏。
- [ ] 倾听图标随 Live2D 移动/缩放，位于头部右上方、不遮挡发饰、不出现半透明背景框或声波裁切，并且不拦截点击。
- [ ] 普通对话、打断、异常结束后状态均恢复“空闲”。
- [ ] 语音口型从第一帧接管、不会被动作嘴型盖住、结束平滑收口。
- [ ] 最后一段语音动作播放完后才回待机。
- [ ] 语音情绪映射不触发豆豆眼、呆或嘟嘴；开心、悲伤、惊讶、生气、厌恶、害怕和得意三档动作符合第 2.2 节。
- [ ] 非说话阶段点击动作有效，一次点击只播放一次。
- [ ] “出现猫耳”“戳猫耳”“食指-鬼点子”分别可触发且不互相错误遮挡。
- [ ] Pet 模式无任务栏图标。
- [ ] 窗口模式有任务栏图标；最小化进入任务栏；关闭进入托盘且任务栏图标消失。
- [ ] 模式切换后 Live2D 不消失。
- [ ] 重启后恢复上次模式、窗口位置、角色位置及设置。
- [ ] 托盘菜单和右键菜单没有透明外圈，不被对话框挡住，状态显示真实。
- [ ] 设置、角色、背景等下拉菜单可见且层级正确。
- [ ] 设置和历史滚动条为统一主题，不出现原生白条。
- [ ] 模型设置页不回显 API 密钥，空密钥更新不会清空旧密钥。
- [ ] 联网搜索 MCP 能加载 `search`/`fetch_content` 并返回实际结果。
- [ ] 完整 `npm.cmd run build` 和目标发布构建成功。

## 18. 当前已知风险和后续优先项

1. **未提交成果风险最高**：先保护工作区，再开发。
2. **密钥分发风险（严重）**：当前 `prepare-backend.mjs` 会直接复制正在使用的 `conf.yaml`。已核对最新安装包资源中的配置与当前含有效 LLM/TTS 凭据的源配置哈希一致，等于真实凭据已经被装入安装包。该安装包只能视为本机测试产物，不能公开分发；应立即轮换已打包的凭据，并改为无密钥模板 + AppData 用户配置。
3. **用户配置升级策略不完善**：应迁移到 AppData，避免覆盖安装覆盖用户自定义模型参数。
4. **口型幅度实际值与最后口头要求可能不一致**：源码当前为 2.0，需要视觉复核。
5. **临时搜索测试脚本未整理**：决定删除或转为正式测试。
6. **严格类型检查存在上游遗留错误**：应区分历史问题与新回归。
7. **偶发 Conversation Error**：再次出现需用日志和请求状态码定位，避免只在前端兜底。
8. **点击目前可能存在重复/并行入口**：React wrapper 同时绑定了 `onPointerDown={handlers.onMouseDown}` 和 `{...handlers}` 中的 `onMouseDown`，且 Cubism SDK 还注册原生 mouse 事件并在 `mouseup` 调用默认 `onTap`。当前 down/up 也未严格过滤 `e.button`，因此右键打开菜单时也可能进入 tap/drag 判定。这些路径可能绕过 `_voiceInteractionActive`、`pointerInteractive` 和自定义优先级，引发一次点击触发多次、语音期被点击改表情或坐标偏移。若再次出现点击重复/说话时表情被打断，优先统一入口并只接受目标鼠标键。
9. **Pet 鼠标穿透/hover 状态有潜在泄漏**：切换模式时主进程的 `hoveringComponents` 未明确清空，旧 hover 状态可能导致下次进入 Pet 后全屏透明窗口持续拦截鼠标。进入/退出 Pet、开启穿透、跨应用点击必须作为专项回归。
10. **Pet 命中区域可能偏大**：当前可见 drawable 的轴对齐包围盒判断可能包含透明区域，造成模型周围也被判为命中；修改时应结合实际 alpha/模型 hit area，不能简单扩大整个捕获框。
11. **任务队列清理不等同于取消正在运行的 Promise**：快速中断或新会话时，旧音频任务理论上可能继续与新任务争用全局 audio manager/口型所有权。若出现重叠播音或状态不归零，优先检查 `TaskQueue.clearQueue()` 与真正的音频取消链路。
12. **快速连续切换模式存在竞态**：模式切换采用 renderer/main 两阶段握手和延时，尚无 generation/cancel 保护；连续点击可能留下旧 continuation，极端情况下主窗口会保持透明。修改模式切换时应增加序列号或取消旧请求。
13. **桌面端仍有安全债务**：主窗口启用了 `nodeIntegration` 且关闭 sandbox，preload IPC 也缺少严格 channel allowlist；自定义菜单窗口权限更宽。公开分发前应收紧权限并回归所有 IPC。
14. **设置的“保存/取消”并非完全事务化**：部分选项会即时写 localStorage、重连或切换角色；取消不一定能完全恢复后端状态。后续若开发设置页，应明确哪些选项即时生效、哪些只在保存时提交。
15. **部分 UI 仍是占位能力**：输入框附件图标目前主要是视觉元素，没有完整点击行为；不要在交接或发布说明中宣称附件上传已经完成。
16. **调试日志可能泄露凭据（严重）**：`ServiceContext` 的 DEBUG 日志会打印完整角色配置，文件日志又固定使用 DEBUG/diagnose。只读核对确认现有两个 debug 日志已含所选 LLM/TTS 凭据信息。不要上传、分享或提交现有日志；应删除敏感配置日志、对密钥做脱敏，并在轮换凭据后清理本机旧日志。
17. **模型设置 WebSocket 缺少认证和 Origin 校验（严重）**：任意网页理论上可连接 localhost 的 `/client-ws` 并修改模型 `base_url`/TTS endpoint。空 key 保留旧密钥的设计会放大重定向风险。公开分发前应增加随机本地令牌、Origin/Host 校验和允许的端点策略。
18. **随包后端缺少 FFmpeg**：当前火山实现生成 MP3，`stream_audio.py` 依赖 pydub/FFmpeg 转 WAV，但安装包只有 Electron 的 `ffmpeg.dll`，没有可供 pydub 使用的 `ffmpeg.exe`。在未安装系统 FFmpeg 的干净电脑上可能只有字幕没有声音。应随包携带合适的 FFmpeg 可执行文件并显式配置路径，或让 TTS 直接输出前端可播放/无需外部解码的格式，再做干净虚拟机测试。
19. **多客户端会话隔离和断开清理有缺陷**：新连接会复用默认缓存的 `agent_engine`，不同 WebSocket 可能共享记忆与 MCP 执行器；断开路径又先删除 context 再尝试取回关闭，导致 close 分支失效。群组/多窗口或重连时可能出现历史污染和子进程残留，应优先重构每会话所有权与 finally 清理。
20. **MCP `fetch_content` 存在 SSRF/提示注入风险**：目前只检查 http(s)，未拦截 localhost、私网、链路本地和重定向目标，网页正文也会直接进入模型上下文。应做 DNS/IP 解析校验、重定向复验、大小/类型限制，并把外部页面明确标记为不可信数据。
21. **配置写入不是原子操作**：`conf.yaml` 直接覆盖写入且无锁，多客户端并发或写入中断可能破坏配置。应使用锁、临时文件、fsync/原子替换，并保留经过脱敏处理的可恢复备份。
22. **情绪映射并非所有配置项都会生效**：提示词只列当前模型 `emotionMap` 中可识别的情绪，额外配置的情绪如果不在模型映射中不会被解析。调整情绪前应同时核对提示词、解析器、模型表情和 TTS 情绪支持。
23. **倾听图标目前使用可见 drawable 边界而非头部骨骼锚点**：对当前爱弥斯模型可正常随动，但更换模型、动作大幅改变可见边界或调整缩放算法后，位置可能漂移。偏移和尺寸必须只在 `listening-indicator-config.ts` 集中调整，不要把魔法数分散到组件和 CSS。
24. **中性与弱惊讶当前也可能播放点头动作**：这是 2026-08-30 经用户确认后执行的映射设计，但语义上仍属于近似方案。若后续获得句意肯定/否定分类，不应继续随机选择点头/摇头；在此之前不要未经确认擅自恢复豆豆眼、呆或嘟嘴。

## 19. 建议给新开发对话的第一条消息

可直接复制以下内容：

```text
请先完整阅读并遵守：
F:\Projects\VoiceAssistant\Open-LLM-VTuber\DEVELOPMENT_HANDOFF.md

然后在 F:\Projects\VoiceAssistant\Open-LLM-VTuber 中执行只读检查（尤其是 git status），确认当前未提交改动和关键文件。不要 reset、clean、重新克隆或覆盖 frontend-desktop，也不要输出 conf.yaml 中的任何 API 密钥。

这是爱弥斯桌面助手的持续开发任务。请保持现有暗紫/粉色圆角 UI、点击与语音控制边界、窗口/Pet/任务栏/托盘规则，以及打包版自动启动后端和内置 MCP 联网搜索实现。接下来我会告诉你本轮具体开发目标；在收到具体目标前先不要改代码。
```
