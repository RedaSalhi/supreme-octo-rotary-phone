import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Svg, { Path, G, Text, Circle } from 'react-native-svg';

interface Asset {
  name: string;
  allocation: number;
  color: string;
}

interface PortfolioAllocationProps {
  data: Asset[];
  width?: number;
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
}

const PortfolioAllocation: React.FC<PortfolioAllocationProps> = ({
  data,
  width = Dimensions.get('window').width - 40,
  height = 300,
  showLegend = true,
  showLabels = true,
}) => {
  const radius = Math.min(width, height) / 2 - 40;
  const centerX = width / 2;
  const centerY = height / 2;

  // Calculate total allocation
  const total = data.reduce((sum, asset) => sum + asset.allocation, 0);

  // Generate pie chart segments
  let currentAngle = 0;
  const segments = data.map((asset, index) => {
    const percentage = asset.allocation / total;
    const startAngle = currentAngle;
    const endAngle = startAngle + percentage * 2 * Math.PI;
    currentAngle = endAngle;

    // Calculate path for pie segment
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    const largeArcFlag = percentage > 0.5 ? 1 : 0;

    const path = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    // Calculate label position
    const labelAngle = startAngle + (endAngle - startAngle) / 2;
    const labelRadius = radius * 0.7;
    const labelX = centerX + labelRadius * Math.cos(labelAngle);
    const labelY = centerY + labelRadius * Math.sin(labelAngle);

    return {
      path,
      label: {
        x: labelX,
        y: labelY,
        text: `${(percentage * 100).toFixed(1)}%`,
      },
    };
  });

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Pie Chart Segments */}
        {segments.map((segment, index) => (
          <G key={index}>
            <Path
              d={segment.path}
              fill={data[index].color}
              stroke="#fff"
              strokeWidth="1"
            />
            {showLabels && (
              <Text
                x={segment.label.x}
                y={segment.label.y}
                fill="#fff"
                fontSize="12"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {segment.label.text}
              </Text>
            )}
          </G>
        ))}

        {/* Legend */}
        {showLegend && (
          <G>
            {data.map((asset, index) => (
              <G key={index} transform={`translate(20, ${20 + index * 20})`}>
                <Circle cx="8" cy="8" r="6" fill={asset.color} />
                <Text
                  x="20"
                  y="12"
                  fill="#666"
                  fontSize="12"
                  alignmentBaseline="middle"
                >
                  {asset.name}
                </Text>
              </G>
            ))}
          </G>
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default PortfolioAllocation; 