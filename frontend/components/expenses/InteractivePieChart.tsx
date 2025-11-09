'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CategoryAllocation {
  category: string;
  percentage: number;
  amount: number;
}

interface InteractivePieChartProps {
  allocations: CategoryAllocation[];
  totalBudget: number;
  onUpdate: (category: string, newPercentage: number) => void;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  Food: '#f97316',
  Transportation: '#3b82f6',
  Entertainment: '#a855f7',
  Healthcare: '#ef4444',
  Shopping: '#2a5335',
  Utilities: '#eab308',
  Other: '#6b7280',
};

export function InteractivePieChart({ allocations, totalBudget, onUpdate }: InteractivePieChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingCategory, setDraggingCategory] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const size = 300;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 120;
  const innerRadius = 80;

  // Convert percentage to angle (degrees)
  const percentToAngle = (percent: number) => (percent / 100) * 360;

  // Calculate path for donut segment
  const createArc = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = centerX + outerR * Math.cos(startRad);
    const y1 = centerY + outerR * Math.sin(startRad);
    const x2 = centerX + outerR * Math.cos(endRad);
    const y2 = centerY + outerR * Math.sin(endRad);
    const x3 = centerX + innerR * Math.cos(endRad);
    const y3 = centerY + innerR * Math.sin(endRad);
    const x4 = centerX + innerR * Math.cos(startRad);
    const y4 = centerY + innerR * Math.sin(startRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `
      M ${x1} ${y1}
      A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}
      Z
    `;
  };

  const handleMouseDown = (category: string) => {
    setDraggingCategory(category);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingCategory || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;
    
    // Calculate angle from center
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    // Find the category being dragged and calculate new percentage
    let currentAngle = 0;
    const categoryIndex = allocations.findIndex(a => a.category === draggingCategory);
    
    // Get angle where this category starts
    for (let i = 0; i < categoryIndex; i++) {
      currentAngle += percentToAngle(allocations[i].percentage);
    }

    // Calculate new percentage based on angle difference
    let newAngle = angle - currentAngle;
    if (newAngle < 0) newAngle += 360;
    
    const newPercentage = Math.max(0, Math.min(100, (newAngle / 360) * 100));
    
    // Calculate remaining percentage for other categories
    const otherTotal = allocations
      .filter(a => a.category !== draggingCategory)
      .reduce((sum, a) => sum + a.percentage, 0);
    
    const maxAllowed = 100 - otherTotal;
    const clampedPercentage = Math.min(newPercentage, maxAllowed);
    
    if (clampedPercentage !== allocations[categoryIndex].percentage) {
      onUpdate(draggingCategory, clampedPercentage);
    }
  };

  const handleMouseUp = () => {
    setDraggingCategory(null);
  };

  useEffect(() => {
    if (draggingCategory) {
      const handleGlobalMouseUp = () => setDraggingCategory(null);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [draggingCategory]);

  // Build segments
  let currentAngle = 0;
  const segments = allocations.map((allocation, index) => {
    const startAngle = currentAngle;
    const endAngle = currentAngle + percentToAngle(allocation.percentage);
    currentAngle = endAngle;

    const isHovered = hoveredCategory === allocation.category;
    const isDragging = draggingCategory === allocation.category;
    const outerR = isHovered || isDragging ? radius + 10 : radius;
    
    const path = createArc(startAngle, endAngle, outerR, innerRadius);
    const color = CATEGORY_COLORS[allocation.category] || CATEGORY_COLORS.Other;

    // Calculate label position (middle of arc)
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = (outerR + innerRadius) / 2;
    const labelAngleRad = (midAngle - 90) * (Math.PI / 180);
    const labelX = centerX + labelRadius * Math.cos(labelAngleRad);
    const labelY = centerY + labelRadius * Math.sin(labelAngleRad);

    return (
      <g key={allocation.category}>
        <motion.path
          d={path}
          fill={color}
          stroke="#1f2937"
          strokeWidth="2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            filter: isDragging ? 'brightness(1.2)' : 'brightness(1)'
          }}
          transition={{ delay: index * 0.05 }}
          onMouseDown={() => handleMouseDown(allocation.category)}
          onMouseEnter={() => setHoveredCategory(allocation.category)}
          onMouseLeave={() => setHoveredCategory(null)}
          style={{ 
            cursor: 'grab',
            transition: 'all 0.2s ease'
          }}
        />
        {allocation.percentage > 5 && (
          <text
            x={labelX}
            y={labelY}
            textAnchor="middle"
            fill="white"
            fontSize="14"
            fontWeight="bold"
            pointerEvents="none"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
          >
            {allocation.percentage.toFixed(0)}%
          </text>
        )}
      </g>
    );
  });

  return (
    <div className="flex flex-col items-center">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="select-none"
        style={{ cursor: draggingCategory ? 'grabbing' : 'default' }}
      >
        {segments}
        
        {/* Center circle with total */}
        <circle
          cx={centerX}
          cy={centerY}
          r={innerRadius - 2}
          fill="#1f2937"
        />
        <text
          x={centerX}
          y={centerY - 15}
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="14"
          fontWeight="500"
        >
          Total Budget
        </text>
        <text
          x={centerX}
          y={centerY + 15}
          textAnchor="middle"
          fill="white"
          fontSize="24"
          fontWeight="bold"
        >
          ${totalBudget.toLocaleString()}
        </text>
      </svg>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-md">
        {allocations.map((allocation) => (
          <motion.div
            key={allocation.category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
              hoveredCategory === allocation.category || draggingCategory === allocation.category
                ? 'bg-gray-100 dark:bg-gray-700 scale-105'
                : 'bg-transparent'
            }`}
            onMouseEnter={() => setHoveredCategory(allocation.category)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: CATEGORY_COLORS[allocation.category] || CATEGORY_COLORS.Other }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {allocation.category}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                ${allocation.amount.toFixed(0)} • {allocation.percentage.toFixed(1)}%
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {draggingCategory && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center text-sm font-medium text-gray-600 dark:text-gray-400"
        >
          Drag to adjust {draggingCategory} allocation
        </motion.div>
      )}
    </div>
  );
}

