/**
 * 交易面板组件
 * 简洁版：K线图 + 收益展示
 */

import { useState } from 'react';
import { CandlestickChart } from './CandlestickChart';
import { useOkxWebSocket } from '../hooks/useOkxWebSocket';

interface Trade {
  id: string;
  time: number;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
}

// 模拟交易记录
const mockTrades: Trade[] = [
  { id: '1', time: Date.now() - 300000, side: 'buy', price: 99800, amount: 0.05 },
  { id: '2', time: Date.now() - 120000, side: 'sell', price: 100200, amount: 0.03 },
];

export function TradingPanel() {
  const { isConnected, lastPrice, priceChange, candles } = useOkxWebSocket({
    instId: 'BTC-USDT',
  });

  const [trades] = useState<Trade[]>(mockTrades);

  // 计算收益
  const initialCapital = 10000;
  const currentHolding = 0.02; // BTC
  const avgBuyPrice = 99800;
  const unrealizedPnL = currentHolding * (lastPrice - avgBuyPrice);
  const realizedPnL = 12.00; // 已实现收益
  const totalPnL = unrealizedPnL + realizedPnL;
  const pnlPercent = (totalPnL / initialCapital) * 100;

  const formatPrice = (price: number) =>
    price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatPnL = (value: number) =>
    `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;

  return (
    <div className="h-full flex flex-col bg-[#111] text-white">
      {/* 价格头部 */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-[#333]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f7931a] flex items-center justify-center text-lg font-bold text-black">
              ₿
            </div>
            <div>
              <div className="text-xl font-bold text-white">BTC-USDT</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00b076]' : 'bg-[#f6465d]'}`} />
                <span className="text-xs text-[#888]">
                  {isConnected ? 'OKX 实时行情' : '连接中...'}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">
              ${lastPrice > 0 ? formatPrice(lastPrice) : '--'}
            </div>
            <div className={`text-lg font-medium ${priceChange >= 0 ? 'text-[#00b076]' : 'text-[#f6465d]'}`}>
              {priceChange >= 0 ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* K线图 - 占据主要空间 */}
      <div className="flex-1 min-h-0">
        <CandlestickChart candles={candles} height={400} />
      </div>

      {/* 收益面板 */}
      <div className="flex-shrink-0 border-t border-[#333]">
        {/* 总收益 */}
        <div className="px-5 py-4 border-b border-[#333]">
          <div className="flex items-center justify-between">
            <span className="text-[#aaa]">今日收益</span>
            <div className="text-right">
              <span className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-[#00b076]' : 'text-[#f6465d]'}`}>
                {formatPnL(totalPnL)} USDT
              </span>
              <span className={`ml-2 text-sm ${pnlPercent >= 0 ? 'text-[#00b076]' : 'text-[#f6465d]'}`}>
                ({formatPnL(pnlPercent)}%)
              </span>
            </div>
          </div>
        </div>

        {/* 持仓信息 */}
        <div className="px-5 py-3 flex items-center justify-between text-sm">
          <div className="flex gap-6">
            <div>
              <span className="text-[#888]">持仓</span>
              <span className="ml-2 text-white font-medium">{currentHolding} BTC</span>
            </div>
            <div>
              <span className="text-[#888]">成本</span>
              <span className="ml-2 text-white font-medium">${formatPrice(avgBuyPrice)}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <div>
              <span className="text-[#888]">已实现</span>
              <span className={`ml-2 font-medium ${realizedPnL >= 0 ? 'text-[#00b076]' : 'text-[#f6465d]'}`}>
                {formatPnL(realizedPnL)}
              </span>
            </div>
            <div>
              <span className="text-[#888]">未实现</span>
              <span className={`ml-2 font-medium ${unrealizedPnL >= 0 ? 'text-[#00b076]' : 'text-[#f6465d]'}`}>
                {formatPnL(unrealizedPnL)}
              </span>
            </div>
          </div>
        </div>

        {/* 最近交易 */}
        <div className="px-5 py-3 border-t border-[#333]">
          <div className="text-xs text-[#888] mb-2">最近操作</div>
          <div className="flex gap-3">
            {trades.slice(0, 3).map((trade) => (
              <div
                key={trade.id}
                className={`px-3 py-1.5 rounded text-xs ${
                  trade.side === 'buy'
                    ? 'bg-[#00b076]/20 text-[#00b076] border border-[#00b076]/50'
                    : 'bg-[#f6465d]/20 text-[#f6465d] border border-[#f6465d]/50'
                }`}
              >
                {trade.side === 'buy' ? '买入' : '卖出'} {trade.amount} BTC @ ${formatPrice(trade.price)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
