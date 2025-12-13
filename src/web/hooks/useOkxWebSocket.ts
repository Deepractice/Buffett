/**
 * OKX 行情数据 Hook
 * 使用 REST API 轮询获取实时价格，模拟 K 线数据
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TickerData {
  instId: string;
  last: number;
  lastSz: number;
  open24h: number;
  high24h: number;
  low24h: number;
  vol24h: number;
  volCcy24h: number;
  sodUtc0: number;
  sodUtc8: number;
  ts: number;
}

interface UseOkxWebSocketOptions {
  instId?: string;
  channel?: 'candle1m' | 'candle5m' | 'candle15m' | 'candle1H';
}

// 生成模拟K线数据
function generateMockCandles(basePrice: number, count: number = 50): CandleData[] {
  const candles: CandleData[] = [];
  const now = Math.floor(Date.now() / 1000);
  let price = basePrice;

  for (let i = count; i > 0; i--) {
    const time = now - i * 60; // 1分钟间隔
    const volatility = price * 0.002; // 0.2% 波动
    const change = (Math.random() - 0.5) * volatility * 2;

    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;

    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume: Math.random() * 100 + 10,
    });

    price = close;
  }

  return candles;
}

export function useOkxWebSocket(options: UseOkxWebSocketOptions = {}) {
  const { instId = 'BTC-USDT' } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastPrice, setLastPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();
  const basePriceRef = useRef<number>(0);

  // 获取实时价格
  const fetchTicker = useCallback(async () => {
    try {
      const response = await fetch(
        `https://www.okx.com/api/v5/market/ticker?instId=${instId}`
      );
      const data = await response.json();

      if (data.code === '0' && data.data?.[0]) {
        const ticker = data.data[0];
        const last = parseFloat(ticker.last);
        const open24h = parseFloat(ticker.open24h);
        const change = ((last - open24h) / open24h) * 100;

        setLastPrice(last);
        setPriceChange(change);
        setIsConnected(true);

        // 初始化或更新 K 线数据
        if (basePriceRef.current === 0) {
          basePriceRef.current = last;
          setCandles(generateMockCandles(last, 50));
        } else {
          // 更新最后一根 K 线
          setCandles(prev => {
            if (prev.length === 0) return generateMockCandles(last, 50);

            const newCandles = [...prev];
            const lastCandle = { ...newCandles[newCandles.length - 1] };
            const now = Math.floor(Date.now() / 1000);
            const currentMinute = Math.floor(now / 60) * 60;

            if (lastCandle.time === currentMinute) {
              // 更新当前 K 线
              lastCandle.close = last;
              lastCandle.high = Math.max(lastCandle.high, last);
              lastCandle.low = Math.min(lastCandle.low, last);
              newCandles[newCandles.length - 1] = lastCandle;
            } else {
              // 新增 K 线
              newCandles.push({
                time: currentMinute,
                open: lastCandle.close,
                high: Math.max(lastCandle.close, last),
                low: Math.min(lastCandle.close, last),
                close: last,
                volume: Math.random() * 50 + 10,
              });
              // 保持最多 100 根 K 线
              if (newCandles.length > 100) {
                newCandles.shift();
              }
            }
            return newCandles;
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch ticker:', error);
      setIsConnected(false);

      // 使用模拟数据
      if (candles.length === 0) {
        const mockPrice = 100000;
        setLastPrice(mockPrice);
        setPriceChange(-2.26);
        setCandles(generateMockCandles(mockPrice, 50));
      }
    }
  }, [instId, candles.length]);

  useEffect(() => {
    // 立即获取一次
    fetchTicker();

    // 每 3 秒更新一次
    intervalRef.current = setInterval(fetchTicker, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchTicker]);

  return {
    isConnected,
    lastPrice,
    priceChange,
    candles,
  };
}
