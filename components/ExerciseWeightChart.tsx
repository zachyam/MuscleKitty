import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, G, Text as SvgText, Line } from 'react-native-svg';
import Colors from '@/constants/Colors';

interface WeightHistoryItem {
  date: string;
  maxWeight: number;
}

interface Props {
  historyData: WeightHistoryItem[];
  width: number;
  height: number;
  onPointPress?: (date: string, weight: number) => void;
}

const ExerciseWeightChart: React.FC<Props> = ({ historyData, width, height, onPointPress }) => {
  const padding = 20;
  const chartWidth = width - padding * 4;
  const chartHeight = height - 50;

  if (!historyData || historyData.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}> 
        <Text style={styles.title}>Max Weight Progression</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No weight history available</Text>
        </View>
      </View>
    );
  }

  const weights = historyData.map(item => item.maxWeight);
  const maxWeight = Math.max(...weights, 1);
  const minWeight = Math.min(...weights);

  const points = historyData.map((item, index) => {
    const x = (index * (chartWidth / Math.max(historyData.length - 1, 1))) + padding;
    const y = padding + ((maxWeight - item.maxWeight) / (maxWeight - minWeight || 1)) * (chartHeight - padding);
    return { x, y, value: item.maxWeight, date: item.date };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <View style={styles.centeredContainer}> 
      <View style={[styles.container, { width, height }]}> 
        <Text style={styles.title}>Max Weight Progression</Text>

        <Svg width={width - 32} height={chartHeight + padding}>
          {/* Y-axis */}
          <Line x1={padding} y1={padding} x2={padding} y2={chartHeight} stroke="#ccc" strokeWidth={1} />

          {/* X-axis */}
          <Line x1={padding} y1={chartHeight} x2={chartWidth + padding} y2={chartHeight} stroke="#ccc" strokeWidth={1} />

          {/* Graph line */}
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke="#81B29A"
            strokeWidth="2"
          />

          {points.map((point, index) => (
            <G key={index}>
              <Circle
                cx={point.x}
                cy={point.y}
                r={5}
                fill="#81B29A"
                onPress={() => onPointPress && onPointPress(point.date, point.value)}
              />
              <SvgText
                x={point.x}
                y={point.y - 10}
                fontSize="10"
                fill="#6B4C3B"
                fontWeight="600"
                textAnchor="middle"
              >
                {point.value}
              </SvgText>
            </G>
          ))}
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  container: {
    // backgroundColor: '#F9F5EB',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    shadowColor: '#B7D4C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5F7161',
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    color: '#A18A74',
    fontSize: 14
  }
});

export default ExerciseWeightChart;
