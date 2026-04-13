import * as XLSX from 'xlsx';

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

export async function downloadPrimaryMembershipExcel(opts: {
  allMembers: any[];
  pastInactives: any[];
  yearSnapshots: YearSnap[];
  salesMonthly: SalesRow[];
}): Promise<void> {
  const { allMembers, pastInactives, yearSnapshots, salesMonthly } = opts;
  const wb = XLSX.utils.book_new();

  const snapSheet = XLSX.utils.json_to_sheet(
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
  XLSX.utils.book_append_sheet(wb, snapSheet, 'Year snapshots');

  const salesSheet = XLSX.utils.json_to_sheet(
    salesMonthly.map((r) => ({
      MonthKey: r.month_key,
      MonthLabel: r.month_label,
      Sales: r.sales_count,
      PreCancellations: r.pre_cancellations,
    })),
  );
  XLSX.utils.book_append_sheet(wb, salesSheet, 'Sales monthly');

  const liveSample = allMembers.slice(0, 5000).map((m) => ({
    MemberId: m.member_id,
    First: m.first_name,
    Last: m.last_name,
    AgentId: m.agent_id,
    Created: m.created_date,
    Active: m.active_date,
    Inactive: m.inactive_date,
    IsActive: m.is_active,
    Product: m.product_label,
  }));
  const liveSheet = XLSX.utils.json_to_sheet(liveSample);
  XLSX.utils.book_append_sheet(wb, liveSheet, 'Live primaries (sample)');

  const pastSample = pastInactives.slice(0, 5000).map((p) => ({
    MemberId: p.member_id,
    InactiveDate: p.inactive_date,
    Reason: p.inactive_reason,
    ActiveDate: p.active_date,
    MemberCreated: p.member_created_date,
    AgentId: p.agent_id,
  }));
  const pastSheet = XLSX.utils.json_to_sheet(pastSample);
  XLSX.utils.book_append_sheet(wb, pastSheet, 'Past inactives (sample)');

  const name = `primary_membership_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, name);
}
