import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Colors from '@/constants/Colors';

interface ExerciseHistoryData {
  date: string;
  maxWeight: number;
}

interface Props {
  historyData: ExerciseHistoryData[];
  width?: number;
  height?: number;
}

const ExerciseHistoryChart: React.FC<Props> = ({ 
  historyData,
  width = Dimensions.get('window').width - 60,
  height = 200
}) => {
  if (!historyData || historyData.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.noDataText}>No history data available</Text>
      </View>
    );
  }

  // Find max weight to scale the graph
  const maxWeight = Math.max(...historyData.map(item => item.maxWeight));
  // Add 20% padding to the max weight for better visualization
  const graphMaxWeight = Math.ceil(maxWeight * 1.2);
  
  // FIXED: Consistent graph dimensions and padding
  const leftPadding = 40;
  const rightPadding = 20;
  const bottomPadding = 30;
  const topPadding = 10;
  
  const graphHeight = height - bottomPadding - topPadding - 40; // Account for title and padding
  const graphWidth = width - leftPadding - rightPadding;
  
  // FIXED: Better x and y calculations for each point
  const points = historyData.map((item, index) => {
    // When there's only one data point, center it
    const x = historyData.length === 1 
      ? leftPadding + graphWidth / 2 
      : leftPadding + (index / (historyData.length - 1)) * graphWidth;
      
    // Calculate y position - 0 should be at the bottom, max at the top
    const y = topPadding + ((item.maxWeight / graphMaxWeight)) * graphHeight;
    
    return { 
      x, 
      y, 
      weight: item.maxWeight, 
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });

  return (
    <View style={[styles.container, { width, height }]}>
      <Text style={styles.title}>Weight Progression</Text>
      
      <View style={[styles.chartContainer, { height: height - 40 }]}>
        {/* Y-axis labels */}
        <View style={[styles.yAxisContainer, { height: graphHeight, top: topPadding }]}>
          {[1, 0.75, 0.5, 0.25, 0].map((ratio, index) => (
            <View 
              key={`y-${index}`} 
              style={[
                styles.yAxisLabelContainer, 
                { top: `${ratio * 100}%` }
              ]}
            >
              <Text style={styles.yAxisLabel}>
                {Math.round(graphMaxWeight * (1 - ratio))}
              </Text>
              <View style={[styles.gridLine, { left: 0, width: graphWidth }]} />
            </View>
          ))}
        </View>
        
        {/* Chart area */}
        <View style={[
          styles.graphArea, 
          { 
            height: graphHeight, 
            width: graphWidth,
            left: leftPadding,
            top: topPadding
          }
        ]}>
          {/* Connect dots with lines */}
          {points.length > 1 && points.map((point, index) => {
            if (index === 0) return null;
            const prevPoint = points[index - 1];
            
            const dx = point.x - prevPoint.x;
            const dy = point.y - prevPoint.y;
            const distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            return (
              <View 
                key={`line-${index}`}
                style={[
                  styles.lineSegment,
                  {
                    left: prevPoint.x - leftPadding,
                    top: prevPoint.y - topPadding,
                    width: distance,
                    transform: [{ rotate: `${angle}deg` }]
                  }
                ]}
              />
            );
          })}
          
          {/* Data points */}
          {points.map((point, index) => (
            <View 
              key={`point-${index}`} 
              style={[
                styles.dataPoint,
                { 
                  left: point.x - leftPadding - 4, 
                  top: point.y - topPadding - 4
                }
              ]}
            >
              <Text style={[
                styles.pointValue,
                { 
                  top: point.y < (graphHeight / 2 + topPadding) ? 8 : -20
                }
              ]}>
                {point.weight}
              </Text>
            </View>
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
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 12,
  },
  noDataText: {
    textAlign: 'center',
    color: Colors.gray,
    fontSize: 14,
    marginTop: 40,
  },
  chartContainer: {
    position: 'relative',
    width: '100%',
  },
  yAxisContainer: {
    position: 'absolute',
    left: 0,
    width: 40,
  },
  yAxisLabelContainer: {
    position: 'absolute',
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 1,
  },
  yAxisLabel: {
    fontSize: 10,
    color: Colors.gray,
    width: 35,
    textAlign: 'right',
    marginRight: 5,
    transform: [{ translateY: -5 }],
  },
  gridLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: Colors.lightGray,
    opacity: 0.3,
  },
  graphArea: {
    position: 'absolute',
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: Colors.primary,
    transformOrigin: 'left center',
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.card,
    zIndex: 2,
  },
  pointValue: {
    position: 'absolute',
    left: -8,
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.text,
    width: 24,
    textAlign: 'center',
  },
  xAxisContainer: {
    position: 'absolute',
    height: 30,
  },
  xAxisLabel: {
    position: 'absolute',
    fontSize: 10,
    color: Colors.gray,
    textAlign: 'center',
  }
});

export default ExerciseHistoryChart;
