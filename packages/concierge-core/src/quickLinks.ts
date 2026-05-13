export interface QuickLinkChild {
  name: string;
  url: string;
}

export interface QuickLink {
  name: string;
  url?: string;
  children?: QuickLinkChild[];
}

export const QUICK_LINKS: QuickLink[] = [
  {
    name: 'MPB Platforms',
    children: [
      { name: 'Zoho CRM', url: 'https://crm.zoho.com/crm/org55989130/tab/Home/begin' },
      { name: 'Admin123', url: 'https://www.administration123.com/manage/logout.cfm' },
      { name: 'APP Dashboard', url: 'https://app.mpbcloud.com/' },
      { name: 'GoTo Admin', url: 'https://admin.goto.com/8944090994408875270/phone-system/phone-numbers/phone-numbers-all?page=0&sort=id-number_direction-asc' },
      { name: 'GoTo Call Reports', url: 'https://my.jive.com/cr/mpoweringbenefitsl/summary' },
    ],
  },
  {
    name: 'Portals',
    children: [
      { name: 'ARM', url: 'https://www.mediconnx.com/MediClm/Login.aspx' },
      { name: 'Lyric', url: 'https://portal.getlyric.com/lyric/login' },
      { name: 'Zion', url: 'https://zionhealthshare.org/members/' },
      { name: 'Sedera', url: 'https://sedera.my.site.com/MemberPortal/s/login/' },
    ],
  },
  {
    name: 'Preventive',
    children: [
      { name: 'PHCS', url: 'https://providersearch.multiplan.com/' },
      { name: 'ZocDoc', url: 'https://www.zocdoc.com/' },
      { name: 'PHCS Nominate Provider', url: 'https://www.multiplan.com/providernominations/patient?siteid=84559' },
      { name: 'Preventive Task Force', url: 'https://www.uspreventiveservicestaskforce.org/uspstf/' },
      {
        name: 'USPSTF A & B recommendations',
        url: 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation-topics/uspstf-a-and-b-recommendations',
      },
    ],
  },
  {
    name: 'RX',
    children: [
      { name: 'RX Valet', url: 'https://web.thehealthwallet.com/login' },
      { name: 'Good RX', url: 'https://www.goodrx.com/' },
      { name: 'RX Go', url: 'https://www.rxgo.com/' },
      { name: 'Single Care', url: 'https://www.singlecare.com/' },
      { name: 'Mark Cuban', url: 'https://www.costplusdrugs.com/medications/' },
      { name: 'Canadian Drug Store', url: 'https://www.canadianmedstore.com/' },
    ],
  },
  {
    name: 'Labs',
    children: [
      { name: 'LaboratoryAssist', url: 'https://laboratoryassist.com/' },
      { name: 'Lab Tests Online', url: 'https://www.healthlabs.com/' },
      { name: 'Jason Health', url: 'https://www.jasonhealth.com/' },
      { name: 'Ulta Lab Tests', url: 'https://www.ultalabtests.com/' },
    ],
  },
  {
    name: 'Imaging & More',
    children: [
      { name: 'RadiologyAssist', url: 'https://radiologyassist.com/' },
      { name: 'Healthcare Bluebook', url: 'https://www.healthcarebluebook.com/ui/signinpublic' },
      { name: 'MD Save', url: 'https://www.mdsave.com/' },
      { name: 'Colonoscopy Assist', url: 'https://colonoscopyassist.com/' },
    ],
  },
];
