import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text, G } from 'react-native-svg';

interface DataPoint {
  risk: number;
  return: number;
  label?: string;
}

interface EfficientFrontierProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  margin?: number;
  showGrid?: boolean;
  showLabels?: boolean;
}

const EfficientFrontier: React.FC<EfficientFrontierProps> = ({
  data,
  width = Dimensions.get('window').width - 40,
  height = 300,
  margin = 40,
  showGrid = true,
  showLabels = true,
}) => {
  // Calculate scales
  const xScale = (width - 2 * margin) / Math.max(...data.map(d => d.risk));
  const yScale = (height - 2 * margin) / Math.max(...data.map(d => d.return));

  // Generate path for efficient frontier curve
  const generatePath = () => {
    const points = data.map(
      (d, i) => `${margin + d.risk * xScale},${height - margin - d.return * yScale}`
    );
    return `M ${points.join(' L ')}`;
  };

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {showGrid && (
          <G>
            <Line
              x1={margin}
              y1={height - margin}
              x2={width - margin}
              y2={height - margin}
              stroke="#E0E0E0"
              strokeWidth="1"
            />
            <Line
              x1={margin}
              y1={margin}
              x2={margin}
              y2={height - margin}
              stroke="#E0E0E0"
              strokeWidth="1"
            />
          </G>
        )}

        {/* Efficient Frontier Curve */}
        <Path
          d={generatePath()}
          stroke="#2196F3"
          strokeWidth="2"
          fill="none"
        />

        {/* Data Points */}
        {data.map((point, index) => (
          <G key={index}>
            <Circle
              cx={margin + point.risk * xScale}
              cy={height - margin - point.return * yScale}
              r="4"
              fill="#2196F3"
            />
            {showLabels && point.label && (
              <Text
                x={margin + point.risk * xScale + 8}
                y={height - margin - point.return * yScale - 8}
                fill="#666"
                fontSize="12"
              >
                {point.label}
              </Text>
            )}
          </G>
        ))}

        {/* Axis Labels */}
        <Text
          x={width / 2}
          y={height - 10}
          fill="#666"
          fontSize="12"
          textAnchor="middle"
        >
          Risk (σ)
        </Text>
        <Text
          x={10}
          y={height / 2}
          fill="#666"
          fontSize="12"
          textAnchor="middle"
          transform={`rotate(-90, 10, ${height / 2})`}
        >
          Expected Return (μ)
        </Text>
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

export default EfficientFrontier; 