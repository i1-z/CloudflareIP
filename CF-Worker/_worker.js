// 默认UUID：04c808e2-0b59-47b0-a54b-32fc7ef1c902
// 默认反代IP：proxyip.cmliussss.net

import { connect } from 'cloudflare:sockets';

let 我的VL密钥 = '04c808e2-0b59-47b0-a54b-32fc7ef1c902'; // UUID
let 默认反代IP = 'proxyip.cmliussss.net'; // 默认反代IP

export default {
  async fetch(访问请求, 环境) {
    const 访问路径URL = new URL(访问请求.url);
    const KV对象 = 环境.try; // 绑定名为 try 的 KV 空间

    // 1. 从 KV 中读取用户自定义的反代IP，若无则使用默认值
    let 当前反代IP = 默认反代IP;
    if (KV对象) {
      try {
        const KV中的IP = await KV对象.get('PROXY_IP');
        if (KV中的IP) 当前反代IP = KV中的IP.trim();
      } catch (e) {}
    }

    // 2. 处理 WebSocket 代理流量转发
    if (访问请求.headers.get('Upgrade') === 'websocket') {
      const 读取路径 = decodeURIComponent(访问请求.url.replace(/^https?:\/\/[^/]+/, ''));
      const 动态反代IP = 读取路径.match(/ip=([^&]+)/)?.[1] || 读取路径.match(/pyip=([^&]+)/)?.[1] || 当前反代IP;
      const [客户端, WS接口] = Object.values(new WebSocketPair());
      WS接口.accept();
      启动传输管道(WS接口, null, 动态反代IP);
      return new Response(null, { status: 101, webSocket: 客户端 });
    } else {
      const 部署域名 = 访问路径URL.hostname;
      const 请求路径 = 访问路径URL.pathname;
      const 用户代理 = (访问请求.headers.get('User-Agent') || '').toLowerCase();

      // 3. 后台 KV 编辑页面：/edit
      if (请求路径 === '/edit') {
        if (!KV对象) return new Response('未绑定名为 "try" 的 KV 命名空间', { status: 400 });
        if (访问请求.method === 'POST') {
          const 新IP = await 访问请求.text();
          await KV对象.put('PROXY_IP', 新IP.trim());
          return new Response('保存成功！反代IP已更新。', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        }
        const 编辑网页 = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>KV 配置管理</title><style>body{max-width:600px;margin:40px auto;font-family:sans-serif;padding:0 20px}input{width:100%;padding:10px;margin:10px 0;box-sizing:border-box}button{padding:10px 20px;background:#6366f1;color:#fff;border:none;border-radius:6px;cursor:pointer}</style></head><body><h3>KV 空间 (try) - 反代 IP 设置</h3><p>在此处修改并持久化保存你的反代 IP：</p><input type="text" id="ip" value="${当前反代IP}"><br><button onclick="fetch(location.href,{method:'POST',body:document.getElementById('ip').value}).then(r=>r.text()).then(alert)">保存修改</button></body></html>`;
        return new Response(编辑网页, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }

      // 4. 标准 Base64 统一订阅接口：/sub (完美适配 Clash / Sing-box / v2ray 客户端订阅拉取)
      if (请求路径 === '/sub' || 用户代理.includes('clash') || 用户代理.includes('sing-box') || 访问路径URL.searchParams.has('sub') || 访问路径URL.searchParams.has('b64')) {
        const 节点列表 = [
          `vless://${我的VL密钥}@104.18.81.19:443?encryption=none&security=tls&sni=${部署域名}&fp=random&type=ws&host=${部署域名}&path=pyip%3D${当前反代IP}#【电信 Nodes】6.92mb/s`,
          `vless://${我的VL密钥}@104.26.4.90:443?encryption=none&security=tls&sni=${部署域名}&fp=random&type=ws&host=${部署域名}&path=pyip%3D${当前反代IP}#【联通 Nodes】10.27mb/s`,
          `vless://${我的VL密钥}@172.64.82.114:443?encryption=none&security=tls&sni=${部署域名}&fp=random&type=ws&host=${部署域名}&path=pyip%3D${当前反代IP}#【移动 Nodes】12.98mb/s`,
          `vless://${我的VL密钥}@${当前反代IP}:443?encryption=none&security=tls&sni=${部署域名}&fp=random&type=ws&host=${部署域名}&path=pyip%3D${当前反代IP}#【默认反代】直连节点`
        ];
        const 编码订阅内容 = btoa(节点列表.join('\n'));
        return new Response(编码订阅内容, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Subscription-Userinfo': 'upload=0; download=0; total=1073741824000; expire=4102329600'
          }
        });
      }

      // 5. 默认访问根目录：返回你提供的高颜值现代 UI HTML 界面
      const html网页 = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VLESS节点生成器</title>
    <style>
        :root {
            --clr-primary: #6366f1;
            --clr-primary-dark: #4f46e5;
            --clr-accent: #f59e0b;
            --clr-success: #10b981;
            --clr-danger: #ef4444;
            --clr-bg-start: #0f0c29;
            --clr-bg-mid: #302b63;
            --clr-bg-end: #24243e;
            --clr-card-bg: #ffffff;
            --clr-text: #1e293b;
            --clr-text-secondary: #64748b;
            --clr-border: #e2e8f0;
            --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
            --shadow-md: 0 4px 20px rgba(0,0,0,0.08);
            --shadow-lg: 0 20px 60px rgba(0,0,0,0.15);
            --rad: 12px;
            --rad-sm: 8px;
            --tran: 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
            background: linear-gradient(-45deg, var(--clr-bg-start), var(--clr-bg-mid), var(--clr-bg-end), #1a1a2e);
            background-size: 400% 400%;
            animation: gradientShift 20s ease infinite;
            min-height: 100vh;
            padding: 30px 20px;
            color: var(--clr-text);
            line-height: 1.6;
        }
        @keyframes gradientShift { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }
        .container {
            max-width: 860px; margin:0 auto; background: var(--clr-card-bg);
            border-radius:20px; box-shadow: var(--shadow-lg); padding: 36px 32px;
            position:relative; overflow:hidden;
        }
        .container::before {
            content:''; position:absolute; top:0; left:0; right:0; height:4px;
            background: linear-gradient(90deg, var(--clr-primary), var(--clr-accent), #ec4899, var(--clr-primary));
            background-size:300% 100%; animation: shimmer 3s ease infinite;
        }
        @keyframes shimmer { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }
        .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:28px; padding-bottom:20px; border-bottom:2px solid var(--clr-border); }
        .header-left { display:flex; align-items:center; gap:12px; }
        .logo-icon { width:44px; height:44px; border-radius:12px; background: linear-gradient(135deg, var(--clr-primary), var(--clr-accent)); display:flex; align-items:center; justify-content:center; font-size:22px; color:#fff; box-shadow:0 4px 12px rgba(99,102,241,0.3); }
        .header h1 { font-size:1.6rem; font-weight:700; color:var(--clr-text); }
        .header h1 span { background: linear-gradient(135deg, var(--clr-primary), var(--clr-accent)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .form-section { display:grid; gap:20px; margin-bottom:24px; }
        .form-group { display:flex; flex-direction:column; gap:6px; }
        .form-group label { font-weight:600; font-size:0.9rem; color:var(--clr-text); display:flex; align-items:center; gap:6px; }
        .form-group input, .form-group select {
            width:100%; padding:11px 14px; border-radius:var(--rad-sm);
            border:2px solid var(--clr-border); font-size:0.92rem; font-family:inherit;
            color:var(--clr-text); background:#f8fafc; transition:var(--tran); outline:none;
        }
        .form-group input:focus, .form-group select:focus { border-color:var(--clr-primary); background:#fff; box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
        .form-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .btn-group { display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
        .btn {
            display:inline-flex; align-items:center; justify-content:center; gap:8px;
            padding:12px 28px; border-radius:var(--rad-sm); font-size:0.95rem; font-weight:600;
            font-family:inherit; border:none; cursor:pointer; transition:var(--tran); flex:1; min-width:180px; color:#fff;
        }
        .btn-primary { background:linear-gradient(135deg, var(--clr-primary), var(--clr-primary-dark)); box-shadow:0 4px 14px rgba(99,102,241,0.35); }
        .btn-success { background:linear-gradient(135deg, var(--clr-success), #059669); box-shadow:0 4px 14px rgba(16,185,129,0.35); }
        .btn-secondary { background:#f1f5f9; color:var(--clr-text); }
        .hint { text-align:center; font-size:0.85rem; color:var(--clr-text-secondary); margin-bottom:8px; line-height:1.7; }
        .hint a { color:var(--clr-primary); text-decoration:none; font-weight:600; }
        .divider { height:1px; background:var(--clr-border); margin:20px 0; }
        #results { margin-top:20px; }
        #results .loading { text-align:center; padding:40px 20px; color:var(--clr-text-secondary); }
        .spinner { display:inline-block; width:36px; height:36px; border:3px solid var(--clr-border); border-top-color:var(--clr-primary); border-radius:50%; animation:spin 0.8s linear infinite; margin-bottom:12px; }
        @keyframes spin { to { transform:rotate(360deg); } }
        #results .stats-bar { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; background:#f8fafc; border-radius:var(--rad-sm); margin-bottom:16px; font-size:0.85rem; color:var(--clr-text-secondary); }
        #results .stats-bar strong { color:var(--clr-primary); font-size:1.1rem; }
        #results ul { list-style:none; display:grid; gap:10px; }
        #results li {
            display:flex; align-items:center; gap:12px; background:#f8fafc; border-radius:var(--rad-sm);
            padding:14px 16px; border:2px solid transparent; border-left:4px solid var(--clr-primary);
            cursor:pointer; transition:var(--tran); position:relative;
        }
        #results li:hover { border-color:var(--clr-primary); background:#eef2ff; transform:translateX(4px); box-shadow:var(--shadow-md); }
        #results li .node-name { font-weight:700; font-size:0.95rem; color:var(--clr-text); white-space:nowrap; min-width:60px; }
        #results li .node-link { flex:1; font-family:monospace; font-size:0.78rem; color:var(--clr-text-secondary); word-break:break-all; line-height:1.5; }
        #results li .copy-badge { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:var(--clr-success); color:#fff; padding:3px 10px; border-radius:12px; font-size:0.72rem; font-weight:600; opacity:0; transition:opacity 0.25s; pointer-events:none; }
        #results li .copy-badge.show { opacity:1; }
        .toast { position:fixed; top:24px; left:50%; transform:translateX(-50%) translateY(-120px); background:#1e293b; color:#fff; padding:12px 24px; border-radius:20px; font-size:0.9rem; font-weight:600; z-index:1000; transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1); }
        .toast.show { transform:translateX(-50%) translateY(0); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-left">
                <div class="logo-icon">&#x26A1;</div>
                <h1>手搓VLESS节点生成器与<span>订阅中心</span></h1>
            </div>
            <a href="/sub" target="_blank" class="btn btn-success" style="padding:8px 16px; font-size:0.85rem; flex:none; text-decoration:none;">获取 /sub 原始订阅</a>
        </div>

        <div class="form-section">
            <div class="form-row">
                <div class="form-group">
                    <label for="uuidInput">&#x1F511; UUID</label>
                    <input type="text" id="uuidInput" value="${我的VL密钥}">
                </div>
                <div class="form-group">
                    <label for="custom3Input">&#x1F504; 反代IP (KV同步)</label>
                    <input type="text" id="custom3Input" value="${当前反代IP}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="domainInput">&#x1F310; 部署域名</label>
                    <input type="text" id="domainInput" value="${部署域名}">
                </div>
                <div class="form-group">
                    <label for="presetIpSelect">&#x1F4CD; IP来源</label>
                    <select id="presetIpSelect">
                        <option value="https://raw.githubusercontent.com/gslege/CloudflareIP/refs/heads/main/Me.txt">&#x1F3E2; 运营商IP</option>
                        <option value="https://raw.githubusercontent.com/gslege/CloudflareIP/refs/heads/main/SG.txt">&#x1F1F8;&#x1F1EC; 新加坡IP</option>
                        <option value="https://raw.githubusercontent.com/gslege/CloudflareIP/refs/heads/main/JP.txt">&#x1F1EF;&#x1F1F5; 日本IP</option>
                        <option value="https://raw.githubusercontent.com/gslege/CloudflareIP/refs/heads/main/US.txt">&#x1F1FA;&#x1F1F8; 美国IP</option>
                        <option value="https://raw.githubusercontent.com/gslege/CloudflareIP/refs/heads/main/DE.txt">&#x1F1E9;&#x1F1EA; 德国IP</option>
                        <option value="https://raw.githubusercontent.com/gslege/CloudflareIP/refs/heads/main/NL.txt">&#x1F1F3;&#x1F1F1; 荷兰IP</option>
                        <option value="https://raw.githubusercontent.com/gslege/CloudflareIP/refs/heads/main/Cdtools.txt">&#x2B50; 优选IP</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="btn-group">
            <button id="generateBtn" class="btn btn-primary">&#x26A1; 一键生成节点</button>
            <button id="copyAllBtn" class="btn btn-secondary">&#x1F4CB; 一键复制全部</button>
        </div>

        <p class="hint">&#x1F4A1; 输入自己的 <strong>UUID</strong> 和 <strong>部署域名</strong>，或使用默认值，再选择预设IP来源后生成节点</p>
        <p class="hint">&#x1F527; <a href="/edit" target="_blank">点击此处进入 KV 空间后台配置反代 IP (/edit)</a></p>

        <div class="divider"></div>
        <div id="results"></div>
    </div>

    <div id="toast" class="toast"></div>

    <script>
    (function() {
        var uuidInput, custom3Input, domainInput, presetIpSelect, generateBtn, copyAllBtn, resultsDiv, toast, toastTimer;

        function init() {
            uuidInput = document.getElementById('uuidInput');
            custom3Input = document.getElementById('custom3Input');
            domainInput = document.getElementById('domainInput');
            presetIpSelect = document.getElementById('presetIpSelect');
            generateBtn = document.getElementById('generateBtn');
            copyAllBtn = document.getElementById('copyAllBtn');
            resultsDiv = document.getElementById('results');
            toast = document.getElementById('toast');

            generateBtn.addEventListener('click', onGenerate);
            copyAllBtn.addEventListener('click', onCopyAll);

            [uuidInput, custom3Input, domainInput].forEach(function(el) {
                el.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') { e.preventDefault(); generateBtn.click(); }
                });
            });

            generateLinks(uuidInput.value, domainInput.value, presetIpSelect.value, custom3Input.value);
        }

        function showToast(message, type) {
            type = type || 'success';
            clearTimeout(toastTimer);
            toast.textContent = message;
            toast.className = 'toast ' + type;
            void toast.offsetWidth;
            toast.classList.add('show');
            toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 2000);
        }

        function copyToClipboard(text) {
            return new Promise(function(resolve) {
                try {
                    navigator.clipboard.writeText(text).then(function() { resolve(true); }, fallback);
                } catch (e) { fallback(); }
                function fallback() {
                    var ta = document.createElement('textarea');
                    ta.value = text;
                    ta.style.cssText = 'position:fixed;opacity:0;';
                    document.body.appendChild(ta);
                    ta.select();
                    try { document.execCommand('copy'); resolve(true); } catch (ex) { resolve(false); }
                    document.body.removeChild(ta);
                }
            });
        }

        function escapeHtml(str) {
            var div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        function generateLinks(uuid, domain, ipSource, custom3) {
            resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>正在获取IP列表并生成节点，请稍候…</p></div>';

            fetch(ipSource).then(function(res) {
                if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + res.statusText);
                return res.text();
            }).then(function(content) {
                var lines = content.split('\\n').filter(function(l) { return l.trim(); });
                if (!lines.length) {
                    resultsDiv.innerHTML = '<div class="error">&#x26A0;&#xFE0F; 未找到任何IP数据，请检查IP来源</div>';
                    return;
                }

                var ipRe = /^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$/;
                var tpl = 'vless://' + uuid + '@__IP__:443?encryption=none&security=tls&sni=' + domain +
                    '&fp=random&insecure=0&allowInsecure=0&type=ws&host=' + domain +
                    '&path=pyip%3D' + custom3 + '#__NAME__';
                var links = [];

                lines.forEach(function(line, idx) {
                    var parts = line.trim().split('#');
                    var ip = parts[0];
                    var name = parts[1] || '节点' + (idx + 1);
                    if (!ipRe.test(ip)) return;
                    links.push({
                        name: name,
                        link: tpl.replace('__IP__', ip).replace('__NAME__', name)
                    });
                });

                var html = '<div class="stats-bar"><span>&#x1F4CA; 共生成 <strong>' + links.length + '</strong> 个节点</span><span>&#x1F517; 点击任意节点即可复制</span></div><ul>';
                links.forEach(function(item) {
                    html += '<li data-link="' + escapeHtml(item.link) + '">';
                    html += '<span class="node-name">' + escapeHtml(item.name) + '</span>';
                    html += '<span class="node-link">' + escapeHtml(item.link) + '</span>';
                    html += '<span class="copy-badge">&#x2705; 已复制</span></li>';
                });
                html += '</ul>';
                resultsDiv.innerHTML = html;

                resultsDiv.querySelectorAll('li').forEach(function(li) {
                    li.addEventListener('click', function() {
                        var link = li.dataset.link;
                        var badge = li.querySelector('.copy-badge');
                        copyToClipboard(link).then(function(ok) {
                            if (ok) {
                                badge.classList.add('show');
                                li.style.backgroundColor = '#d1fae5';
                                setTimeout(function() {
                                    badge.classList.remove('show');
                                    li.style.backgroundColor = '';
                                }, 1200);
                            } else {
                                showToast('&#x274C; 复制失败，请手动复制', 'error');
                            }
                        });
                    });
                });
            }).catch(function(err) {
                resultsDiv.innerHTML = '<div class="error" style="color:#ef4444;text-align:center;padding:20px;">加载IP数据失败: ' + escapeHtml(err.message) + '</div>';
            });
        }

        function onGenerate() {
            generateLinks(
                uuidInput.value.trim(),
                domainInput.value.trim(),
                presetIpSelect.value,
                custom3Input.value.trim()
            );
        }

        function onCopyAll() {
            var els = resultsDiv.querySelectorAll('li[data-link]');
            if (!els.length) { showToast('&#x26A0;&#xFE0F; 请先生成节点', 'error'); return; }
            var text = Array.from(els).map(function(el) { return el.dataset.link; }).join('\\n');
            copyToClipboard(text).then(function(ok) {
                if (ok) {
                    showToast('&#x2705; 已复制全部 ' + els.length + ' 个节点');
                } else { showToast('&#x274C; 复制失败，请重试', 'error'); }
            });
        }

        init();
    })();
    </script>
</body>
</html>`;
      return new Response(html网页, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
  }
};

async function 启动传输管道(WS接口, TCP接口, 当前反代IP) {
  let 识别地址类型, 访问地址, 地址长度, 首包数据 = false, 首包处理完成 = null, 传输数据, 读取数据, 传输队列 = Promise.resolve();
  try {
    WS接口.addEventListener('message', async event => {
      if (!首包数据) {
        首包数据 = true;
        首包处理完成 = 解析首包数据(event.data);
        传输队列 = 传输队列.then(() => 首包处理完成).catch(e => { throw (e) });
      } else {
        await 首包处理完成;
        传输队列 = 传输队列.then(() => 传输数据.write(event.data)).catch(e => { throw (e) });
      }
    });
    async function 解析首包数据(首包数据) {
      const 二进制数据 = new Uint8Array(首包数据);
      const 协议头 = 二进制数据[0];
      const 验证VL的密钥 = (a, i = 0) => [...a.slice(i, i + 16)].map(b => b.toString(16).padStart(2, '0')).join('').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
      if (验证VL的密钥(二进制数据.slice(1, 17)) !== 我的VL密钥) throw new Error('UUID验证失败');
      const 提取端口索引 = 18 + 二进制数据[17] + 1;
      const 访问端口 = new DataView(二进制数据.buffer, 提取端口索引, 2).getUint16(0);
      const 提取地址索引 = 提取端口索引 + 2;
      识别地址类型 = 二进制数据[提取地址索引];
      let 地址信息索引 = 提取地址索引 + 1;
      switch (识别地址类型) {
        case 1:
          地址长度 = 4;
          访问地址 = 二进制数据.slice(地址信息索引, 地址信息索引 + 地址长度).join('.');
          break;
        case 2:
          地址长度 = 二进制数据[地址信息索引];
          地址信息索引 += 1;
          访问地址 = new TextDecoder().decode(二进制数据.slice(地址信息索引, 地址信息索引 + 地址长度));
          break;
        case 3:
          地址长度 = 16;
          const ipv6 = [];
          const 读取IPV6地址 = new DataView(二进制数据.buffer, 地址信息索引, 16);
          for (let i = 0; i < 8; i++) ipv6.push(读取IPV6地址.getUint16(i * 2).toString(16));
          访问地址 = ipv6.join(':');
          break;
        default:
          throw new Error('无效的访问地址');
      }
      try {
        if (识别地址类型 === 3) {
          const 转换IPV6地址 = `[${访问地址}]`;
          TCP接口 = connect({ hostname: 转换IPV6地址, port: 访问端口 });
        } else {
          TCP接口 = connect({ hostname: 访问地址, port: 访问端口 });
        }
        await TCP接口.opened;
      } catch {
        if (!当前反代IP) throw new Error('直连失败且未配置反代IP');
        const [反代IP地址, 反代IP端口 = 443] = 当前反代IP.split(':');
        TCP接口 = connect({ hostname: 反代IP地址, port: Number(反代IP端口) });
        await TCP接口.opened;
      }
      传输数据 = TCP接口.writable.getWriter();
      读取数据 = TCP接口.readable.getReader();
      const 写入初始数据 = 二进制数据.slice(地址信息索引 + 地址长度);
      if (写入初始数据.length > 0) try { await 传输数据.write(写入初始数据) } catch (e) { throw (e) };
      WS接口.send(new Uint8Array([协议头, 0]));
      启动回传管道();
    }
    async function 启动回传管道() {
      while (true) {
        await 传输队列;
        const { done: 流结束, value: 返回数据 } = await 读取数据.read();
        if (返回数据 && 返回数据.length > 0) {
          传输队列 = 传输队列.then(() => WS接口.send(返回数据)).catch(e => { throw (e) });
        }
        if (流结束) break;
      }
      throw new Error('传输完成');
    }
  } catch (e) {
    try { regularClose(TCP接口, WS接口); } catch {}
  }
}
