/**
 * 富途港股交易工具 - 为AI金融智能体提供港股交易能力
 *
 * 战略意义：
 * 1. 虚拟盘交易：支持模拟交易，无需真实资金即可演示完整交易流程
 * 2. 港股市场：覆盖香港证券市场，支持腾讯、阿里等热门港股
 * 3. 完整能力：行情查询、下单交易、持仓管理三位一体
 *
 * 设计理念：
 * 基于富途OpenAPI官方Python SDK (futu-api)
 * 通过TCP连接OpenD网关（端口11111）
 * 模拟盘交易与实盘完全隔离
 *
 * 依赖说明：
 * - 需要本地或云端运行OpenD网关（开启api_port 11111）
 * - 通过api.execute调用Python脚本与OpenD通信
 * - 环境变量 FUTU_HOST/FUTU_PORT 配置网关地址
 */

module.exports = {
  getDependencies() {
    return {};  // 不需要Node.js依赖，使用Python SDK
  },

  getMetadata() {
    return {
      id: 'futu-hk',
      name: '富途港股交易',
      description: '港股行情查询、模拟盘交易、持仓管理',
      version: '2.0.0',
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
            enum: ['quote', 'trade', 'position'],
            description: '操作类型: quote-行情查询, trade-下单交易, position-持仓查询'
          },
          code: {
            type: 'string',
            description: '股票代码，如 00700(腾讯), 09988(阿里)，不需要HK.前缀'
          },
          side: {
            type: 'string',
            enum: ['BUY', 'SELL'],
            description: '交易方向: BUY-买入, SELL-卖出'
          },
          qty: {
            type: 'number',
            minimum: 1,
            description: '交易数量（股数）'
          },
          price: {
            type: 'number',
            minimum: 0,
            description: '交易价格（港元）'
          }
        },
        required: ['action']
      },
      environment: {
        type: 'object',
        properties: {
          FUTU_HOST: {
            type: 'string',
            description: 'OpenD网关地址，默认127.0.0.1'
          },
          FUTU_PORT: {
            type: 'number',
            description: 'OpenD API端口，默认11111'
          },
          PYTHON_PATH: {
            type: 'string',
            description: 'Python解释器路径，默认python3'
          }
        }
      }
    };
  },

  getBridges() {
    return {
      'futu:quote': {
        real: async (args, api) => {
          api.logger.info('[Bridge] 获取行情数据', { codes: args.codes });

          const host = await api.environment.get('FUTU_HOST') || '127.0.0.1';
          const port = await api.environment.get('FUTU_PORT') || '11111';
          const pythonPath = await api.environment.get('PYTHON_PATH') || 'python3';

          // 构建股票代码列表
          const codeList = args.codes.map(c => {
            const clean = c.replace('HK.', '');
            return `HK.${clean}`;
          });

          const pythonScript = `
import json
import sys
import logging
# 禁用futu-api的日志输出
logging.getLogger('futu').setLevel(logging.CRITICAL)
from futu import OpenQuoteContext, SysConfig
# 禁用futu的日志
SysConfig.enable_proto_encrypt(False)

try:
    quote_ctx = OpenQuoteContext(host='${host}', port=${port})
    codes = ${JSON.stringify(codeList)}
    ret, data = quote_ctx.get_market_snapshot(codes)
    quote_ctx.close()

    if ret != 0:
        print(json.dumps({"error": str(data)}))
        sys.exit(1)

    results = []
    for _, row in data.iterrows():
        results.append({
            "code": row["code"],
            "name": row["name"],
            "last_price": float(row["last_price"]),
            "open_price": float(row["open_price"]),
            "high_price": float(row["high_price"]),
            "low_price": float(row["low_price"]),
            "prev_close_price": float(row["prev_close_price"]),
            "volume": int(row["volume"]),
            "turnover": float(row["turnover"]),
            "pe_ratio": float(row["pe_ttm_ratio"]) if row["pe_ttm_ratio"] else 0,
            "update_time": str(row["update_time"])
        })

    print(json.dumps({"data": results}))
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
`;

          const result = await api.execute(pythonPath, ['-c', pythonScript]);
          // 从输出中提取JSON（futu日志会混在stdout中）
          const jsonMatch = result.stdout.match(/\{"(?:data|error)".*\}/);
          if (!jsonMatch) {
            throw new Error('无法解析Python返回结果: ' + result.stdout.substring(0, 200));
          }
          const output = JSON.parse(jsonMatch[0]);

          if (output.error) {
            throw new Error(output.error);
          }

          return output.data;
        },
        mock: async (args, api) => {
          api.logger.debug('[Mock] 模拟行情数据', { codes: args.codes });
          return args.codes.map(code => {
            const cleanCode = code.replace('HK.', '');
            return {
              code: code.startsWith('HK.') ? code : `HK.${code}`,
              name: cleanCode === '00700' ? '腾讯控股' : (cleanCode === '09988' ? '阿里巴巴-SW' : '模拟股票'),
              last_price: cleanCode === '00700' ? 616.0 : 85.5,
              open_price: cleanCode === '00700' ? 608.0 : 84.0,
              high_price: cleanCode === '00700' ? 616.0 : 87.0,
              low_price: cleanCode === '00700' ? 601.5 : 83.5,
              prev_close_price: cleanCode === '00700' ? 605.0 : 84.5,
              volume: 15000000,
              turnover: 5700000000,
              pe_ratio: cleanCode === '00700' ? 18.5 : 12.3,
              update_time: new Date().toISOString()
            };
          });
        }
      },

      'futu:trade': {
        real: async (args, api) => {
          api.logger.info('[Bridge] 执行交易', args);

          const host = await api.environment.get('FUTU_HOST') || '127.0.0.1';
          const port = await api.environment.get('FUTU_PORT') || '11111';
          const pythonPath = await api.environment.get('PYTHON_PATH') || 'python3';

          const cleanCode = args.code.replace('HK.', '');
          const fullCode = `HK.${cleanCode}`;
          const trdSide = args.side === 'BUY' ? 'TrdSide.BUY' : 'TrdSide.SELL';

          const pythonScript = `
import json
import sys
import logging
logging.getLogger('futu').setLevel(logging.CRITICAL)
from futu import OpenSecTradeContext, TrdEnv, TrdSide, OrderType, TrdMarket, SysConfig
SysConfig.enable_proto_encrypt(False)

try:
    trd_ctx = OpenSecTradeContext(host='${host}', port=${port}, security_firm=None)

    # 使用模拟盘环境
    ret, data = trd_ctx.place_order(
        price=${args.price},
        qty=${args.qty},
        code='${fullCode}',
        trd_side=${trdSide},
        order_type=OrderType.NORMAL,
        trd_env=TrdEnv.SIMULATE
    )
    trd_ctx.close()

    if ret != 0:
        print(json.dumps({"error": str(data)}))
        sys.exit(1)

    row = data.iloc[0]
    result = {
        "order_id": str(row["order_id"]),
        "code": row["code"],
        "stock_name": row["stock_name"],
        "trd_side": "${args.side}",
        "order_type": "NORMAL",
        "order_status": row["order_status"],
        "qty": int(row["qty"]),
        "price": float(row["price"]),
        "create_time": str(row["create_time"]),
        "trd_env": "SIMULATE"
    }

    print(json.dumps({"data": result}))
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
`;

          const result = await api.execute(pythonPath, ['-c', pythonScript]);
          const jsonMatch = result.stdout.match(/\{"(?:data|error)".*\}/);
          if (!jsonMatch) {
            throw new Error('无法解析Python返回结果: ' + result.stdout.substring(0, 200));
          }
          const output = JSON.parse(jsonMatch[0]);

          if (output.error) {
            throw new Error(output.error);
          }

          return output.data;
        },
        mock: async (args, api) => {
          api.logger.debug('[Mock] 模拟交易', args);
          const cleanCode = args.code.replace('HK.', '');
          const orderId = `MOCK_${Date.now()}`;
          return {
            order_id: orderId,
            code: args.code.startsWith('HK.') ? args.code : `HK.${args.code}`,
            stock_name: cleanCode === '00700' ? '腾讯控股' : (cleanCode === '09988' ? '阿里巴巴-SW' : '模拟股票'),
            trd_side: args.side,
            order_type: 'NORMAL',
            order_status: 'SUBMITTED',
            qty: args.qty,
            price: args.price,
            create_time: new Date().toISOString(),
            trd_env: 'SIMULATE'
          };
        }
      },

      'futu:position': {
        real: async (args, api) => {
          api.logger.info('[Bridge] 查询持仓');

          const host = await api.environment.get('FUTU_HOST') || '127.0.0.1';
          const port = await api.environment.get('FUTU_PORT') || '11111';
          const pythonPath = await api.environment.get('PYTHON_PATH') || 'python3';

          const pythonScript = `
import json
import sys
import logging
logging.getLogger('futu').setLevel(logging.CRITICAL)
from futu import OpenSecTradeContext, TrdEnv, TrdMarket, SysConfig
SysConfig.enable_proto_encrypt(False)

try:
    trd_ctx = OpenSecTradeContext(host='${host}', port=${port}, security_firm=None)

    # 查询模拟盘持仓
    ret, data = trd_ctx.position_list_query(trd_env=TrdEnv.SIMULATE)
    trd_ctx.close()

    if ret != 0:
        print(json.dumps({"error": str(data)}))
        sys.exit(1)

    results = []
    if not data.empty:
        for _, row in data.iterrows():
            results.append({
                "code": row["code"],
                "stock_name": row["stock_name"],
                "qty": int(row["qty"]),
                "can_sell_qty": int(row["can_sell_qty"]),
                "cost_price": float(row["cost_price"]),
                "cost_price_valid": row["cost_price_valid"],
                "market_val": float(row["market_val"]),
                "nominal_price": float(row["nominal_price"]),
                "pl_ratio": float(row["pl_ratio"]) * 100,
                "pl_val": float(row["pl_val"]),
                "today_pl_val": float(row["today_pl_val"]) if "today_pl_val" in row else 0,
                "position_side": row["position_side"]
            })

    print(json.dumps({"data": results}))
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
`;

          const result = await api.execute(pythonPath, ['-c', pythonScript]);
          const jsonMatch = result.stdout.match(/\{"(?:data|error)".*\}/);
          if (!jsonMatch) {
            throw new Error('无法解析Python返回结果: ' + result.stdout.substring(0, 200));
          }
          const output = JSON.parse(jsonMatch[0]);

          if (output.error) {
            throw new Error(output.error);
          }

          return output.data;
        },
        mock: async (args, api) => {
          api.logger.debug('[Mock] 模拟持仓数据');
          return [
            {
              code: 'HK.00700',
              stock_name: '腾讯控股',
              qty: 100,
              can_sell_qty: 100,
              cost_price: 600.0,
              cost_price_valid: true,
              market_val: 61600.0,
              nominal_price: 616.0,
              pl_ratio: 2.67,
              pl_val: 1600.0,
              today_pl_val: 120.0,
              position_side: 'LONG'
            },
            {
              code: 'HK.09988',
              stock_name: '阿里巴巴-SW',
              qty: 200,
              can_sell_qty: 200,
              cost_price: 82.0,
              cost_price_valid: true,
              market_val: 17100.0,
              nominal_price: 85.5,
              pl_ratio: 4.27,
              pl_val: 700.0,
              today_pl_val: 50.0,
              position_side: 'LONG'
            }
          ];
        }
      }
    };
  },

  getBusinessErrors() {
    return [
      {
        code: 'OPEND_NOT_CONNECTED',
        description: 'OpenD网关未连接',
        match: /ECONNREFUSED|connection refused|连接超时|Connection refused/i,
        solution: '请确保OpenD网关已启动，端口11111正在监听',
        retryable: true
      },
      {
        code: 'INVALID_CODE',
        description: '无效的股票代码',
        match: /invalid.*code|stock.*not.*found|未知股票/i,
        solution: '请使用正确的港股代码格式，如 00700',
        retryable: false
      },
      {
        code: 'INSUFFICIENT_FUNDS',
        description: '资金不足',
        match: /insufficient.*funds|not.*enough|资金不足/i,
        solution: '模拟盘资金不足，请调整交易数量或价格',
        retryable: false
      },
      {
        code: 'MARKET_CLOSED',
        description: '市场已休市',
        match: /market.*closed|休市|非交易时间/i,
        solution: '港股交易时间为周一至周五 9:30-16:00',
        retryable: false
      }
    ];
  },

  async execute(params) {
    const { api } = this;
    const { action, code, side, qty, price } = params;

    api.logger.info('执行港股操作', { action, code, side, qty, price });

    try {
      switch (action) {
        case 'quote': {
          if (!code) {
            return { success: false, error: '行情查询需要提供股票代码(code)，如: 00700' };
          }
          const codes = code.split(',').map(c => c.trim());
          const quotes = await api.bridge.execute('futu:quote', { codes });

          return {
            success: true,
            action: 'quote',
            data: quotes,
            summary: quotes.map(q =>
              `${q.name}(${q.code}): 现价 ${q.last_price} 港元, 涨跌 ${((q.last_price - q.prev_close_price) / q.prev_close_price * 100).toFixed(2)}%`
            ).join('\n')
          };
        }

        case 'trade': {
          if (!code || !side || !qty || !price) {
            return {
              success: false,
              error: '交易需要提供: code(股票代码如00700), side(BUY/SELL), qty(数量), price(价格)'
            };
          }

          const order = await api.bridge.execute('futu:trade', { code, side, qty, price });

          return {
            success: true,
            action: 'trade',
            data: order,
            summary: `${side === 'BUY' ? '买入' : '卖出'}订单已提交\n` +
                     `股票: ${order.stock_name}(${order.code})\n` +
                     `数量: ${order.qty}股\n` +
                     `价格: ${order.price}港元\n` +
                     `订单号: ${order.order_id}\n` +
                     `环境: 模拟盘`
          };
        }

        case 'position': {
          const positions = await api.bridge.execute('futu:position', {});

          if (positions.length === 0) {
            return {
              success: true,
              action: 'position',
              data: [],
              summary: '当前模拟盘无持仓'
            };
          }

          const totalValue = positions.reduce((sum, p) => sum + p.market_val, 0);
          const totalPl = positions.reduce((sum, p) => sum + p.pl_val, 0);

          return {
            success: true,
            action: 'position',
            data: positions,
            summary: `持仓概览（模拟盘）\n` +
                     `总市值: ${totalValue.toFixed(2)} 港元\n` +
                     `总盈亏: ${totalPl >= 0 ? '+' : ''}${totalPl.toFixed(2)} 港元\n` +
                     `---\n` +
                     positions.map(p =>
                       `${p.stock_name}(${p.code}): ${p.qty}股, 盈亏 ${p.pl_ratio >= 0 ? '+' : ''}${p.pl_ratio.toFixed(2)}%`
                     ).join('\n')
          };
        }

        default:
          return { success: false, error: `未知操作: ${action}` };
      }
    } catch (error) {
      api.logger.error('操作失败', error);
      return { success: false, error: error.message };
    }
  }
};
