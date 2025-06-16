import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../../src/components/ui/Text';
import { Ionicons } from '@expo/vector-icons';

interface Report {
  id: string;
  title: string;
  type: 'portfolio' | 'var' | 'capm';
  date: string;
  status: 'completed' | 'generating';
}

const sampleReports: Report[] = [
  {
    id: '1',
    title: 'Portfolio Performance Report',
    type: 'portfolio',
    date: '2024-01-15',
    status: 'completed',
  },
  {
    id: '2',
    title: 'VaR Analysis Report',
    type: 'var',
    date: '2024-01-14',
    status: 'completed',
  },
  {
    id: '3',
    title: 'CAPM Metrics Report',
    type: 'capm',
    date: '2024-01-13',
    status: 'completed',
  },
];

export default function ReportsScreen() {
  const [selectedReportType, setSelectedReportType] = useState<'all' | 'portfolio' | 'var' | 'capm'>('all');

  const generateReport = (type: Report['type']) => {
    // TODO: Implement report generation logic
    console.log('Generating report:', type);
  };

  const filteredReports = selectedReportType === 'all'
    ? sampleReports
    : sampleReports.filter(report => report.type === selectedReportType);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
      </View>

      <View style={styles.reportTypes}>
        <TouchableOpacity
          style={[
            styles.reportTypeButton,
            selectedReportType === 'all' && styles.activeReportType,
          ]}
          onPress={() => setSelectedReportType('all')}
        >
          <Text style={styles.reportTypeText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.reportTypeButton,
            selectedReportType === 'portfolio' && styles.activeReportType,
          ]}
          onPress={() => setSelectedReportType('portfolio')}
        >
          <Text style={styles.reportTypeText}>Portfolio</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.reportTypeButton,
            selectedReportType === 'var' && styles.activeReportType,
          ]}
          onPress={() => setSelectedReportType('var')}
        >
          <Text style={styles.reportTypeText}>VaR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.reportTypeButton,
            selectedReportType === 'capm' && styles.activeReportType,
          ]}
          onPress={() => setSelectedReportType('capm')}
        >
          <Text style={styles.reportTypeText}>CAPM</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.generateSection}>
        <Text style={styles.sectionTitle}>Generate New Report</Text>
        <View style={styles.generateButtons}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => generateReport('portfolio')}
          >
            <Ionicons name="pie-chart" size={24} color="#007AFF" />
            <Text style={styles.generateButtonText}>Portfolio Performance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => generateReport('var')}
          >
            <Ionicons name="analytics" size={24} color="#007AFF" />
            <Text style={styles.generateButtonText}>VaR Analysis</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => generateReport('capm')}
          >
            <Ionicons name="trending-up" size={24} color="#007AFF" />
            <Text style={styles.generateButtonText}>CAPM Metrics</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.reportsList}>
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        {filteredReports.map((report) => (
          <TouchableOpacity key={report.id} style={styles.reportItem}>
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>{report.title}</Text>
              <Text style={styles.reportDate}>{report.date}</Text>
            </View>
            <View style={styles.reportActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="download-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  reportTypes: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  reportTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  activeReportType: {
    backgroundColor: '#007AFF',
  },
  reportTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  generateSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  generateButtons: {
    gap: 12,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    gap: 12,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  reportsList: {
    padding: 20,
  },
  reportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  reportActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 8,
  },
}); 