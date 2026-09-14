import { TeamMember, Campaign, CampaignContext, CampaignNote, AIDiagnosis } from './types';

export const SAMPLE_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'usr_alex',
    email: 'alex.vance@outreachpro.io',
    firstName: 'Alex',
    lastName: 'Vance',
    role: 'Head of Outbound',
    pictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr_sara',
    email: 'sara.lin@outreachpro.io',
    firstName: 'Sara',
    lastName: 'Lin',
    role: 'Senior SDR - DACH & UK',
    pictureUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr_marcus',
    email: 'marcus.doe@outreachpro.io',
    firstName: 'Marcus',
    lastName: 'Doe',
    role: 'Enterprise AE',
    pictureUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
];

export const SAMPLE_CAMPAIGNS: Campaign[] = [
  {
    id: 'cam_berlin_saas',
    name: 'Berlin Series A Founders — 3D Office Space Visualizer',
    status: 'active',
    ownerId: 'usr_sara',
    ownerName: 'Sara Lin',
    ownerEmail: 'sara.lin@outreachpro.io',
    createdAt: '2026-06-10T09:00:00.000Z',
    daysRunning: 42,
    aggregateStats: {
      sent: 240,
      opened: 172,
      clicked: 88,
      replied: 31,
      interested: 14,
      bounced: 4,
      unsubscribed: 2,
    },
    rates: {
      openRate: 71.7,
      replyRate: 12.9,
      interestedRate: 5.8,
      clickRate: 36.7,
      bounceRate: 1.7,
      unsubRate: 0.8,
    },
    steps: [
      {
        id: 'stp_berlin_1',
        stepNumber: 1,
        type: 'email',
        subject: 'Quick question about {{companyName}}\'s hybrid setup in Berlin',
        body: `Hi {{firstName}},

Saw that {{companyName}} recently announced your Series A expansion on Tech.eu — huge congrats!

Most founders in Kreuzberg & Mitte I talk to are struggling to balance flexible desks without leasing 400m² of dead space.

We rendered a complimentary 3D virtual floorplan for {{companyName}} showing how to fit 35 desks into a 180m² footprint with modular acoustic pods.

Would you be open to seeing the 90-second 3D layout file?

Best,
Sara`,
        delayDays: 0,
        stats: {
          sent: 240,
          opened: 172,
          clicked: 88,
          replied: 19,
          interested: 10,
          bounced: 4,
          unsubscribed: 1,
        },
        relativeStats: {
          dropOffFromPrevSent: 0,
          stepRetentionRate: 100,
          openRate: 71.7,
          replyRate: 7.9,
          interestedRate: 4.2,
        },
      },
      {
        id: 'stp_berlin_2',
        stepNumber: 2,
        type: 'linkedin_invite',
        subject: undefined,
        body: `Hi {{firstName}}, sent a quick email regarding your Berlin office expansion rendering. Would love to connect here on LinkedIn!`,
        delayDays: 2,
        stats: {
          sent: 217,
          opened: 154,
          clicked: 0,
          replied: 7,
          interested: 3,
          bounced: 0,
          unsubscribed: 0,
        },
        relativeStats: {
          dropOffFromPrevSent: 9.6,
          stepRetentionRate: 90.4,
          openRate: 70.9,
          replyRate: 3.2,
          interestedRate: 1.4,
        },
      },
      {
        id: 'stp_berlin_3',
        stepNumber: 3,
        type: 'email',
        subject: 'Re: Quick question about {{companyName}}\'s hybrid setup in Berlin',
        body: `Hi {{firstName}},

Following up on the 3D floorplan render.

Here is a quick snapshot link: {{customLink_floorplan}}

No strings attached — if you're already locked into a long commercial lease, feel free to ignore. Otherwise, happy to share the editable CAD files if helpful for your ops team.

Sara`,
        delayDays: 3,
        stats: {
          sent: 191,
          opened: 118,
          clicked: 42,
          replied: 5,
          interested: 1,
          bounced: 0,
          unsubscribed: 1,
        },
        relativeStats: {
          dropOffFromPrevSent: 12.0,
          stepRetentionRate: 88.0,
          openRate: 61.8,
          replyRate: 2.6,
          interestedRate: 0.5,
        },
      },
    ],
  },
  {
    id: 'cam_enterprise_cfo',
    name: 'US Enterprise CFOs — ASC 842 Automated Compliance Nurture',
    status: 'active',
    ownerId: 'usr_marcus',
    ownerName: 'Marcus Doe',
    ownerEmail: 'marcus.doe@outreachpro.io',
    createdAt: '2026-05-18T11:30:00.000Z',
    daysRunning: 65,
    aggregateStats: {
      sent: 82,
      opened: 39,
      clicked: 12,
      replied: 3,
      interested: 1,
      bounced: 1,
      unsubscribed: 0,
    },
    rates: {
      openRate: 47.6,
      replyRate: 3.7,
      interestedRate: 1.2,
      clickRate: 14.6,
      bounceRate: 1.2,
      unsubRate: 0.0,
    },
    steps: [
      {
        id: 'stp_cfo_1',
        stepNumber: 1,
        type: 'email',
        subject: 'Audit readiness for {{companyName}}\'s equipment & property leases',
        body: `Dear {{firstName}},

With Q3 audit cycles approaching, many finance leaders at firms like {{companyName}} with $100M+ ARR find their balance sheet footnote calculations for ASC 842 take 60+ manual analyst hours per quarter.

We built an automated extraction bridge that syncs equipment and real-estate schedules directly into NetSuite / SAP with continuous lease modification tracking.

We recently helped Vertex Logistics eliminate $140k in audit reconciliation fees.

Would you be open to a 10-minute executive briefing with our chief accounting officer on Tuesday?

Regards,
Marcus Doe
Enterprise Advisory`,
        delayDays: 0,
        stats: {
          sent: 82,
          opened: 39,
          clicked: 12,
          replied: 2,
          interested: 1,
          bounced: 1,
          unsubscribed: 0,
        },
        relativeStats: {
          dropOffFromPrevSent: 0,
          stepRetentionRate: 100,
          openRate: 47.6,
          replyRate: 2.4,
          interestedRate: 1.2,
        },
      },
      {
        id: 'stp_cfo_2',
        stepNumber: 2,
        type: 'email',
        subject: 'ASC 842 audit memo & benchmarking summary for {{companyName}}',
        body: `Dear {{firstName}},

Wanted to share our 2-page brief on common SEC comment letter traps regarding discount rate selections under ASC 842.

Here is the ungated PDF: {{customLink_audit_guide}}

If this is top of mind for your VP Controller or Director of Technical Accounting, let me know if an introduction makes sense.

Regards,
Marcus`,
        delayDays: 6,
        stats: {
          sent: 79,
          opened: 28,
          clicked: 7,
          replied: 1,
          interested: 0,
          bounced: 0,
          unsubscribed: 0,
        },
        relativeStats: {
          dropOffFromPrevSent: 3.6,
          stepRetentionRate: 96.4,
          openRate: 35.4,
          replyRate: 1.3,
          interestedRate: 0.0,
        },
      },
    ],
  },
  {
    id: 'cam_revops_pilot',
    name: 'Mid-Market VP Sales & RevOps — Pipeline Friction Audit',
    status: 'paused',
    ownerId: 'usr_alex',
    ownerName: 'Alex Vance',
    ownerEmail: 'alex.vance@outreachpro.io',
    createdAt: '2026-07-01T14:00:00.000Z',
    daysRunning: 21,
    aggregateStats: {
      sent: 310,
      opened: 198,
      clicked: 64,
      replied: 14,
      interested: 4,
      bounced: 6,
      unsubscribed: 4,
    },
    rates: {
      openRate: 63.9,
      replyRate: 4.5,
      interestedRate: 1.3,
      clickRate: 20.6,
      bounceRate: 1.9,
      unsubRate: 1.3,
    },
    steps: [
      {
        id: 'stp_revops_1',
        stepNumber: 1,
        type: 'email',
        subject: '{{firstName}}, how {{companyName}}\'s reps spend non-selling time',
        body: `Hey {{firstName}},

Quick question: according to recent RevOps benchmarks, reps at 50-200 person sales teams spend 31% of their day updating CRM opportunity stages and drafting follow-up summaries.

We built an ambient pipeline recorder that automatically logs call snippets and syncs multi-threading contacts.

Are you open to seeing how our pilot team saved 4.5 hrs/rep/week?

Cheers,
Alex`,
        delayDays: 0,
        stats: {
          sent: 310,
          opened: 198,
          clicked: 64,
          replied: 8,
          interested: 2,
          bounced: 6,
          unsubscribed: 2,
        },
        relativeStats: {
          dropOffFromPrevSent: 0,
          stepRetentionRate: 100,
          openRate: 63.9,
          replyRate: 2.6,
          interestedRate: 0.6,
        },
      },
      {
        id: 'stp_revops_2',
        stepNumber: 2,
        type: 'email',
        subject: 'Re: {{firstName}}, how {{companyName}}\'s reps spend non-selling time',
        body: `Hi {{firstName}},

Thought I'd share this 45-second Loom showing our auto-logging workflow with HubSpot & Salesforce: {{loomLink}}

Let me know if you'd like a test workspace for 2 reps on your team.

Alex`,
        delayDays: 3,
        stats: {
          sent: 296,
          opened: 145,
          clicked: 38,
          replied: 4,
          interested: 1,
          bounced: 0,
          unsubscribed: 1,
        },
        relativeStats: {
          dropOffFromPrevSent: 4.5,
          stepRetentionRate: 95.5,
          openRate: 49.0,
          replyRate: 1.4,
          interestedRate: 0.3,
        },
      },
      {
        id: 'stp_revops_3',
        stepNumber: 3,
        type: 'call',
        subject: 'Cold call outreach step',
        body: `Call Script:
1. Reference previous Loom video sent on Tuesday.
2. Confirm if rep administrative time in Salesforce is currently a top 3 friction point for Q3.
3. Offer no-commitment 14-day sandbox on sandbox CRM environment.`,
        delayDays: 2,
        stats: {
          sent: 240,
          opened: 240,
          clicked: 0,
          replied: 2,
          interested: 1,
          bounced: 0,
          unsubscribed: 1,
        },
        relativeStats: {
          dropOffFromPrevSent: 18.9,
          stepRetentionRate: 81.1,
          openRate: 100,
          replyRate: 0.8,
          interestedRate: 0.4,
        },
      },
    ],
  },
];

