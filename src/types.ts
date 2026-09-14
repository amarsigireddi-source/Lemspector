export type StepType = 'email' | 'linkedin_message' | 'linkedin_visit' | 'linkedin_invite' | 'call' | 'task';

export interface StepStats {
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  interested: number;
  bounced: number;
  unsubscribed: number;
}

export interface CampaignStep {
  id: string;
  stepNumber: number;
  type: StepType;
  subject?: string;
  body: string;
  delayDays: number;
  stats: StepStats;
  // Step-over-step retention calculated relative to previous step's sent/replied
  relativeStats?: {
    dropOffFromPrevSent: number; // percentage % of dropoff from previous step's sent
    stepRetentionRate: number; // percentage % of leads who continued from previous step
    openRate: number; // open %
    replyRate: number; // reply %
    interestedRate: number; // interested %
  };
}

export interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  pictureUrl?: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'running' | 'paused' | 'draft' | 'ended' | 'archived';
  ownerId: string;
  ownerName: string;
  ownerEmail?: string;
  createdAt: string;
  daysRunning: number;
  steps: CampaignStep[];
  aggregateStats: StepStats;
  rates: {
    openRate: number;
    replyRate: number;
    interestedRate: number;
    clickRate: number;
    bounceRate: number;
    unsubRate: number;
  };
}

export interface CampaignContext {
  campaignId: string;
  icp: string; // Description or sample target profile (e.g. "Series A SaaS founders, 10-30 employees, Berlin")
  angle: string; // The hook/angle (e.g. "free 3D office design", "cost-saving pitch")
  expectedReplyBenchmark?: number; // Optional user benchmark %
  expectedInterestedBenchmark?: number; // Optional user benchmark %
  updatedAt: string;
}

export interface CampaignNote {
  id: string;
  campaignId: string;
  stepId?: string;
  author: string;
  content: string;
  timestamp: string;
}

export interface StepDiagnosis {
  stepNumber: number;
  stepId: string;
  performanceLabel: 'Overperforming' | 'Underperforming' | 'Expected' | 'Inconclusive';
  primaryFactor: 'Copy & Tone' | 'Timing & Delay' | 'Targeting/ICP Mismatch' | 'Subject Line' | 'Channel/Format Fit' | 'Value Proposition';
  diagnosis: string;
  retentionAnalysis: string;
  rewrites?: Array<{
    title: string;
    subject?: string;
    body: string;
    rationale: string;
  }>;
}

export interface AIDiagnosis {
  id: string;
  campaignId: string;
  timestamp: string;
  contextSnapshot: CampaignContext;
  confidenceFlag: {
    isLowSample: boolean;
    sampleCount: number;
    message: string;
  };
  sequenceVerdict: {
    summary: string;
    leakStage: string;
    leakExplanation: string;
    angleAlignmentScoreText: string;
  };
  stepDiagnoses: StepDiagnosis[];
  actionableNextSteps: string[];
  industrySanityCheck: {
    disclaimer: string;
    generalBenchmarkComparison: string;
  };
}

export interface CampaignComparisonResult {
  timestamp: string;
  campaignIds: string[];
  comparativeNarrative: string;
  campaignAssessments: Array<{
    campaignId: string;
    campaignName: string;
    goalAlignmentAnalysis: string;
    audienceSpecificNuance: string;
    verdictSummary: string;
  }>;
  transferableInsights: Array<{
    title: string;
    fromCampaign: string;
    toCampaign: string;
    insight: string;
    whyItTransfers: string;
  }>;
  cautionsAgainstDirectComparison: string;
}
