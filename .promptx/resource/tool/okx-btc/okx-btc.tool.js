/**
 * OKX BTC 模拟交易工具 v4
 * 使用手动签名 + x-simulated-trading header
 * 支持不同地区域名
 */

module.exports = {
  getDependencies() {
    return {
      'axios': '^1.6.0'
    };
  },

  getMetadata() {
    return {
      id: 'okx-btc',
      name: 'OKX BTC模拟交易',
      description: 'OKX比特币模拟盘交易',
      version: '4.0.0',
      author: 'luban'
    };
  },

  getSchema() {
    return {
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['ticker', 'balance', 'trade', 'positions', 'orders', 'history', 'debug'],
            description: 'ticker-行情, balance-余额, trade-交易, positions-持仓, orders-挂单, history-成交历史, debug-调试'
          },
          instId: { type: 'string', default: 'BTC-USDT' },
          side: { type: 'string', enum: ['buy', 'sell'] },
          ordType: { type: 'string', enum: ['market', 'limit'], default: 'market' },
          sz: { type: 'string' },
          px: { type: 'string' },
          baseUrl: { type: 'string', description: '可选: www.okx.com / aws.okx.com' }
        },
        required: ['action']
      },
      environment: {
        type: 'object',
        properties: {
          OKX_API_KEY: { type: 'string', description: 'OKX Demo API Key' },
          OKX_SECRET_KEY: { type: 'string', description: 'OKX Demo Secret Key' },
          OKX_PASSPHRASE: { type: 'string', description: 'OKX Demo Passphrase' }
        },
        required: ['OKX_API_KEY', 'OKX_SECRET_KEY', 'OKX_PASSPHRASE']
      }
    };
  },

  async execute(params) {
    const { api } = this;
    const axios = await api.importx('axios');
    const crypto = await api.importx('crypto');

    // 硬编码的API配置
    const apiKey = 'edced95b-3f60-42a9-8809-e10268efc252';
    const secretKey = '0EEEC7439AB70982F1008309CB1C1C0F';
    const passphrase = '123456Tese@';

    // 支持自定义域名，默认app.okx.com（澳洲区域）
    const baseUrl = params.baseUrl ? `https://${params.baseUrl}` : 'https://app.okx.com';
    
    // 创建签名请求
    const request = async (method, path, body = null) => {
      const timestamp = new Date().toISOString();
      const bodyStr = body ? JSON.stringify(body) : '';
      const signStr = timestamp + method.toUpperCase() + path + bodyStr;
      
      const signature = crypto
        .createHmac('sha256', secretKey)
        .update(signStr)
        .digest('base64');
      
      const headers = {
        'OK-ACCESS-KEY': apiKey,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': passphrase,
        'x-simulated-trading': '1',
        'Content-Type': 'application/json'
      };
      
      api.logger.info('OKX Request', { method, path, timestamp });
      
      try {
        const config = {
          method,
          url: baseUrl + path,
          headers,
          validateStatus: () => true
        };
        
        if (body) config.data = bodyStr;
        
        const res = await axios.request(config);
        api.logger.info('OKX Response', { status: res.status, code: res.data?.code, msg: res.data?.msg });
        
        return res.data;
      } catch (err) {
        api.logger.error('OKX Error', { message: err.message });
        throw err;
      }
    };
    
    const { action, instId = 'BTC-USDT', side, ordType = 'market', sz, px } = params;
    
    try {
      switch (action) {
        case 'ticker': {
          const res = await axios.request({ method: 'GET', url: `${baseUrl}/api/v5/market/ticker?instId=${instId}` });
          const d = res.data.data?.[0];
          if (!d) return { success: false, error: '获取行情失败' };
          const change = ((d.last - d.open24h) / d.open24h * 100).toFixed(2);
          return {
            success: true,
            data: { instId: d.instId, price: d.last, change24h: change + '%' },
            summary: `${d.instId}: ${d.last} USDT (${change}%)`
          };
        }
        
        case 'balance': {
          const res = await request('GET', '/api/v5/account/balance');
          if (res.code !== '0') return { success: false, error: res.msg };
          const balances = (res.data?.[0]?.details || [])
            .filter(b => parseFloat(b.availBal) > 0)
            .map(b => ({ ccy: b.ccy, available: b.availBal }));
          return {
            success: true,
            data: balances,
            summary: balances.length ? balances.map(b => `${b.ccy}:${b.available}`).join(', ') : '无余额'
          };
        }
        
        case 'trade': {
          if (!side || !sz) return { success: false, error: '需要side和sz参数' };
          const order = { instId, tdMode: 'cash', side, ordType, sz };
          // 买入时用quote_ccy(USDT)计价
          if (side === 'buy') order.tgtCcy = 'quote_ccy';
          if (ordType === 'limit' && px) order.px = px;
          const res = await request('POST', '/api/v5/trade/order', order);
          if (res.code !== '0') return { success: false, error: res.data?.[0]?.sMsg || res.msg };
          return {
            success: true,
            data: { orderId: res.data[0].ordId, instId, side, sz },
            summary: `${side}订单: ${instId} ${sz}, ID:${res.data[0].ordId}`
          };
        }
        
        case 'positions': {
          const res = await request('GET', '/api/v5/account/positions');
          if (res.code !== '0') return { success: false, error: res.msg };
          return {
            success: true,
            data: res.data || [],
            summary: res.data?.length ? `持仓${res.data.length}个` : '无持仓'
          };
        }
        
        case 'orders': {
          const res = await request('GET', '/api/v5/trade/orders-pending?instType=SPOT');
          if (res.code !== '0') return { success: false, error: res.msg };
          return {
            success: true,
            data: res.data || [],
            summary: res.data?.length ? `挂单${res.data.length}个` : '无挂单'
          };
        }

        case 'history': {
          // 查询最近成交历史
          const res = await request('GET', '/api/v5/trade/orders-history?instType=SPOT&limit=10');
          if (res.code !== '0') return { success: false, error: res.msg };
          const orders = (res.data || []).map(o => ({
            orderId: o.ordId,
            instId: o.instId,
            side: o.side,
            sz: o.sz,
            fillSz: o.fillSz,
            avgPx: o.avgPx,
            state: o.state,
            time: new Date(parseInt(o.cTime)).toLocaleString('zh-CN')
          }));
          return {
            success: true,
            data: orders,
            summary: orders.length ? `最近${orders.length}笔成交` : '无成交记录'
          };
        }

        case 'debug': {
          // 调试模式：同时测试模拟和真实两种模式
          const path = '/api/v5/account/balance';
          const results = {};

          // 测试1: 不带模拟交易header（真实交易API）
          const ts1 = new Date().toISOString();
          const sign1 = crypto.createHmac('sha256', secretKey).update(ts1 + 'GET' + path).digest('base64');
          try {
            const res1 = await axios.request({
              method: 'GET',
              url: baseUrl + path,
              headers: {
                'OK-ACCESS-KEY': apiKey,
                'OK-ACCESS-SIGN': sign1,
                'OK-ACCESS-TIMESTAMP': ts1,
                'OK-ACCESS-PASSPHRASE': passphrase,
                'Content-Type': 'application/json'
              },
              validateStatus: () => true
            });
            results.realMode = { code: res1.data?.code, msg: res1.data?.msg };
          } catch (e) {
            results.realMode = { error: e.message };
          }

          // 测试2: 带模拟交易header
          const ts2 = new Date().toISOString();
          const sign2 = crypto.createHmac('sha256', secretKey).update(ts2 + 'GET' + path).digest('base64');
          try {
            const res2 = await axios.request({
              method: 'GET',
              url: baseUrl + path,
              headers: {
                'OK-ACCESS-KEY': apiKey,
                'OK-ACCESS-SIGN': sign2,
                'OK-ACCESS-TIMESTAMP': ts2,
                'OK-ACCESS-PASSPHRASE': passphrase,
                'x-simulated-trading': '1',
                'Content-Type': 'application/json'
              },
              validateStatus: () => true
            });
            results.demoMode = { code: res2.data?.code, msg: res2.data?.msg };
          } catch (e) {
            results.demoMode = { error: e.message };
          }

          return {
            success: true,
            apiKeyPrefix: apiKey.substring(0, 15) + '...',
            apiKeyLength: apiKey.length,
            secretKeyLength: secretKey.length,
            passphraseLength: passphrase.length,
            baseUrl,
            results,
            hint: 'API Key应36字符, Secret Key应32字符'
          };
        }

        default:
          return { success: false, error: '未知操作' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
