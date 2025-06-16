import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Svg, { Path, Line, Text, G, Rect } from 'react-native-svg';

interface VaRData {
  returns: number[];
  var95: number;
  var99: number;
  mean: number;
}

interface VaRChartProps {
  data: VaRData;
  width?: number;
  height?: number;
  margin?: number;
  showGrid?: boolean;
  showLabels?: boolean;
}

const VaRChart: React.FC<VaRChartProps> = ({
  data,
  width = Dimensions.get('window').width - 40,
  height = 300,
  margin = 40,
  showGrid = true,
  showLabels = true,
}) => {
  // Calculate histogram bins
  const binCount = 20;
  const minReturn = Math.min(...data.returns);
  const maxReturn = Math.max(...data.returns);
  const binWidth = (maxReturn - minReturn) / binCount;
  
  const bins = Array(binCount).fill(0);
  data.returns.forEach(return_ => {
    const binIndex = Math.min(
      Math.floor((return_ - minReturn) / binWidth),
      binCount - 1
    );
    bins[binIndex]++;
  });

  const maxFrequency = Math.max(...bins);
  const xScale = (width - 2 * margin) / (maxReturn - minReturn);
  const yScale = (height - 2 * margin) / maxFrequency;

  // Generate histogram path
  const generateHistogramPath = () => {
    return bins.map((frequency, i) => {
      const x = margin + (minReturn + i * binWidth) * xScale;
      const y = height - margin - frequency * yScale;
      const width = binWidth * xScale;
      const height = frequency * yScale;
      return `M ${x} ${height - margin} h ${width} v ${-height} h ${-width} Z`;
    }).join(' ');
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

        {/* Histogram */}
        <Path
          d={generateHistogramPath()}
          fill="#2196F3"
          fillOpacity="0.6"
          stroke="#2196F3"
          strokeWidth="1"
        />

        {/* VaR Lines */}
        <Line
          x1={margin + (data.var95 - minReturn) * xScale}
          y1={margin}
          x2={margin + (data.var95 - minReturn) * xScale}
          y2={height - margin}
          stroke="#FF5722"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        <Line
          x1={margin + (data.var99 - minReturn) * xScale}
          y1={margin}
          x2={margin + (data.var99 - minReturn) * xScale}
          y2={height - margin}
          stroke="#F44336"
          strokeWidth="2"
          strokeDasharray="5,5"
        />

        {/* Mean Line */}
        <Line
          x1={margin + (data.mean - minReturn) * xScale}
          y1={margin}
          x2={margin + (data.mean - minReturn) * xScale}
          y2={height - margin}
          stroke="#4CAF50"
          strokeWidth="2"
        />

        {/* Labels */}
        {showLabels && (
          <G>
            <Text
              x={margin + (data.var95 - minReturn) * xScale}
              y={margin - 5}
              fill="#FF5722"
              fontSize="12"
              textAnchor="middle"
            >
              95% VaR
            </Text>
            <Text
              x={margin + (data.var99 - minReturn) * xScale}
              y={margin - 5}
              fill="#F44336"
              fontSize="12"
              textAnchor="middle"
            >
              99% VaR
            </Text>
            <Text
              x={margin + (data.mean - minReturn) * xScale}
              y={margin - 5}
              fill="#4CAF50"
              fontSize="12"
              textAnchor="middle"
            >
              Mean
            </Text>
          </G>
        )}

        {/* Axis Labels */}
        <Text
          x={width / 2}
          y={height - 10}
          fill="#666"
          fontSize="12"
          textAnchor="middle"
        >
          Returns
        </Text>
        <Text
          x={10}
          y={height / 2}
          fill="#666"
          fontSize="12"
          textAnchor="middle"
          transform={`rotate(-90, 10, ${height / 2})`}
        >
          Frequency
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

export default VaRChart; 