export const INITIAL_CONTEXTS: Record<string, CampaignContext> = {
  cam_berlin_saas: {
    campaignId: 'cam_berlin_saas',
    icp: 'Series A SaaS founders & Co-founders in Berlin (Kreuzberg, Mitte, Prenzlauer Berg), company headcount 10-35 employees, recently raised capital.',
    angle: 'Hyper-personalized complimentary 3D architectural floorplan & acoustic pod layout preventing expensive long-term lease commitments.',
    expectedReplyBenchmark: 10,
    expectedInterestedBenchmark: 4,
    updatedAt: '2026-06-15T10:00:00.000Z',
  },
  cam_enterprise_cfo: {
    campaignId: 'cam_enterprise_cfo',
    icp: 'Enterprise Chief Financial Officers, Chief Accounting Officers, and VP Controllers at US enterprises with $100M+ ARR and 500+ employees.',
    angle: 'ASC 842 lease accounting compliance automation & SEC comment letter audit risk mitigation before Q3 audit cycle.',
    expectedReplyBenchmark: 3,
    expectedInterestedBenchmark: 1,
    updatedAt: '2026-05-20T14:30:00.000Z',
  },
  // Note: cam_revops_pilot intentionally has NO INITIAL CONTEXT to test and demonstrate the "Unweighted / Context Pending" flag!
};

export const INITIAL_NOTES: CampaignNote[] = [
  {
    id: 'not_1',
    campaignId: 'cam_berlin_saas',
    stepId: 'stp_berlin_1',
    author: 'Sara Lin',
    content: 'Changed subject line from "Office space query" to "Quick question about {{companyName}}\'s hybrid setup in Berlin" on June 22. Open rate jumped from 54% to 71%!',
    timestamp: '2026-06-22T16:00:00.000Z',
  },
  {
    id: 'not_2',
    campaignId: 'cam_enterprise_cfo',
    stepId: 'stp_cfo_1',
    author: 'Marcus Doe',
    content: 'Enterprise CFOs have high gatekeepers; added ungated audit memo in Step 2 to build credibility before asking for phone time.',
    timestamp: '2026-06-01T11:00:00.000Z',
  },
];
