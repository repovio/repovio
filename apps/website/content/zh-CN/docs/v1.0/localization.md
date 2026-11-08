---
title: '界面本地化'
description: '支持的界面语言、回退行为以及维护 Repovio 翻译的过程。'
---

> 存档源快照。产品标签已标准化为 Repovio。对于此历史版本，使用其标记部署文件中的配置标识符和容器引用不变。

Repovio 提供英语 (`en`)、德语 (`de`)、西班牙语 (`es`)、法语 (`fr`)、意大利语 (`it`)、荷兰语 (`nl`)、波兰语 (`pl`) 和葡萄牙语的 Web 界面（`pt`）。应用程序标题中的语言菜单可供每个登录用户使用。选择语言会将首选项保存在
`ezrepo-locale` 浏览器 cookie 中，并在以后的访问中应用它。

英语是确定性的默认值和后备。当浏览器首选项或保存的 cookie 无法识别受支持的区域设置时，Repovio 会呈现英语。日期、时间和数字格式使用选定的区域设置。

<a id="adding-or-updating-a-locale"></a>

## 添加或更新区域设置

1.使用`en.json`作为完整的密钥参考添加或更新`apps/web/i18n/locales/<locale>.json`。2. 在 `apps/web/nuxt.config.ts`
中注册其区域设置代码、文件名和本机显示名称。3. 保留`en.json`中存在的所有消息密钥； Web 测试套件会检查每个已发布语言环境的奇偶性。4. 为每个新的用户可见界面字符串添加英语和德语消息，然后将相应的翻译添加到每个已发布的区域设置。5. 运行
`pnpm --filter @repovio/web test`、`pnpm --filter @repovio/web typecheck` 和受影响的 Playwright 测试。

提供者名称、存储库名称、工作流名称和其他提供者提供的数据保持不变，因为它们不是 Repovio 接口副本。
