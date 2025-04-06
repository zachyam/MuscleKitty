import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Colors from '@/constants/Colors';
import { WorkoutLog } from '@/types';

type ActivityLevel = 0 | 1;

interface DayData {
  date: Date;
  level: ActivityLevel;
  count: number;
  month: number;
}

interface Props {
  workoutLogs: WorkoutLog[];
  onDayPress?: (date: Date, count: number) => void;
}

const ActivityGraph: React.FC<Props> = ({ 
  workoutLogs, 
  onDayPress 
}) => {
  const [days, setDays] = useState<DayData[]>([]);
  const [monthLabels, setMonthLabels] = useState<string[]>([]);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipText, setTooltipText] = useState('');
  
  useEffect(() => {
    generateCalendarData();
  }, [workoutLogs]);

  // Get screen width to calculate sizes
  const screenWidth = Dimensions.get('window').width - 60; // Account for padding

  const generateCalendarData = () => {
    // Get current date
    const today = new Date();
    
    // Get current month and previous two months
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Create array to hold all days
    const allDays: DayData[] = [];
    const monthNames: string[] = [];
    
    // Create a map for fast workout lookup
    const workoutMap = new Map<string, number>();
    workoutLogs.forEach(log => {
      const dateStr = new Date(log.date).toISOString().split('T')[0];
      workoutMap.set(dateStr, (workoutMap.get(dateStr) || 0) + 1);
    });
    
    // Process each of the three months in chronological order (2 months ago, last month, current month)
    for (let i = 2; i >= 0; i--) {
      // Calculate month index (handle wrapping to previous year)
      const monthIndex = currentMonth - i;
      const year = monthIndex < 0 ? currentYear - 1 : currentYear;
      const adjustedMonthIndex = monthIndex < 0 ? monthIndex + 12 : monthIndex;
      
      // Get the month name
      const monthDate = new Date(year, adjustedMonthIndex, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
      monthNames.push(monthName);
      
      // Calculate number of days in the month
      const lastDayOfMonth = new Date(year, adjustedMonthIndex + 1, 0).getDate();
      
      // Add each day of the month
      for (let day = 1; day <= lastDayOfMonth; day++) {
        const date = new Date(year, adjustedMonthIndex, day);
        // Format date string the same way as in the workoutMap
        const dateStr = date.toISOString().split('T')[0];
        const count = workoutMap.get(dateStr) || 0;
        
        allDays.push({
          date,
          level: count > 0 ? 1 : 0,
          count,
          month: adjustedMonthIndex
        });
      }
    }
    
    setDays(allDays);
    setMonthLabels(monthNames); // Already in chronological order (oldest to newest)
  };

  const getActivityColor = (level: ActivityLevel) => {
    switch (level) {
      case 0: return Colors.background; // Empty day - GitHub light gray
      case 1: return '#A3D977'; // Active day - GitHub green
    }
  };
  
  // Format date for display and accessibility
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Calculate the size of each square based on screen width and number of days
  const calculateSquareSize = () => {
    // Calculate size based on available width and typical month
    const availableWidthPerMonth = screenWidth / 3; // 3 months
    const squaresPerRow = Math.ceil(31 / 7); // 31 days / 7 rows max
    const squareSize = Math.floor((availableWidthPerMonth - 10) / squaresPerRow);
    
    // Limit to reasonable size
    return Math.min(Math.max(squareSize, 8), 12);
  };
  
  const squareSize = calculateSquareSize();
  
  // Handle day press with inline tooltip instead of Alert
  const handleDayPress = (day: DayData) => {
    const formattedDate = day.date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    const message = `${formattedDate}`;
      
    setTooltipText(message);
    setTooltipVisible(true);
    
    // Hide tooltip after 3 seconds
    setTimeout(() => {
      setTooltipVisible(false);
    }, 3000);
    
    // Call the provided onDayPress callback if it exists
    if (onDayPress) {
      onDayPress(day.date, day.count);
    }
  };
  
  // Group days by month
  const daysByMonth: {[key: number]: DayData[]} = {};
  days.forEach(day => {
    if (!daysByMonth[day.month]) {
      daysByMonth[day.month] = [];
    }
    daysByMonth[day.month].push(day);
  });
  
  // Sort months to ensure they display in chronological order (oldest to newest)
  const sortMonths = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    
    return Object.keys(daysByMonth)
      .map(Number)
      .sort((a, b) => {
        // Handle year boundary case (e.g., Dec-Jan-Feb)
        if (a > 9 && currentMonth < 3) return -1; // a is from previous year
        if (b > 9 && currentMonth < 3) return 1;  // b is from previous year
        return a - b; // Normal ordering
      });
  };
  
  // Get sorted months
  const sortedMonths = sortMonths();
  
  return (
    <View style={styles.container}>
      <Text style={styles.graphTitle}>
        Last 3 Months
      </Text>
      
      <View style={styles.graphOuterContainer}>
        <View style={styles.graphInnerContainer}>
          {sortedMonths.map((monthNum, index) => (
            <View key={`month-${monthNum}`} style={styles.monthColumn}>
              <Text style={styles.monthLabel}>
                {monthLabels[index]}
              </Text>
              <View style={styles.daysContainer}>
                {daysByMonth[monthNum].map((day, dayIndex) => (
                  <TouchableOpacity
                    key={`day-${monthNum}-${dayIndex}`}
                    style={[
                      styles.daySquare, 
                      { 
                        backgroundColor: getActivityColor(day.level),
                        width: squareSize,
                        height: squareSize,
                      }
                    ]}
                    onPress={() => handleDayPress(day)}
                    accessibilityLabel={`${formatDate(day.date)}: ${day.count} workouts`}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
        
        {tooltipVisible && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>{tooltipText}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  graphOuterContainer: {
    paddingBottom: 20,
    position: 'relative', // For tooltip positioning
  },
  graphInnerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    width: '100%',
  },
  monthColumn: {
    flex: 1,
    marginHorizontal: 2,
  },
  monthLabel: {
    fontSize: 12,
    color: Colors.gray,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  daySquare: {
    borderRadius: 5,
    margin: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(36, 40, 40, 0.67)',
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 25, // Extra space for tooltip
  },
  legendSquare: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginHorizontal: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(27, 31, 35, 0.06)',
  },
  legendText: {
    fontSize: 12,
    color: Colors.gray,
    marginHorizontal: 3,
  },
  tooltip: {
    position: 'absolute',
    width: '50%',
    bottom: 50,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 10,
    margin: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  tooltipText: {
    color: 'white',
    fontSize: 13,
    textAlign: 'center',
  }
});

export default ActivityGraph;