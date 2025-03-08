import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  // Chart dimensions
  const chartWidth = width - 30;
  const chartHeight = height - 50;  // Leave space for title

  // If no data or empty data, show placeholder
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

  // Extract the weights from the history data
  const weights = historyData.map(item => item.maxWeight);
  const maxWeight = Math.max(...weights, 1); // Ensure we don't divide by zero
  
  // Calculate positions based on the actual weights
  const dataPoints = historyData.map((item, index) => {
    // X position is evenly spaced within the chart (with padding)
    const xPos = 20 + (index * (chartWidth - 40) / (Math.max(historyData.length - 1, 1)));
    
    // Y position increases with weight (higher weight = higher on chart)
    // Scaled to fit within the chart height with some padding
    const yPos = chartHeight * 0.1 + ((maxWeight - item.maxWeight) / maxWeight) * (chartHeight * 0.8);
    
    return { 
      x: xPos, 
      y: yPos,
      value: item.maxWeight,
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });

  return (
    <View style={[styles.container, { width, height }]}>
      <Text style={styles.title}>Max Weight Progression</Text>
      
      <View style={styles.chartArea}>
        {/* Chart grid */}
        <View style={[styles.chartGrid, { height: chartHeight, width: chartWidth }]}>

          {/* Data points and connecting lines */}
          {dataPoints.map((point, index) => (
            <React.Fragment key={`point-${index}`}>
              {/* Point with value */}
              <View>
                <TouchableOpacity 
                  style={[
                    styles.dataPoint, 
                    { left: point.x - 5, top: point.y - 5 }
                  ]}
                  onPress={() => onPointPress && onPointPress(historyData[index].date, historyData[index].maxWeight)}
                />
                <Text 
                  style={[
                    styles.valueLabel,
                    { left: point.x - 15, top: point.y + 10 }
                  ]}
                >
                  {point.value}
                </Text>
              </View>
              
              {/* Line to next point */}
              {index < dataPoints.length - 1 && (
                <View 
                  style={[
                    styles.dataLine, 
                    {
                      left: point.x,
                      top: point.y,
                      width: Math.sqrt(
                        Math.pow(dataPoints[index + 1].x - point.x, 2) + 
                        Math.pow(dataPoints[index + 1].y - point.y, 2)
                      ),
                      transform: [{ 
                        rotate: `${Math.atan2(
                          dataPoints[index + 1].y - point.y, 
                          dataPoints[index + 1].x - point.x
                        ) * (180 / Math.PI)}deg` 
                      }],
                      transformOrigin: 'left'
                    }
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  chartArea: {
    flex: 1,
    height: '90%',
  },
  chartGrid: {
    flex: 1,
    position: 'relative',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.gray,
    borderRadius: 4,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.lightGray,
    opacity: 0.5,
  },
  dataPoint: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  dataLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: Colors.primary,
  },
  valueLabel: {
    position: 'absolute',
    fontSize: 10,
    color: Colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 30
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    color: Colors.gray,
    fontSize: 14
  }
});

export default ExerciseWeightChart;