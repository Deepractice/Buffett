/**
 * OKX 技术分析工具
 * 
 * 战略意义：
 * 1. 提供 K 线数据获取能力
 * 2. 计算技术指标（MA/RSI/MACD）
 * 3. 生成买卖信号建议
 * 
 * 设计理念：
 * 纯 JavaScript 实现所有计算，无需额外依赖
 * 基于 OKX 公开 API，无需认证
 */

module.exports = {
  getDependencies() {
    return {
      'axios': '^1.6.0'
    };
  },

  getMetadata() {
    return {
      id: 'okx-analysis',
      name: 'OKX 技术分析',
      description: '获取K线数据并计算技术指标(MA/RSI/MACD)，生成交易信号',
      version: '1.0.0',
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
            enum: ['kline', 'ma', 'rsi', 'macd', 'signal'],
            description: 'kline-K线数据, ma-均线, rsi-相对强弱, macd-MACD指标, signal-综合信号'
          },
          instId: { 
            type: 'string', 
            default: 'BTC-USDT',
            description: '交易对，如 BTC-USDT, ETH-USDT'
          },
          bar: { 
            type: 'string', 
            default: '1H',
            description: 'K线周期: 1m/5m/15m/30m/1H/4H/1D'
          },
          limit: { 
            type: 'number', 
            default: 100,
            description: '获取K线数量，最大300'
          }
        },
        required: ['action']
      }
    };
  },

  async execute(params) {
    const { api } = this;
    const axios = await api.importx('axios');
    
    const { action, instId = 'BTC-USDT', bar = '1H', limit = 100 } = params;
    const baseUrl = 'https://app.okx.com';
    
    api.logger.info('OKX Analysis', { action, instId, bar, limit });
    
    try {
      // 获取 K 线数据
      const getKlines = async () => {
        const url = `${baseUrl}/api/v5/market/candles?instId=${instId}&bar=${bar}&limit=${limit}`;
        const res = await axios.get(url);
        if (res.data.code !== '0') {
          throw new Error(res.data.msg || '获取K线失败');
        }
        // 返回格式: [ts, open, high, low, close, vol, volCcy, volCcyQuote, confirm]
        return res.data.data.map(k => ({
          time: new Date(parseInt(k[0])).toLocaleString('zh-CN'),
          ts: parseInt(k[0]),
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          vol: parseFloat(k[5])
        })).reverse(); // 按时间正序
      };
      
      // 计算简单移动平均线
      const calcMA = (closes, period) => {
        const result = [];
        for (let i = 0; i < closes.length; i++) {
          if (i < period - 1) {
            result.push(null);
          } else {
            const sum = closes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(parseFloat((sum / period).toFixed(2)));
          }
        }
        return result;
      };
      
      // 计算 RSI
      const calcRSI = (closes, period = 14) => {
        const result = [];
        let gains = 0, losses = 0;
        
        for (let i = 0; i < closes.length; i++) {
          if (i === 0) {
            result.push(null);
            continue;
          }
          
          const change = closes[i] - closes[i - 1];
          const gain = change > 0 ? change : 0;
          const loss = change < 0 ? -change : 0;
          
          if (i < period) {
            gains += gain;
            losses += loss;
            result.push(null);
          } else if (i === period) {
            gains += gain;
            losses += loss;
            const avgGain = gains / period;
            const avgLoss = losses / period;
            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            result.push(parseFloat((100 - 100 / (1 + rs)).toFixed(2)));
          } else {
            const avgGain = (result[i - 1] !== null ? gains / period : 0);
            const avgLoss = (result[i - 1] !== null ? losses / period : 0);
            const smoothGain = (avgGain * (period - 1) + gain) / period;
            const smoothLoss = (avgLoss * (period - 1) + loss) / period;
            const rs = smoothLoss === 0 ? 100 : smoothGain / smoothLoss;
            result.push(parseFloat((100 - 100 / (1 + rs)).toFixed(2)));
          }
        }
        return result;
      };
      
      // 计算 EMA
      const calcEMA = (data, period) => {
        const k = 2 / (period + 1);
        const result = [];
        for (let i = 0; i < data.length; i++) {
          if (i === 0) {
            result.push(data[i]);
          } else {
            result.push(data[i] * k + result[i - 1] * (1 - k));
          }
        }
        return result;
      };
      
      // 计算 MACD
      const calcMACD = (closes) => {
        const ema12 = calcEMA(closes, 12);
        const ema26 = calcEMA(closes, 26);
        const dif = ema12.map((v, i) => parseFloat((v - ema26[i]).toFixed(2)));
        const dea = calcEMA(dif, 9).map(v => parseFloat(v.toFixed(2)));
        const macd = dif.map((v, i) => parseFloat(((v - dea[i]) * 2).toFixed(2)));
        return { dif, dea, macd };
      };
      
      switch (action) {
        case 'kline': {
          const klines = await getKlines();
          const latest = klines[klines.length - 1];
          return {
            success: true,
            data: {
              instId,
              bar,
              count: klines.length,
              latest: {
                time: latest.time,
                open: latest.open,
                high: latest.high,
                low: latest.low,
                close: latest.close,
                vol: latest.vol
              },
              klines: klines.slice(-10) // 只返回最近10根
            },
            summary: `${instId} ${bar} K线: 最新价 ${latest.close}, 共${klines.length}根`
          };
        }
        
        case 'ma': {
          const klines = await getKlines();
          const closes = klines.map(k => k.close);
          const ma5 = calcMA(closes, 5);
          const ma10 = calcMA(closes, 10);
          const ma20 = calcMA(closes, 20);
          
          const latest = klines.length - 1;
          const currentPrice = closes[latest];
          const currentMA5 = ma5[latest];
          const currentMA10 = ma10[latest];
          const currentMA20 = ma20[latest];
          
          // 判断趋势
          let trend = '震荡';
          if (currentPrice > currentMA5 && currentMA5 > currentMA10 && currentMA10 > currentMA20) {
            trend = '多头排列 📈';
          } else if (currentPrice < currentMA5 && currentMA5 < currentMA10 && currentMA10 < currentMA20) {
            trend = '空头排列 📉';
          }
          
          return {
            success: true,
            data: {
              instId,
              price: currentPrice,
              ma5: currentMA5,
              ma10: currentMA10,
              ma20: currentMA20,
              trend
            },
            summary: `${instId}: 价格${currentPrice}, MA5=${currentMA5}, MA10=${currentMA10}, MA20=${currentMA20}, ${trend}`
          };
        }
        
        case 'rsi': {
          const klines = await getKlines();
          const closes = klines.map(k => k.close);
          const rsi = calcRSI(closes, 14);
          const currentRSI = rsi[rsi.length - 1];
          
          let signal = '中性';
          if (currentRSI > 70) signal = '超买 ⚠️ 可能回调';
          else if (currentRSI < 30) signal = '超卖 💡 可能反弹';
          else if (currentRSI > 50) signal = '偏强';
          else signal = '偏弱';
          
          return {
            success: true,
            data: {
              instId,
              rsi: currentRSI,
              signal
            },
            summary: `${instId} RSI(14): ${currentRSI}, ${signal}`
          };
        }
        
        case 'macd': {
          const klines = await getKlines();
          const closes = klines.map(k => k.close);
          const { dif, dea, macd } = calcMACD(closes);
          
          const latest = closes.length - 1;
          const currentDIF = dif[latest];
          const currentDEA = dea[latest];
          const currentMACD = macd[latest];
          const prevMACD = macd[latest - 1];
          
          let signal = '观望';
          if (currentDIF > currentDEA && dif[latest - 1] <= dea[latest - 1]) {
            signal = '金叉 📈 买入信号';
          } else if (currentDIF < currentDEA && dif[latest - 1] >= dea[latest - 1]) {
            signal = '死叉 📉 卖出信号';
          } else if (currentMACD > 0 && currentMACD > prevMACD) {
            signal = '多头增强';
          } else if (currentMACD < 0 && currentMACD < prevMACD) {
            signal = '空头增强';
          }
          
          return {
            success: true,
            data: {
              instId,
              dif: currentDIF,
              dea: currentDEA,
              macd: currentMACD,
              signal
            },
            summary: `${instId} MACD: DIF=${currentDIF}, DEA=${currentDEA}, MACD=${currentMACD}, ${signal}`
          };
        }
        
        case 'signal': {
          const klines = await getKlines();
          const closes = klines.map(k => k.close);
          const currentPrice = closes[closes.length - 1];
          
          // 计算所有指标
          const ma5 = calcMA(closes, 5);
          const ma10 = calcMA(closes, 10);
          const ma20 = calcMA(closes, 20);
          const rsi = calcRSI(closes, 14);
          const { dif, dea, macd } = calcMACD(closes);
          
          const latest = closes.length - 1;
          
          // 评分系统
          let score = 0;
          const reasons = [];
          
          // MA 趋势评分
          if (currentPrice > ma5[latest]) { score += 1; reasons.push('价格>MA5'); }
          if (currentPrice > ma10[latest]) { score += 1; reasons.push('价格>MA10'); }
          if (currentPrice > ma20[latest]) { score += 1; reasons.push('价格>MA20'); }
          if (ma5[latest] > ma10[latest]) { score += 1; reasons.push('MA5>MA10'); }
          
          // RSI 评分
          const currentRSI = rsi[latest];
          if (currentRSI < 30) { score += 2; reasons.push('RSI超卖'); }
          else if (currentRSI > 70) { score -= 2; reasons.push('RSI超买'); }
          else if (currentRSI > 50) { score += 1; reasons.push('RSI偏强'); }
          
          // MACD 评分
          if (dif[latest] > dea[latest]) { score += 1; reasons.push('MACD金叉'); }
          if (macd[latest] > 0) { score += 1; reasons.push('MACD柱>0'); }
          if (macd[latest] > macd[latest - 1]) { score += 1; reasons.push('MACD增强'); }
          
          // 生成建议
          let recommendation = '';
          if (score >= 6) recommendation = '强烈看多 🚀 建议买入';
          else if (score >= 3) recommendation = '偏多 📈 可考虑买入';
          else if (score >= 0) recommendation = '中性 ➡️ 观望为主';
          else if (score >= -3) recommendation = '偏空 📉 谨慎持有';
          else recommendation = '强烈看空 ⚠️ 建议卖出';
          
          return {
            success: true,
            data: {
              instId,
              bar,
              price: currentPrice,
              score,
              maxScore: 10,
              indicators: {
                ma5: ma5[latest],
                ma10: ma10[latest],
                ma20: ma20[latest],
                rsi: currentRSI,
                macdDif: dif[latest],
                macdDea: dea[latest],
                macdHist: macd[latest]
              },
              reasons,
              recommendation
            },
            summary: `${instId} 综合评分: ${score}/10, ${recommendation}`
          };
        }
        
        default:
          return { success: false, error: '未知操作' };
      }
    } catch (error) {
      api.logger.error('OKX Analysis Error', error);
      return { success: false, error: error.message };
    }
  }
};
