import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Svg, { Path, Line, Text, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface DataPoint {
  date: string;
  value: number;
}

interface Series {
  name: string;
  data: DataPoint[];
  color: string;
}

interface PerformanceChartProps {
  series: Series[];
  width?: number;
  height?: number;
  margin?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  showLegend?: boolean;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  series,
  width = Dimensions.get('window').width - 40,
  height = 300,
  margin = 40,
  showGrid = true,
  showLabels = true,
  showLegend = true,
}) => {
  // Calculate scales
  const allDates = Array.from(
    new Set(series.flatMap(s => s.data.map(d => d.date)))
  ).sort();
  
  const allValues = series.flatMap(s => s.data.map(d => d.value));
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  const xScale = (width - 2 * margin) / (allDates.length - 1);
  const yScale = (height - 2 * margin) / (maxValue - minValue);

  // Generate path for each series
  const generatePath = (data: DataPoint[]) => {
    return data
      .map((point, i) => {
        const x = margin + i * xScale;
        const y = height - margin - (point.value - minValue) * yScale;
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');
  };

  // Generate gradient ID
  const generateGradientId = (index: number) => `gradient-${index}`;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <Defs>
          {series.map((s, index) => (
            <LinearGradient
              key={index}
              id={generateGradientId(index)}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <Stop offset="0" stopColor={s.color} stopOpacity="0.3" />
              <Stop offset="1" stopColor={s.color} stopOpacity="0" />
            </LinearGradient>
          ))}
        </Defs>

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

        {/* Area and line for each series */}
        {series.map((s, index) => {
          const path = generatePath(s.data);
          const areaPath = `${path} L ${margin + (s.data.length - 1) * xScale} ${
            height - margin
          } L ${margin} ${height - margin} Z`;

          return (
            <G key={index}>
              {/* Area */}
              <Path
                d={areaPath}
                fill={`url(#${generateGradientId(index)})`}
                stroke="none"
              />
              {/* Line */}
              <Path
                d={path}
                stroke={s.color}
                strokeWidth="2"
                fill="none"
              />
            </G>
          );
        })}

        {/* X-axis labels */}
        {showLabels && (
          <G>
            {allDates.map((date, index) => {
              if (index % Math.ceil(allDates.length / 5) === 0) {
                return (
                  <Text
                    key={index}
                    x={margin + index * xScale}
                    y={height - margin + 20}
                    fill="#666"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {date}
                  </Text>
                );
              }
              return null;
            })}
          </G>
        )}

        {/* Y-axis labels */}
        {showLabels && (
          <G>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const value = minValue + (maxValue - minValue) * ratio;
              return (
                <Text
                  key={index}
                  x={margin - 5}
                  y={height - margin - ratio * (height - 2 * margin)}
                  fill="#666"
                  fontSize="10"
                  textAnchor="end"
                  alignmentBaseline="middle"
                >
                  {value.toFixed(2)}
                </Text>
              );
            })}
          </G>
        )}

        {/* Legend */}
        {showLegend && (
          <G>
            {series.map((s, index) => (
              <G key={index} transform={`translate(${width - 100}, ${20 + index * 20})`}>
                <Line
                  x1="0"
                  y1="8"
                  x2="20"
                  y2="8"
                  stroke={s.color}
                  strokeWidth="2"
                />
                <Text
                  x="25"
                  y="12"
                  fill="#666"
                  fontSize="10"
                  alignmentBaseline="middle"
                >
                  {s.name}
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

export default PerformanceChart; 