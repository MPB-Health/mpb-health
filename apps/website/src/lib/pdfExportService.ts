import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Lead, CRMDashboardStats, PipelineStage } from './crmService';

// ============================================================================
// Types
// ============================================================================

export interface PDFExportOptions {
  title?: string;
  subtitle?: string;
  includeStats?: boolean;
  columns?: string[];
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter';
}

export interface LeadReportData {
  lead: Lead;
  activities?: Array<{
    activity_type: string;
    title: string;
    description?: string;
    created_at: string;
  }>;
  tasks?: Array<{
    title: string;
    due_date: string;
    completed: boolean;
  }>;
}

// ============================================================================
// PDF Export Service
// ============================================================================

class PDFExportService {
  private primaryColor: [number, number, number] = [30, 64, 175]; // Blue-700
  private secondaryColor: [number, number, number] = [100, 116, 139]; // Slate-500
  private successColor: [number, number, number] = [34, 197, 94]; // Green-500
  private warningColor: [number, number, number] = [245, 158, 11]; // Amber-500
  private dangerColor: [number, number, number] = [239, 68, 68]; // Red-500

  // --------------------------------------------------------------------------
  // Leads List Export
  // --------------------------------------------------------------------------

  exportLeadsList(
    leads: Lead[],
    options: PDFExportOptions = {}
  ): void {
    const {
      title = 'Leads Report',
      subtitle = `Generated on ${new Date().toLocaleDateString()}`,
      columns = ['first_name', 'last_name', 'email', 'phone', 'pipeline_stage', 'priority', 'created_at'],
      orientation = 'landscape',
      pageSize = 'a4',
    } = options;

    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize,
    });

    // Add header
    this.addHeader(doc, title, subtitle);

    // Column headers formatting
    const columnLabels: Record<string, string> = {
      first_name: 'First Name',
      last_name: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      zip_code: 'ZIP Code',
      pipeline_stage: 'Stage',
      priority: 'Priority',
      lead_score: 'Score',
      source_cta: 'Source',
      created_at: 'Created',
      tags: 'Tags',
    };

    const headers = columns.map(col => columnLabels[col] || col);
    
    const body = leads.map(lead => 
      columns.map(col => {
        const value = lead[col as keyof Lead];
        if (col === 'created_at' && value) {
          return new Date(value as string).toLocaleDateString();
        }
        if (col === 'tags' && Array.isArray(value)) {
          return (value as string[]).join(', ');
        }
        if (col === 'pipeline_stage') {
          return this.formatStageName(value as string);
        }
        if (col === 'priority') {
          return (value as string)?.toUpperCase() || 'MEDIUM';
        }
        return value ?? '';
      })
    );

    autoTable(doc, {
      head: [headers],
      body,
      startY: 35,
      theme: 'striped',
      headStyles: {
        fillColor: this.primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 25 }, // First Name
        1: { cellWidth: 25 }, // Last Name
        2: { cellWidth: 45 }, // Email
        3: { cellWidth: 30 }, // Phone
        4: { cellWidth: 25 }, // Stage
        5: { cellWidth: 20 }, // Priority
        6: { cellWidth: 25 }, // Created
      },
      margin: { top: 35, right: 10, bottom: 20, left: 10 },
      didDrawPage: (data) => {
        this.addFooter(doc, data.pageNumber);
      },
    });

    // Summary
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 200;
    doc.setFontSize(10);
    doc.setTextColor(...this.secondaryColor);
    doc.text(`Total Leads: ${leads.length}`, 10, finalY + 10);

    doc.save(`leads_report_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // --------------------------------------------------------------------------
  // Pipeline Summary Report
  // --------------------------------------------------------------------------

  exportPipelineSummary(
    stats: CRMDashboardStats,
    stages: PipelineStage[],
    leadsByStage: Record<string, Lead[]>
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const title = 'Pipeline Summary Report';
    const subtitle = `Generated on ${new Date().toLocaleDateString()}`;

    this.addHeader(doc, title, subtitle);

    let yPos = 40;

    // Key Metrics Section
    doc.setFontSize(14);
    doc.setTextColor(...this.primaryColor);
    doc.text('Key Metrics', 10, yPos);
    yPos += 8;

    const metrics = [
      ['Total Leads', stats.total_leads.toString()],
      ['New Leads', stats.new_leads.toString()],
      ['Conversion Rate', `${stats.conversion_rate}%`],
      ['Avg. Days to Close', stats.avg_days_to_close.toFixed(1)],
      ['Overdue Tasks', stats.overdue_tasks.toString()],
      ['Tasks Due Today', stats.tasks_due_today.toString()],
    ];

    autoTable(doc, {
      body: metrics,
      startY: yPos,
      theme: 'plain',
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 40 },
      },
      bodyStyles: {
        fontSize: 11,
        cellPadding: 4,
      },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY + 15 || yPos + 60;

    // Pipeline Stages Section
    doc.setFontSize(14);
    doc.setTextColor(...this.primaryColor);
    doc.text('Pipeline Breakdown', 10, yPos);
    yPos += 8;

    const stageData = stages.map(stage => {
      const count = leadsByStage[stage.name]?.length || 0;
      const percentage = stats.total_leads > 0 
        ? ((count / stats.total_leads) * 100).toFixed(1) 
        : '0';
      return [stage.display_name, count.toString(), `${percentage}%`];
    });

    autoTable(doc, {
      head: [['Stage', 'Count', 'Percentage']],
      body: stageData,
      startY: yPos,
      theme: 'striped',
      headStyles: {
        fillColor: this.primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 40, halign: 'center' },
      },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY + 15 || yPos + 80;

    // Priority Distribution
    if (yPos < 240) {
      doc.setFontSize(14);
      doc.setTextColor(...this.primaryColor);
      doc.text('Priority Distribution', 10, yPos);
      yPos += 8;

      const priorityData = Object.entries(stats.leads_by_priority || {}).map(([priority, count]) => [
        priority.toUpperCase(),
        count.toString(),
      ]);

      autoTable(doc, {
        head: [['Priority', 'Count']],
        body: priorityData.length > 0 ? priorityData : [['No data', '-']],
        startY: yPos,
        theme: 'striped',
        headStyles: {
          fillColor: this.primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: 4,
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 40, halign: 'center' },
        },
      });
    }

    this.addFooter(doc, 1);
    doc.save(`pipeline_summary_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // --------------------------------------------------------------------------
  // Individual Lead Report
  // --------------------------------------------------------------------------

  exportLeadReport(data: LeadReportData): void {
    const { lead, activities = [], tasks = [] } = data;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const title = `Lead Report: ${lead.first_name} ${lead.last_name}`;
    const subtitle = `Generated on ${new Date().toLocaleDateString()}`;

    this.addHeader(doc, title, subtitle);

    let yPos = 40;

    // Contact Information
    doc.setFontSize(12);
    doc.setTextColor(...this.primaryColor);
    doc.text('Contact Information', 10, yPos);
    yPos += 8;

    const contactInfo = [
      ['Name', `${lead.first_name} ${lead.last_name}`],
      ['Email', lead.email],
      ['Phone', lead.phone],
      ['ZIP Code', lead.zip_code || 'N/A'],
      ['Created', new Date(lead.created_at).toLocaleDateString()],
    ];

    autoTable(doc, {
      body: contactInfo,
      startY: yPos,
      theme: 'plain',
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold', textColor: this.secondaryColor },
        1: { cellWidth: 100 },
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 3,
      },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY + 10 || yPos + 50;

    // Lead Status
    doc.setFontSize(12);
    doc.setTextColor(...this.primaryColor);
    doc.text('Lead Status', 10, yPos);
    yPos += 8;

    const statusInfo = [
      ['Pipeline Stage', this.formatStageName(lead.pipeline_stage)],
      ['Priority', lead.priority?.toUpperCase() || 'MEDIUM'],
      ['Lead Score', lead.lead_score?.toString() || '0'],
      ['Tags', lead.tags?.join(', ') || 'None'],
      ['Source', lead.source_cta || 'Direct'],
      ['Last Contacted', lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString() : 'Never'],
      ['Next Follow-up', lead.next_followup_at ? new Date(lead.next_followup_at).toLocaleDateString() : 'Not scheduled'],
    ];

    autoTable(doc, {
      body: statusInfo,
      startY: yPos,
      theme: 'plain',
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold', textColor: this.secondaryColor },
        1: { cellWidth: 100 },
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 3,
      },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY + 10 || yPos + 70;

    // Coverage Preferences (if available)
    if (lead.coverage_preference || lead.primary_concern || lead.current_insurance) {
      doc.setFontSize(12);
      doc.setTextColor(...this.primaryColor);
      doc.text('Coverage Details', 10, yPos);
      yPos += 8;

      const coverageInfo = [];
      if (lead.coverage_preference) coverageInfo.push(['Coverage Preference', lead.coverage_preference]);
      if (lead.primary_concern) coverageInfo.push(['Primary Concern', lead.primary_concern]);
      if (lead.current_insurance) coverageInfo.push(['Current Insurance', lead.current_insurance]);
      if (lead.monthly_premium) coverageInfo.push(['Monthly Premium', lead.monthly_premium]);
      if (lead.contact_preference) coverageInfo.push(['Contact Preference', lead.contact_preference]);

      autoTable(doc, {
        body: coverageInfo,
        startY: yPos,
        theme: 'plain',
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold', textColor: this.secondaryColor },
          1: { cellWidth: 90 },
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: 3,
        },
      });

      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY + 10 || yPos + 50;
    }

    // Tasks
    if (tasks.length > 0 && yPos < 220) {
      doc.setFontSize(12);
      doc.setTextColor(...this.primaryColor);
      doc.text('Tasks', 10, yPos);
      yPos += 8;

      const taskData = tasks.slice(0, 5).map(task => [
        task.title,
        new Date(task.due_date).toLocaleDateString(),
        task.completed ? 'Completed' : 'Pending',
      ]);

      autoTable(doc, {
        head: [['Task', 'Due Date', 'Status']],
        body: taskData,
        startY: yPos,
        theme: 'striped',
        headStyles: {
          fillColor: this.primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 3,
        },
      });

      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY + 10 || yPos + 40;
    }

    // Recent Activity
    if (activities.length > 0 && yPos < 240) {
      doc.setFontSize(12);
      doc.setTextColor(...this.primaryColor);
      doc.text('Recent Activity', 10, yPos);
      yPos += 8;

      const activityData = activities.slice(0, 8).map(activity => [
        new Date(activity.created_at).toLocaleDateString(),
        this.formatActivityType(activity.activity_type),
        activity.title,
      ]);

      autoTable(doc, {
        head: [['Date', 'Type', 'Description']],
        body: activityData,
        startY: yPos,
        theme: 'striped',
        headStyles: {
          fillColor: this.primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 30 },
          2: { cellWidth: 'auto' },
        },
      });
    }

    this.addFooter(doc, 1);
    doc.save(`lead_report_${lead.first_name}_${lead.last_name}_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private addHeader(doc: jsPDF, title: string, subtitle: string): void {
    // Company branding bar
    doc.setFillColor(...this.primaryColor);
    doc.rect(0, 0, doc.internal.pageSize.width, 25, 'F');

    // Title
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(title, 10, 12);

    // Subtitle
    doc.setFontSize(10);
    doc.setTextColor(200, 210, 230);
    doc.text(subtitle, 10, 20);

    // MPB Health logo text
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    const pageWidth = doc.internal.pageSize.width;
    doc.text('MPB Health', pageWidth - 35, 12);
  }

  private addFooter(doc: jsPDF, pageNumber: number): void {
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(8);
    doc.setTextColor(...this.secondaryColor);
    
    // Page number
    doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Footer text
    doc.text('Confidential - MPB Health CRM', 10, pageHeight - 10);
    doc.text(new Date().toLocaleString(), pageWidth - 50, pageHeight - 10);
  }

  private formatStageName(stage: string): string {
    if (!stage) return 'New';
    return stage.charAt(0).toUpperCase() + stage.slice(1).replace(/_/g, ' ');
  }

  private formatActivityType(type: string): string {
    const typeMap: Record<string, string> = {
      note: 'Note',
      call: 'Call',
      email: 'Email',
      meeting: 'Meeting',
      status_change: 'Status Change',
      assignment: 'Assignment',
      task_created: 'Task Created',
      task_completed: 'Task Completed',
    };
    return typeMap[type] || type;
  }

  // --------------------------------------------------------------------------
  // Public method to check if dependencies are available
  // --------------------------------------------------------------------------

  isAvailable(): boolean {
    return typeof jsPDF !== 'undefined' && typeof autoTable !== 'undefined';
  }
}

export const pdfExportService = new PDFExportService();
