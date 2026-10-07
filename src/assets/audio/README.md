# 内置背景音乐

沿用原项目默认的 11 首背景音乐，来源为 https://to2026.xyz/resource/audio/ 。2026-10-07 因源站证书过期，将现有音频恢复为项目静态资源，随 Cloudflare 部署。播放时通过本站 HTTPS 加载，不依赖原站，也不会绕过浏览器的证书校验。

全部转码为 128 kbps、44.1 kHz 双声道 MP3，统一浏览器格式支持并减少体积。歌单保留原来的展示名称；`src/utils/music.ts` 记录名称与资源的对应关系，Vite 为产物生成内容哈希。音频仅在播放时加载。

这些音乐沿用原项目的素材；项目的代码许可证不代表第三方音频的授权。

| 原歌单名称 | 项目文件 | 时长（秒） |
| --- | --- | --- |
| Radetzky March.mp3 | radetzky-march.mp3 | 187 |
| Geoff Knorr - China (The Industrial Era).ogg | china-industrial.mp3 | 215 |
| Geoff Knorr&Phill Boucher - China (The Atomic Era).ogg | china-atomic.mp3 | 199 |
| Shanghai.mp3 | shanghai.mp3 | 241 |
| Waltz No.2.mp3 | waltz-no-2.mp3 | 223 |
| WildChinaTheme.mp3 | wild-china.mp3 | 134 |
| 边程&房东的猫 - 美好事物-再遇少年.ogg | beautiful-things.mp3 | 245 |
| 大乔小乔 - 相见难别亦难.ogg | hard-to-part.mp3 | 202 |
| 你要跳舞吗-新裤子.mp3 | dance.mp3 | 193 |
| 生命-声音玩具.mp3 | life.mp3 | 540 |
| 与非门 - Happy New Year.ogg | happy-new-year.mp3 | 219 |

原文件 SHA-256（用于核对恢复来源）：

```text
b7656fcc22da31875b3f6be328cd771e9e0b2e1f4388c8a4a433f516636467af  Radetzky March.mp3
1d5a8f20ea2f499fe86abcd87a1ef1d8b87222a110fa8d85536561848e2fa834  Geoff Knorr - China (The Industrial Era).ogg
d8924d75045663d1308ce7f14e4c345fc58da5efd4dac3eff2814f49c6858295  Geoff Knorr&Phill Boucher - China (The Atomic Era).ogg
d7055ba53884765856f732679ee953a1ec1e7e743c2989b365fd5e0b75b6dfe4  Shanghai.mp3
7292a19815902f404dec40b00a07f575b5a4d7c57891ec4a483e0b1c84a2af2e  Waltz No.2.mp3
6d14371e2aa7df47bbdafcc7183bcacee6fbb2a408e12d95398e4e9c44576f96  WildChinaTheme.mp3
3456165d370153ad8c7f789c55aa4f71dab8eb455d18ab71d0c1d1633422c302  边程&房东的猫 - 美好事物-再遇少年.ogg
e5ff8b083706548bbb8df63117f70e7fb1250448474e34880e6e30179056177a  大乔小乔 - 相见难别亦难.ogg
59b38c5ca681eb86e5cd522486af602bcafc9324abeac8b1ad9784b34c28e6eb  你要跳舞吗-新裤子.mp3
63263953334ed606984dff7b1ded15b9663691f337afc5b41d6ea357a97b53c7  生命-声音玩具.mp3
b1a9d7f9098cc7ecb0ed79e4688ffca51e6749a32e881e025c7e1cc08423dd94  与非门 - Happy New Year.ogg
```
