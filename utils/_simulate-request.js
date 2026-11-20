require('../adapters');
const { globalTracker } = require('../core/tracker');

(async () => {
  console.log('=== 请求参数 ===');
  console.log('POST http://localhost:3000/api/v1/track');
  console.log('Content-Type: application/json');
  console.log('');
  console.log('{');
  console.log('  "query":     "074-39882393",');
  console.log('  "queryType": "awb",');
  console.log('  "carrier":   "AF KLM Cargo",');
  console.log('  "headless":  false');
  console.log('}');
  console.log('');

  console.log('=== 等同 curl ===');
  console.log('curl -X POST http://localhost:3000/api/v1/track \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log("  -d '{\"query\":\"074-39882393\",\"queryType\":\"awb\",\"carrier\":\"AF KLM Cargo\",\"headless\":false}'");
  console.log('');

  console.log('=== 开始执行 (headed 浏览器)... ===');
  const r = await globalTracker.track(
    '074-39882393',
    { queryType: 'awb', carrier: 'AF KLM Cargo' },
    { headless: false }
  );

  console.log('');
  console.log('=== 返回结果 ===');
  console.log(JSON.stringify({
    success: r.success,
    carrier: r.carrier,
    queryType: r.queryType,
    query: r.query,
    hasResult: r.hasResult,
    url: r.url,
    error: r.error,
    data: r.data,
  }, null, 2));
})().catch(e => console.log('FATAL:', e.message));
