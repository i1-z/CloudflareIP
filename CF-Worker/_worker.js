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
        const 编辑网页 = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>KV 配置管理</title><style>body{max-width:600px;margin:40px auto;font-family:sans-serif;padding:0 20px}input{width:100%;padding:10px;margin:10px 0;box-sizing:border-box}button{padding:10px 20px;background:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer}</style></head><body><h3>KV 空间 (try) - 反代 IP 设置</h3><p>在此处修改并持久化保存你的反代 IP：</p><input type="text" id="ip" value="${当前反代IP}"><br><button onclick="fetch(location.href,{method:'POST',body:document.getElementById('ip').value}).then(r=>r.text()).then(alert)">保存修改</button></body></html>`;
        return new Response(编辑网页, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }

      // 4. 标准 Base64 订阅接口：/sub 或带特定 UA / 参数
      if (请求路径 === '/sub' || 用户代理.includes('clash') || 用户代理.includes('sing-box') || 访问路径URL.searchParams.has('sub') || 访问路径URL.searchParams.has('b64')) {
        // 生成多线路优选节点文本并进行 Base64 编码
        const 节点列表 = [
          `vless://${我的VL密钥}@104.18.81.19:443?encryption=none&security=tls&sni=${部署域名}&fp=random&type=ws&host=${部署域名}&path=pyip%3D${当前反代IP}#【移动优选】节点1`,
          `vless://${我的VL密钥}@104.26.4.90:443?encryption=none&security=tls&sni=${部署域名}&fp=random&type=ws&host=${部署域名}&path=pyip%3D${当前反代IP}#【联通优选】节点2`,
          `vless://${我的VL密钥}@172.64.82.114:443?encryption=none&security=tls&sni=${部署域名}&fp=random&type=ws&host=${部署域名}&path=pyip%3D${当前反代IP}#【电信优选】节点3`,
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

      // 5. 默认访问根目录：返回带在线生成和订阅复制链接的可视化网页
      const html网页 = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>VLESS 节点生成器与订阅中心</title>
          <style>
              body { font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f4f7f6; padding: 20px; display: flex; justify-content: center; }
              .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); width: 100%; max-width: 550px; }
              h2 { margin-top: 0; color: #333; font-size: 22px; text-align: center; }
              .info { font-size: 13px; color: #666; background: #f9f9f9; padding: 10px; border-radius: 6px; margin-bottom: 20px; line-height: 1.5; border-left: 4px solid #007bff; }
              label { display: block; margin-bottom: 8px; font-weight: bold; color: #444; font-size: 14px; }
              input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; font-size: 14px; margin-bottom: 15px; }
              button { width: 100%; background: #007bff; color: white; border: none; padding: 12px; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: bold; margin-top: 5px; }
              button:hover { background: #0056b3; }
              .sub-btn { background: #28a745; margin-top: 10px; }
              .sub-btn:hover { background: #218838; }
              .result-box { margin-top: 20px; display: none; }
              textarea { width: 100%; height: 90px; padding: 10px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; font-family: monospace; font-size: 12px; background: #fafafa; resize: none; }
              .copy-btn { background: #17a2b8; margin-top: 8px; font-size: 14px; padding: 8px; }
              .edit-link { display: block; text-align: center; margin-top: 15px; font-size: 13px; color: #007bff; text-decoration: none; }
          </style>
      </head>
      <body>
          <div class="card">
              <h2>VLESS 订阅与节点生成器</h2>
              <div class="info">
                  <strong>当前系统配置：</strong><br>
                  域名：${部署域名}<br>
                  当前反代IP (KV同步)：${当前反代IP}
              </div>
              
              <label for="subInput">统一订阅链接 (/sub)</label>
              <input type="text" id="subInput" value="https://${部署域名}/sub" readonly>
              <button class="sub-btn" onclick="copySub()">📋 复制统一订阅链接</button>

              <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">

              <label for="ipInput">单节点自定义转换：输入优选 IP / 反代 IP</label>
              <input type="text" id="ipInput" value="${当前反代IP}">
              <button onclick="generateNode()">⚡ 生成单节点链接</button>
              
              <div class="result-box" id="resultBox">
                  <label>生成的 vless:// 链接</label>
                  <textarea id="resultUrl" readonly></textarea>
                  <button class="copy-btn" id="copyBtn" onclick="copyLink()">📋 复制节点链接</button>
              </div>

              <a href="/edit" class="edit-link" target="_blank">📝 进入 KV 空间持久化配置后台 (/edit)</a>
          </div>

          <script>
              function copySub() {
                  const input = document.getElementById('subInput');
                  navigator.clipboard.writeText(input.value);
                  alert('统一订阅链接已复制！可直接导入客户端');
              }

              function generateNode() {
                  const inputIp = document.getElementById('ipInput').value.trim();
                  if(!inputIp) { alert('请输入有效的IP后再试！'); return; }
                  
                  const uuid = "${我的VL密钥}";
                  const host = "${部署域名}";
                  
                  const vlessLink = "vless://" + uuid + "@" + inputIp + ":443?encryption=none&security=tls&sni=" + host + "&fp=random&type=ws&host=" + host + "&path=pyip%3D" + inputIp + "#" + inputIp;
                  
                  document.getElementById('resultUrl').value = vlessLink;
                  document.getElementById('resultBox').style.display = 'block';
              }

              function copyLink() {
                  const textarea = document.getElementById('resultUrl');
                  textarea.select();
                  document.execCommand('copy');
                  alert('单节点链接已复制！');
              }
          </script>
      </body>
      </html>
      `;
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
    try { await TCP接口?.close?.() } catch {};
    try { WS接口?.close?.() } catch {};
  }
}
