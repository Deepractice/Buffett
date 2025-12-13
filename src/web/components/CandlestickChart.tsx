/**
 * K线图组件
 * 使用 TradingView Lightweight Charts v5
 * 黑白主题，类似 OKX 风格
 */

import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, ColorType } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import type { CandleData } from '../hooks/useOkxWebSocket';

interface CandlestickChartProps {
  candles: CandleData[];
  height?: number;
}

export function CandlestickChart({ candles, height = 280 }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  // 初始化图表
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#121212' },
        textColor: '#808080',
      },
      grid: {
        vertLines: { color: '#1e1e1e' },
        horzLines: { color: '#1e1e1e' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#404040',
          width: 1,
          style: 2,
          labelBackgroundColor: '#2a2a2a',
        },
        horzLine: {
          color: '#404040',
          width: 1,
          style: 2,
          labelBackgroundColor: '#2a2a2a',
        },
      },
      rightPriceScale: {
        borderColor: '#1e1e1e',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#1e1e1e',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // v5 新 API: 使用 addSeries
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00b076',
      downColor: '#f6465d',
      borderUpColor: '#00b076',
      borderDownColor: '#f6465d',
      wickUpColor: '#00b076',
      wickDownColor: '#f6465d',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // 响应式调整
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [height]);

  // 更新数据
  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;

    const chartData: CandlestickData[] = candles.map(c => ({
      time: c.time as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    seriesRef.current.setData(chartData);

    // 滚动到最新
    if (chartRef.current) {
      chartRef.current.timeScale().scrollToRealTime();
    }
  }, [candles]);

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ height }}
    />
  );
}
