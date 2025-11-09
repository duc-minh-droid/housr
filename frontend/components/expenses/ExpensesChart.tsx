'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface ExpensesChartProps {
  data: { date: string; total: number }[];
  period: 'week' | 'month' | 'all';
}

export function ExpensesChart({ data, period }: ExpensesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>No expenses recorded for this period</p>
      </div>
    );
  }

  // Format date labels based on period
  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    try {
      switch (period) {
        case 'week':
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        case 'month':
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        case 'all':
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        default:
          return dateStr;
      }
    } catch {
      return dateStr;
    }
  };

  const chartData = (Array.isArray(data) ? data : []).map((item) => ({
    ...item,
    formattedDate: formatDateLabel(item?.date || ''),
    total: typeof item?.total === 'number' ? item.total : 0,
  }));

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-gray-200 dark:stroke-gray-700"
          />
          <XAxis
            dataKey="formattedDate"
            className="text-xs fill-gray-600 dark:fill-gray-400"
            tick={{ fontSize: 13 }}
            height={50}
          />
          <YAxis
            className="text-xs fill-gray-600 dark:fill-gray-400"
            tick={{ fontSize: 13 }}
            width={60}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '10px 14px',
            }}
            labelStyle={{ color: '#1e293b', fontWeight: 600, fontSize: 14 }}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: '#10b981', r: 5 }}
            activeDot={{ r: 7, fill: '#059669' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

