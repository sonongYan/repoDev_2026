const express = require('express');
const {
  trackContainer,
  globalTracker,
  globalRegistry,
  QUERY_TYPES,
  CARRIERS,
} = require('./scraper');

const { defaultLogger } = require('./utils/logger');
const logger = defaultLogger.child('http');

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'patchright-tracker');
  const start = Date.now();
  logger.debug(`${req.method} ${req.url} start`);
  res.on('finish', () => {
    logger.info(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.post('/track', async (req, res) => {
  const { containerNumber } = req.body || {};
  if (!containerNumber) {
    return res.status(400).json({ success: false, error: 'containerNumber is required' });
  }
  try {
    const result = await trackContainer(containerNumber);
    res.json(result);
  } catch (e) {
    logger.error('/track error', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/v1/supported', (req, res) => {
  res.json({
    success: true,
    queryTypes: QUERY_TYPES,
    carriers: CARRIERS,
    supportedAdapters: globalRegistry.listSupported(),
  });
});

app.post('/api/v1/analyze', (req, res) => {
  const { query, queryType, carrier } = req.body || {};
  if (!query) {
    return res.status(400).json({ success: false, error: 'query is required' });
  }
  try {
    const analysis = globalTracker.analyze(query, { queryType, carrier });
    const adapter = analysis.carrier ? globalRegistry.resolve(analysis.carrier, analysis.queryType) : null;
    res.json({
      success: true,
      analysis,
      adapterFound: !!adapter,
      adapterSupported: adapter ? adapter.supports(analysis.queryType) : false,
      adapterKey: adapter ? `${adapter.carrier}::${analysis.queryType}` : null,
    });
  } catch (e) {
    logger.error('/api/v1/analyze error', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/v1/track', async (req, res) => {
  const { query, queryType, carrier, headless } = req.body || {};
  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'query is required (container number / BL / AWB / cargo code)',
    });
  }
  try {
    const result = await globalTracker.track(
      query,
      { queryType, carrier },
      { headless: headless !== undefined ? headless : false }
    );
    res.json(result);
  } catch (e) {
    logger.error('/api/v1/track error', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('========================================');
  console.log('  Patchright Tracker Service Started');
  console.log('========================================');
  console.log(`  HTTP   : http://localhost:${PORT}`);
  console.log('  Routes:');
  console.log('    GET    /health');
  console.log('    POST   /track              (legacy - container only)');
  console.log('    GET    /api/v1/supported   (list all adapters)');
  console.log('    POST   /api/v1/analyze     (analyze query without browser)');
  console.log('    POST   /api/v1/track       (unified new API)');
  console.log('');
  console.log('  Supported (carrier × queryType):');
  for (const a of globalRegistry.listSupported()) {
    console.log(`    - ${a.carrier} :: ${a.queryType}`);
  }
  console.log('========================================');
});
