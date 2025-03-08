import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

interface Props {
  width: number;
  height: number;
}

const SimpleWeightChart: React.FC<Props> = ({ width, height }) => {
  // Chart dimensions
  const chartWidth = width - 30;
  const chartHeight = height - 50;  // Leave space for title

  // Create some mock data points with specific weight values
  const weights = [10, 20, 25, 27.5, 30];
  const maxWeight = Math.max(...weights);
  
  // Calculate positions based on weights
  const mockPoints = weights.map((weight, index) => {
    // X position is evenly spaced within the chart (with padding)
    const xPos = 20 + (index * (chartWidth - 40) / (weights.length - 1));
    
    // Y position increases with weight (higher weight = higher on chart)
    // Scaled to fit within the chart height with some padding
    const yPos = chartHeight * 0.1 + ((maxWeight - weight) / maxWeight) * (chartHeight * 0.8);
    
    return { 
      x: xPos, 
      y: yPos,
      value: weight
    };
  });

  return (
    <View style={[styles.container, { width, height }]}>
      <Text style={styles.title}>Weight Progression</Text>
      
      <View style={styles.chartArea}>
        {/* Chart grid */}
        <View style={[styles.chartGrid, { height: chartHeight, width: chartWidth }]}>
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <View 
              key={`grid-${i}`} 
              style={[
                styles.gridLine, 
                { top: chartHeight * ratio }
              ]} 
            />
          ))}

          {/* Data points and connecting lines */}
          {mockPoints.map((point, index) => (
            <React.Fragment key={`point-${index}`}>
              {/* Point with value */}
              <View>
                <View 
                  style={[
                    styles.dataPoint, 
                    { left: point.x - 5, top: point.y - 5 }
                  ]}
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
              {index < mockPoints.length - 1 && (
                <View 
                  style={[
                    styles.dataLine, 
                    {
                      left: point.x,
                      top: point.y,
                      width: Math.sqrt(
                        Math.pow(mockPoints[index + 1].x - point.x, 2) + 
                        Math.pow(mockPoints[index + 1].y - point.y, 2)
                      ),
                      transform: [{ 
                        rotate: `${Math.atan2(
                          mockPoints[index + 1].y - point.y, 
                          mockPoints[index + 1].x - point.x
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
    borderWidth: 1,
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
    borderRadius: 5,
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
  }
});

export default SimpleWeightChart;