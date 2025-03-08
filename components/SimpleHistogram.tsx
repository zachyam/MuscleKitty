import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

interface Props {
  data: { label: string; value: number }[];
  width: number;
  height: number;
  barColor?: string;
  title?: string;
}

const SimpleHistogram = ({
  data,
  width,
  height,
  barColor = Colors.primary,
  title,
}: Props) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  // Calculate the maximum value for scaling
  const maxValue = Math.max(...data.map(item => item.value));
  
  // Ensure we have a non-zero max value
  const scaledMaxValue = Math.max(maxValue, 1) * 1.1;
  
  // Calculate the width of each bar based on container width
  const barWidth = (width - 40) / data.length;
  
  // The actual height of the chart area (excluding labels)
  const chartHeight = height * 0.7;

  return (
    <View style={[styles.container, { width, height }]}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={styles.histogramContainer}>
        {/* Grid lines */}
        <View style={styles.gridContainer}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <View 
              key={`grid-${index}`} 
              style={[
                styles.gridLine, 
                { bottom: chartHeight * ratio }
              ]}
            >
              <Text style={styles.gridLabel}>
                {Math.round(scaledMaxValue * ratio)}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Bars */}
        <View style={[styles.barsContainer, { height: chartHeight }]}>
          {data.map((item, index) => {
            const barHeight = (item.value / scaledMaxValue) * chartHeight;
            
            return (
              <View key={`bar-${index}`} style={[styles.barColumn, { width: barWidth }]}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: Math.max(barHeight, 1),
                      backgroundColor: barColor,
                    }
                  ]} 
                />
                <Text style={styles.barValue}>{item.value}</Text>
                <Text style={styles.barLabel}>{item.label}</Text>
              </View>
            );
          })}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: Colors.text,
  },
  histogramContainer: {
    flex: 1,
    position: 'relative',
  },
  gridContainer: {
    position: 'absolute',
    left: 30,
    right: 0,
    top: 0,
    bottom: 30, // Space for x-axis labels
    height: '70%',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.lightGray,
    opacity: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridLabel: {
    position: 'absolute',
    left: -25,
    fontSize: 10,
    color: Colors.gray,
    width: 20,
    textAlign: 'right',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingLeft: 30,
    marginBottom: 30, // Space for x-axis labels
  },
  barColumn: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '60%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  barLabel: {
    position: 'absolute',
    bottom: -30,
    fontSize: 10,
    color: Colors.gray,
    textAlign: 'center',
    width: '100%',
  },
  barValue: {
    position: 'absolute',
    bottom: -15,
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.text,
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 40,
    color: Colors.gray,
    fontSize: 14,
  },
});

export default SimpleHistogram;