import ExcelJS from 'exceljs';

type YearSnap = {
  year: number;
  isCurrentYear: boolean;
  activePrimaryEnd: number;
  inactivePrimaryEnd: number;
  cancellationsInYear: number;
  salesByCreatedDate: number;
  asOfLabel: string;
};

type SalesRow = {
  month_key: string;
  month_label: string;
  sales_count: number;
  pre_cancellations: number;
};

function addJsonSheet(
  wb: ExcelJS.Workbook,
  name: string,
  rows: Record<string, unknown>[],
): void {
  const ws = wb.addWorksheet(name.slice(0, 31));
  if (rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  ws.columns = keys.map((key) => ({ header: key, key, width: Math.max(key.length + 2, 14) }));
  for (const row of rows) {
    ws.addRow(row);
  }
}

async function saveWorkbook(wb: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function downloadPrimaryMembershipExcel(opts: {
  allMembers: any[];
  pastInactives: any[];
  yearSnapshots: YearSnap[];
  salesMonthly: SalesRow[];
}): Promise<void> {
  const { allMembers, pastInactives, yearSnapshots, salesMonthly } = opts;
  const wb = new ExcelJS.Workbook();

  addJsonSheet(
    wb,
    'Year snapshots',
    yearSnapshots.map((r) => ({
      Year: r.year,
      YTD: r.isCurrentYear ? 'Y' : '',
      AsOf: r.asOfLabel,
      ActivePrimary: r.activePrimaryEnd,
      InactivePrimary: r.inactivePrimaryEnd,
      SalesCreatedDate: r.salesByCreatedDate,
      CancellationsInYear: r.cancellationsInYear,
    })),
  );

  addJsonSheet(
    wb,
    'Sales monthly',
    salesMonthly.map((r) => ({
      MonthKey: r.month_key,
      MonthLabel: r.month_label,
      Sales: r.sales_count,
      PreCancellations: r.pre_cancellations,
    })),
  );

  addJsonSheet(
    wb,
    'Live primaries (sample)',
    allMembers.slice(0, 5000).map((m) => ({
      MemberId: m.member_id,
      First: m.first_name,
      Last: m.last_name,
      AgentId: m.agent_id,
      Created: m.created_date,
      Active: m.active_date,
      Inactive: m.inactive_date,
      IsActive: m.is_active,
      Product: m.product_label,
    })),
  );

  addJsonSheet(
    wb,
    'Past inactives (sample)',
    pastInactives.slice(0, 5000).map((p) => ({
      MemberId: p.member_id,
      InactiveDate: p.inactive_date,
      Reason: p.inactive_reason,
      ActiveDate: p.active_date,
      MemberCreated: p.member_created_date,
      AgentId: p.agent_id,
    })),
  );

  const name = `primary_membership_${new Date().toISOString().slice(0, 10)}.xlsx`;
  await saveWorkbook(wb, name);
}
