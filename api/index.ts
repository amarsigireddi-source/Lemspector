// Lemspector API: Lemlist proxy + Gemini analysis.
// On Vercel this file runs as a serverless function (see vercel.json);
// locally and on other Node hosts it is mounted by ../server.ts.
import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createHash } from 'crypto';
import type { AIDiagnosis } from '../src/types';

dotenv.config();

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. AI capabilities will fail gracefully.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || 'dummy-key',
    });
  }
  return aiClient;
}

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // API Route: Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const getLemlistKey = (req?: Request): string => {
    // Keys always come from the visitor (header or JSON body), never from the server
    // environment or URL query strings, so every user only ever sees their own workspace.
    const headerKey = req?.headers?.['x-lemlist-api-key'] as string;
    const bodyKey = req?.body?.apiKey as string;
    return (headerKey || bodyKey || '').trim();
  };

  // Helper to convert HTML email body to readable text
  const cleanEmailHtml = (html?: string): string => {
    if (!html) return 'No copy provided';
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  // Lemlist API Proxy Helper
  const makeLemlistRequest = async (endpoint: string, apiKey?: string, method = 'GET', body?: any) => {
    const cleanKey = (apiKey || '').trim();
    if (!cleanKey) {
      throw new Error('Connect your Lemlist API key to load live campaigns.');
    }
    const basicAuth = Buffer.from(`:${cleanKey}`).toString('base64');
    
    // Try Basic auth first (standard for Lemlist REST API)
    const url = endpoint.startsWith('http') ? endpoint : `https://api.lemlist.com/api${endpoint}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Basic ${basicAuth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    let response: globalThis.Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new Error('Could not reach Lemlist right now. Please try again in a moment.');
    }

    if (!response.ok) {
      // If 401, also try Bearer header fallback
      if (response.status === 401) {
        const bearerResponse = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${cleanKey}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        if (bearerResponse.ok) {
          return await bearerResponse.json();
        }
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Lemlist rejected this API key. Double-check it in Lemlist → Settings → Integrations → API.');
      }
      if (response.status === 404) {
        throw new Error('Not found in this Lemlist workspace. Make sure the campaign belongs to the account of this API key.');
      }
      if (response.status === 429) {
        throw new Error('Lemlist rate limit reached. Please wait a few seconds and try again.');
      }
      const errText = await response.text();
      throw new Error(`Lemlist API error (${response.status}): ${errText || response.statusText}`);
    }

    return await response.json();
  };

  // Every Lemlist proxy route needs the visitor's own key
  app.use('/api/lemlist', (req: Request, res: Response, next) => {
    if (!getLemlistKey(req)) {
      res.status(401).json({ success: false, code: 'NO_API_KEY', error: 'Connect your Lemlist API key to load live campaigns.' });
      return;
    }
    next();
  });

  // API Route: Test Lemlist API Key Connection
  app.post('/api/lemlist/test-connection', async (req: Request, res: Response) => {
    const apiKey = getLemlistKey(req);
    if (!apiKey) {
      res.status(400).json({ success: false, error: 'Lemlist API key is required' });
      return;
    }

    try {
      // Fetch team endpoint to verify key
      const teamData = await makeLemlistRequest('/team', apiKey);
      res.json({ success: true, team: teamData, activeKeyPreview: apiKey.slice(0, 6) + '...' });
    } catch (err: any) {
      console.error('Lemlist connection test failed:', err.message);
      res.status(401).json({ success: false, error: err.message });
    }
  });

  // API Route: Get Lemlist Team & Members
  app.get('/api/lemlist/team', async (req: Request, res: Response) => {
    const apiKey = getLemlistKey(req);
    try {
      const teamData = await makeLemlistRequest('/team', apiKey);
      res.json(teamData);
    } catch (err: any) {
      console.error('Error fetching Lemlist team:', err.message);
      res.status(/API key/.test(err.message) ? 401 : /Not found/.test(err.message) ? 404 : 500).json({ error: err.message });
    }
  });

  // Short-lived in-memory cache to prevent Lemlist rate-limiting (30s TTL)
  // Keyed by a hash of the API key so each workspace gets its own cache entry.
  const campaignCache = new Map<string, { timestamp: number; data: any[] }>();
  const cacheKeyFor = (apiKey: string) => createHash('sha256').update(apiKey).digest('hex');

  // Helper: Fetch all campaigns across pages from Lemlist API (Uncapped pagination)
  async function fetchAllLemlistCampaigns(apiKey: string): Promise<any[]> {
    let allCampaigns: any[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    let maxPages = 15; // safety cap for 1,500 campaigns

    while (hasMore && maxPages > 0) {
      maxPages--;
      try {
        const pageData = await makeLemlistRequest(`/campaigns?offset=${offset}&limit=${limit}`, apiKey);
        if (Array.isArray(pageData) && pageData.length > 0) {
          allCampaigns = allCampaigns.concat(pageData);
          if (pageData.length < limit) {
            hasMore = false;
          } else {
            offset += limit;
          }
        } else {
          hasMore = false;
        }
      } catch (err: any) {
        console.error(`Error fetching campaigns at offset ${offset}:`, err.message);
        hasMore = false;
      }
    }

    return allCampaigns;
  }

  // API Route: Get Lemlist Campaigns with enriched sequence steps & stats (Uncapped / Latest)
  app.get('/api/lemlist/campaigns', async (req: Request, res: Response) => {
    const apiKey = getLemlistKey(req);
    const forceFresh = req.query.fresh === 'true';
    const cacheId = cacheKeyFor(apiKey);
    const cachedCampaigns = campaignCache.get(cacheId);
    const limitQuery = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    if (!forceFresh && cachedCampaigns && (Date.now() - cachedCampaigns.timestamp < 30000)) {
      if (limitQuery && limitQuery > 0) {
        res.json(cachedCampaigns.data.slice(0, limitQuery));
      } else {
        res.json(cachedCampaigns.data);
      }
      return;
    }

    try {
      // 1. Fetch all campaigns across all offsets (Uncapped)
      const allCampaignsList = await fetchAllLemlistCampaigns(apiKey);
      if (!Array.isArray(allCampaignsList) || allCampaignsList.length === 0) {
        res.json([]);
        return;
      }

      // 2. Map all campaigns (set status to archived if archived: true)
      const mappedCampaigns = allCampaignsList.map((c: any) => ({
        ...c,
        status: c.archived ? 'archived' : (c.status || 'draft'),
      }));

      // 3. Sort strictly by latest createdAt descending (newest campaigns first)
      mappedCampaigns.sort((a: any, b: any) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        if (timeB !== timeA) return timeB - timeA;
        if (a.status === 'running' && b.status !== 'running') return -1;
        if (b.status === 'running' && a.status !== 'running') return 1;
        return 0;
      });

      // 4. Enrich top campaigns with sequences and activity statistics (first 15 campaigns or running)
      const enrichedCampaigns = await Promise.all(
        mappedCampaigns.map(async (c: any, index: number) => {
          let steps: any[] = [];
          const campaignId = c._id || c.id;

          // Only do sequence and activity calls for top 12 campaigns or running ones to keep response fast
          if (index < 12 || c.status === 'running') {
            // 1. Fetch sequence steps
            try {
              const seqData = await makeLemlistRequest(`/campaigns/${campaignId}/sequences`, apiKey);
              const firstSeqKey = Object.keys(seqData || {})[0];
              const rawSteps = seqData?.[firstSeqKey]?.steps || seqData?.steps || [];
              
              if (Array.isArray(rawSteps) && rawSteps.length > 0) {
                steps = rawSteps.map((s: any, idx: number) => ({
                  id: s._id || s.id || `stp_${idx + 1}`,
                  stepNumber: (s.sequenceStep !== undefined ? s.sequenceStep : idx) + 1,
                  type: s.type || 'email',
                  subject: s.subject || '',
                  body: cleanEmailHtml(s.message || s.body || ''),
                  delayDays: s.delay !== undefined ? s.delay : (idx === 0 ? 0 : 2),
                  stats: {
                    sent: 0,
                    opened: 0,
                    clicked: 0,
                    replied: 0,
                    interested: 0,
                    bounced: 0,
                    unsubscribed: 0,
                  },
                }));
              }
            } catch (seqErr) {
              // Sequence fetch fallback
            }

            // 2. Fetch campaign activities to calculate real step-level and aggregate stats
            let totalSent = 0;
            let totalOpened = 0;
            let totalClicked = 0;
            let totalReplied = 0;
            let totalInterested = 0;
            let totalBounced = 0;
            let totalUnsub = 0;

            try {
              const activities = await makeLemlistRequest(`/activities?campaignId=${campaignId}&limit=150`, apiKey);
              if (Array.isArray(activities)) {
                activities.forEach((act: any) => {
                  const stepIdx = act.sequenceStep !== undefined ? act.sequenceStep : 0;
                  const actType = act.type || '';

                  if (actType === 'emailsSent') totalSent++;
                  else if (actType === 'emailsOpened') totalOpened++;
                  else if (actType === 'emailsClicked') totalClicked++;
                  else if (actType === 'emailsReplied') totalReplied++;
                  else if (actType === 'emailsInterested') totalInterested++;
                  else if (actType === 'emailsBounced') totalBounced++;
                  else if (actType === 'emailsUnsubscribed') totalUnsub++;

                  // Map to step
                  if (steps[stepIdx]) {
                    if (actType === 'emailsSent') steps[stepIdx].stats.sent++;
                    else if (actType === 'emailsOpened') steps[stepIdx].stats.opened++;
                    else if (actType === 'emailsClicked') steps[stepIdx].stats.clicked++;
                    else if (actType === 'emailsReplied') steps[stepIdx].stats.replied++;
                    else if (actType === 'emailsInterested') steps[stepIdx].stats.interested++;
                    else if (actType === 'emailsBounced') steps[stepIdx].stats.bounced++;
                    else if (actType === 'emailsUnsubscribed') steps[stepIdx].stats.unsubscribed++;
                  }
                });
              }
            } catch (actErr) {
              // Activities fetch fallback
            }

            // If no steps were found from sequence API, create default step structure
            if (steps.length === 0) {
              steps = [
                {
                  id: `stp_${campaignId}_1`,
                  stepNumber: 1,
                  type: 'email',
                  subject: c.name || 'Outreach Step 1',
                  body: 'Initial touch point in Lemlist campaign.',
                  delayDays: 0,
                  stats: {
                    sent: totalSent || 0,
                    opened: totalOpened,
                    clicked: totalClicked,
                    replied: totalReplied,
                    interested: totalInterested,
                    bounced: totalBounced,
                    unsubscribed: totalUnsub,
                  },
                },
              ];
            } else {
              if (steps[0].stats.sent === 0 && totalSent > 0) {
                steps[0].stats.sent = totalSent;
                steps[0].stats.opened = totalOpened;
                steps[0].stats.replied = totalReplied;
                steps[0].stats.interested = totalInterested;
              }
            }

            return {
              ...c,
              enrichedSteps: steps,
              calculatedStats: {
                sent: totalSent,
                opened: totalOpened,
                clicked: totalClicked,
                replied: totalReplied,
                interested: totalInterested,
                bounced: totalBounced,
                unsubscribed: totalUnsub,
              },
            };
          }

          // For remaining campaigns in the full inventory, return standard structure
          return {
            ...c,
            enrichedSteps: [
              {
                id: `stp_${campaignId}_1`,
                stepNumber: 1,
                type: 'email',
                subject: c.name || 'Step 1',
                body: 'Campaign step configured in Lemlist.',
                delayDays: 0,
                stats: {
                  sent: 0,
                  opened: 0,
                  clicked: 0,
                  replied: 0,
                  interested: 0,
                  bounced: 0,
                  unsubscribed: 0,
                },
              },
            ],
            calculatedStats: {
              sent: 0,
              opened: 0,
              clicked: 0,
              replied: 0,
              interested: 0,
              bounced: 0,
              unsubscribed: 0,
            },
          };
        })
      );

      campaignCache.set(cacheId, {
        timestamp: Date.now(),
        data: enrichedCampaigns,
      });
      // Drop stale entries so memory doesn't grow with visitors
      for (const [k, v] of campaignCache) {
        if (Date.now() - v.timestamp > 5 * 60 * 1000) campaignCache.delete(k);
      }

      if (limitQuery && limitQuery > 0) {
        res.json(enrichedCampaigns.slice(0, limitQuery));
      } else {
        res.json(enrichedCampaigns);
      }
    } catch (err: any) {
      console.error('Error fetching Lemlist campaigns:', err.message);
      res.status(/API key/.test(err.message) ? 401 : /Not found/.test(err.message) ? 404 : 500).json({ error: err.message });
    }
  });

  // API Route: Get Single Campaign Details & Sequences (Full Enrichment)
  app.get('/api/lemlist/campaigns/:campaignId', async (req: Request, res: Response) => {
    const apiKey = getLemlistKey(req);
    let { campaignId } = req.params;

    // Clean up if user passed full URL or prefixed ID
    if (campaignId.includes('/')) {
      const parts = campaignId.split('/');
      const camPart = parts.find(p => p.startsWith('cam_'));
      if (camPart) campaignId = camPart;
      else campaignId = parts[parts.length - 1];
    }
    campaignId = campaignId.trim();

    try {
      const campaign = await makeLemlistRequest(`/campaigns/${campaignId}`, apiKey);
      let steps: any[] = [];

      // 1. Fetch sequence steps
      try {
        const seqData = await makeLemlistRequest(`/campaigns/${campaignId}/sequences`, apiKey);
        const firstSeqKey = Object.keys(seqData || {})[0];
        const rawSteps = seqData?.[firstSeqKey]?.steps || seqData?.steps || [];
        
        if (Array.isArray(rawSteps) && rawSteps.length > 0) {
          steps = rawSteps.map((s: any, idx: number) => ({
            id: s._id || s.id || `stp_${idx + 1}`,
            stepNumber: (s.sequenceStep !== undefined ? s.sequenceStep : idx) + 1,
            type: s.type || 'email',
            subject: s.subject || '',
            body: cleanEmailHtml(s.message || s.body || ''),
            delayDays: s.delay !== undefined ? s.delay : (idx === 0 ? 0 : 2),
            stats: {
              sent: 0,
              opened: 0,
              clicked: 0,
              replied: 0,
              interested: 0,
              bounced: 0,
              unsubscribed: 0,
            },
          }));
        }
      } catch (seqErr) {
        // Sequence fetch fallback
      }

      // 2. Fetch campaign activities to calculate real step-level and aggregate stats
      let totalSent = 0;
      let totalOpened = 0;
      let totalClicked = 0;
      let totalReplied = 0;
      let totalInterested = 0;
      let totalBounced = 0;
      let totalUnsub = 0;

      try {
        const activities = await makeLemlistRequest(`/activities?campaignId=${campaignId}&limit=200`, apiKey);
        if (Array.isArray(activities)) {
          activities.forEach((act: any) => {
            const stepIdx = act.sequenceStep !== undefined ? act.sequenceStep : 0;
            const actType = act.type || '';

            if (actType === 'emailsSent') totalSent++;
            else if (actType === 'emailsOpened') totalOpened++;
            else if (actType === 'emailsClicked') totalClicked++;
            else if (actType === 'emailsReplied') totalReplied++;
            else if (actType === 'emailsInterested') totalInterested++;
            else if (actType === 'emailsBounced') totalBounced++;
            else if (actType === 'emailsUnsubscribed') totalUnsub++;

            // Map to step
            if (steps[stepIdx]) {
              if (actType === 'emailsSent') steps[stepIdx].stats.sent++;
              else if (actType === 'emailsOpened') steps[stepIdx].stats.opened++;
              else if (actType === 'emailsClicked') steps[stepIdx].stats.clicked++;
              else if (actType === 'emailsReplied') steps[stepIdx].stats.replied++;
              else if (actType === 'emailsInterested') steps[stepIdx].stats.interested++;
              else if (actType === 'emailsBounced') steps[stepIdx].stats.bounced++;
              else if (actType === 'emailsUnsubscribed') steps[stepIdx].stats.unsubscribed++;
            }
          });
        }
      } catch (actErr) {
        // Activities fetch fallback
      }

      if (steps.length === 0) {
        steps = [
          {
            id: `stp_${campaignId}_1`,
            stepNumber: 1,
            type: 'email',
            subject: campaign.name || 'Outreach Step 1',
            body: 'Initial touch point in Lemlist campaign.',
            delayDays: 0,
            stats: {
              sent: totalSent || 1,
              opened: totalOpened,
              clicked: totalClicked,
              replied: totalReplied,
              interested: totalInterested,
              bounced: totalBounced,
              unsubscribed: totalUnsub,
            },
          },
        ];
      } else {
        if (steps[0].stats.sent === 0 && totalSent > 0) {
          steps[0].stats.sent = totalSent;
          steps[0].stats.opened = totalOpened;
          steps[0].stats.replied = totalReplied;
          steps[0].stats.interested = totalInterested;
        }
      }

      res.json({
        ...campaign,
        enrichedSteps: steps,
        calculatedStats: {
          sent: totalSent,
          opened: totalOpened,
          clicked: totalClicked,
          replied: totalReplied,
          interested: totalInterested,
          bounced: totalBounced,
          unsubscribed: totalUnsub,
        },
      });
    } catch (err: any) {
      console.error(`Error fetching Lemlist campaign ${campaignId}:`, err.message);
      res.status(/API key/.test(err.message) ? 401 : /Not found/.test(err.message) ? 404 : 500).json({ error: err.message });
    }
  });

  // Heuristic rule-based diagnosis fallback if Gemini API key is not configured in Cloud Run
  const generateFallbackDiagnosis = (campaign: any, context: any, notes: any[], pastVerdicts: any[]): AIDiagnosis => {
    const sent = campaign.aggregateStats?.sent || 0;
    const replyRate = campaign.rates?.replyRate || 0;
    const openRate = campaign.rates?.openRate || 0;
    const interestedRate = campaign.rates?.interestedRate || 0;
    const isLowSample = sent < 50;

    const expectedReply = context.expectedReplyBenchmark ? parseFloat(context.expectedReplyBenchmark) : (context.icp.toLowerCase().includes('enterprise') || context.icp.toLowerCase().includes('c-level') ? 3.0 : 6.0);

    let leakStage = 'Initial Engagement (Step 1)';
    let leakExplanation = `Initial responses to "${context.angle}" for ${context.icp} show that prospects need lower friction in the initial hook.`;
    if (openRate < 40) {
      leakStage = 'Deliverability & Subject Line Cutoff';
      leakExplanation = `Open rate of ${openRate}% is below target for ${context.icp}. Likely subject line lacks curiosity or sender domain warming needs attention.`;
    } else if (replyRate < expectedReply && openRate >= 50) {
      leakStage = 'Copy Value Proposition Gap (Step 1 -> Step 2)';
      leakExplanation = `Prospects are opening (${openRate}%), but not replying (${replyRate}% vs target ${expectedReply}%). The value hook "${context.angle}" may ask for too much commitment too early.`;
    } else if (replyRate >= expectedReply) {
      leakStage = 'Mid-Sequence Retention';
      leakExplanation = `Strong initial alignment with ${context.icp} (${replyRate}% reply rate). Main opportunity is sustaining momentum into qualified calls across later steps.`;
    }

    const stepDiagnoses = (campaign.steps || []).map((step: any, idx: number) => {
      const isStep1 = idx === 0;
      const stepReplies = step.stats?.replied || 0;
      const stepSent = step.stats?.sent || 0;
      const stepRate = stepSent > 0 ? ((stepReplies / stepSent) * 100).toFixed(1) : '0.0';

      return {
        stepNumber: step.stepNumber || idx + 1,
        stepId: step.id || `stp_${idx + 1}`,
        performanceLabel: (replyRate >= expectedReply ? (isStep1 ? 'Overperforming' : 'Expected') : (isStep1 ? 'Underperforming' : 'Expected')) as any,
        primaryFactor: isStep1 ? (openRate < 45 ? 'Subject Line' : 'Value Proposition') : (step.delayDays < 2 ? 'Timing & Delay' : 'Copy & Tone'),
        diagnosis: isStep1
          ? `Step 1 anchors the sequence around "${context.angle}". Aimed at ${context.icp}. Currently converting ${stepReplies} replies out of ${stepSent} sent (${stepRate}%).`
          : `Step ${idx + 1} follow-up after ${step.delayDays || 2} days. It should pivot the angle rather than merely checking in.`,
        retentionAnalysis: isStep1 ? 'Baseline step establishing initial audience resonance.' : `Retains prospect attention following step ${idx}.`,
        rewrites: [
          {
            title: `Alternative A (Frictionless hook for ${context.icp.slice(0, 25)})`,
            subject: step.subject ? `Quick thought on ${context.angle.slice(0, 30)}` : undefined,
            body: `Hi {{firstName}},\n\nSaw that you're leading outbound at {{companyName}}. When speaking with other ${context.icp.slice(0, 30)} teams, the biggest friction with ${context.angle.slice(0, 25)} is usually implementation timing.\n\nWe benchmarked how similar teams solve this—mind if I send over a 2-page brief?\n\nBest,\n{{senderName}}`,
            rationale: `Reduces cognitive load by offering a frictionless benchmark before asking for a 30-minute meeting.`
          }
        ]
      };
    });

    return {
      id: `diag_${Date.now()}`,
      campaignId: campaign.id,
      timestamp: new Date().toISOString(),
      contextSnapshot: context,
      confidenceFlag: {
        isLowSample,
        sampleCount: sent,
        message: isLowSample
          ? `⚠️ Low sample size alert (${sent} leads sent). Outbound metrics require at least 50-100 delivered contacts to yield statistically reliable conclusions for ${context.icp}.`
          : `Confident sample size (${sent} leads sent). Data volume is sufficient to evaluate angle resonance against ${context.icp}.`,
      },
      sequenceVerdict: {
        summary: `Evaluated strictly against stated ICP (${context.icp}) and Angle (${context.angle}). Current motion shows ${replyRate}% reply rate and ${interestedRate}% interested rate.`,
        leakStage,
        leakExplanation,
        angleAlignmentScoreText: replyRate >= expectedReply ? 'Strong Contextual Alignment' : 'Moderate Alignment — Value Friction Identified',
      },
      stepDiagnoses,
      actionableNextSteps: [
        `Test a soft, permission-based call-to-action on Step 1 calibrated specifically for ${context.icp}.`,
        `Ensure Step 2 provides a differentiated micro-insight instead of a generic check-in.`,
        `Track open rates across distinct sender mailboxes as volume expands.`
      ],
      industrySanityCheck: {
        disclaimer: 'Industry average context (secondary anchor):',
        generalBenchmarkComparison: `Cold B2B reply rates typically range from 2.5% to 8% depending heavily on seniority and market segment. Contextual fit with ${context.icp} is the true measure of success.`,
      },
    };
  };

  // Heuristic rule-based comparison fallback
  const generateFallbackComparison = (campaigns: any[]) => {
    return {
      timestamp: new Date().toISOString(),
      campaignIds: campaigns.map((c: any) => c.campaign.id),
      comparativeNarrative: `Comparative evaluation of ${campaigns.length} motions, assessing each campaign against its stated ICP and sequence angle rather than misleading aggregate volume ranking.`,
      campaignAssessments: campaigns.map((item: any) => ({
        campaignId: item.campaign.id,
        campaignName: item.campaign.name,
        icp: item.context.icp,
        angle: item.context.angle,
        motionMaturityScore: Math.min(95, Math.max(40, Math.round(item.campaign.rates.replyRate * 12 + item.campaign.aggregateStats.sent * 0.05))),
        contextualVerdict: `For ${item.context.icp} with hook "${item.context.angle}", generated ${item.campaign.rates.replyRate}% replies across ${item.campaign.aggregateStats.sent} contacts.`
      })),
      transferableInsights: [
        {
          title: 'Permission-Based CTA Transfer',
          fromCampaign: campaigns[0].campaign.name,
          toCampaign: campaigns[1]?.campaign.name || campaigns[0].campaign.name,
          insight: 'Framing initial requests around sharing relevant data reduces conversational friction.',
          whyItTransfers: 'Senior decision makers resist calendar invites without prior value proof.'
        }
      ],
      cautionsAgainstDirectComparison: `Caution: Direct raw comparison between different target personas is misleading. High-tier executive ICPs inherently show lower reply rates but generate significantly higher pipeline value.`
    };
  };

  // API Route: Gemini Context-Aware Campaign Sequence Analysis
  app.post('/api/analyze/campaign', async (req: Request, res: Response) => {
    const { campaign, context, notes, pastVerdicts } = req.body;

    if (!campaign) {
      res.status(400).json({ error: 'Campaign payload is required' });
      return;
    }

    if (!context || !context.icp || !context.angle) {
      res.status(400).json({
        error: 'Target Profile / ICP and Sequence Angle context are required before AI analysis can run. A cold outbound campaign to founders and enterprise CFO nurture cannot be evaluated without context.',
      });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const hasGeminiKey = Boolean(apiKey && apiKey !== 'dummy-key' && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10);

    if (!hasGeminiKey) {
      const fallback = generateFallbackDiagnosis(campaign, context, notes, pastVerdicts);
      res.json(fallback);
      return;
    }

    try {
      const ai = getAIClient();

      const prompt = `
You are the world's most rigorous B2B Outbound & Sequence Strategy Analyst ("Lemlist Sequence Analyst").

CRITICAL DIRECTIVE:
You must NOT benchmark or evaluate this campaign against generic outbound industry averages (e.g. "average reply rate is 3%").
Instead, you MUST reason strictly from the stated TARGET ICP and SEQUENCE ANGLE/HOOK to interpret what a good outcome looks like for THIS specific motion.

Campaign Context:
- Campaign Name: ${campaign.name}
- Status: ${campaign.status} (Days running: ${campaign.daysRunning})
- Target Profile / ICP: "${context.icp}"
- Sequence Angle / Hook: "${context.angle}"
${context.expectedReplyBenchmark ? `- Human Anchor / Expected Reply Benchmark: ${context.expectedReplyBenchmark}%` : ''}
${context.expectedInterestedBenchmark ? `- Human Anchor / Expected Interested Benchmark: ${context.expectedInterestedBenchmark}%` : ''}

Raw Aggregate Stats:
- Sent: ${campaign.aggregateStats.sent}
- Opened: ${campaign.aggregateStats.opened} (${campaign.rates.openRate}%)
- Clicked: ${campaign.aggregateStats.clicked} (${campaign.rates.clickRate}%)
- Replied: ${campaign.aggregateStats.replied} (${campaign.rates.replyRate}%)
- Interested / Positive: ${campaign.aggregateStats.interested} (${campaign.rates.interestedRate}%)
- Bounced: ${campaign.aggregateStats.bounced} (${campaign.rates.bounceRate}%)
- Unsubscribed: ${campaign.aggregateStats.unsubscribed} (${campaign.rates.unsubRate}%)

Full Step-by-Step Sequence with Copy & Relative Drop-offs:
${JSON.stringify(campaign.steps, null, 2)}

User Notes & Experiment History:
${notes && notes.length > 0 ? JSON.stringify(notes, null, 2) : 'No prior notes logged.'}

Past AI Verdicts / Changes:
${pastVerdicts && pastVerdicts.length > 0 ? JSON.stringify(pastVerdicts, null, 2) : 'First analysis run.'}

Required Deliverables:
1. Confidence Flag: If sent count < 50, flag as low sample size with a clear warning caveat rather than rating with false precision.
2. Sequence-Level Verdict: Identify exactly WHERE the funnel is leaking (e.g. deliverability/subject lines, initial friction, or drop-off after step 2). State how well the angle resonates with this specific ICP.
3. Per-Step Diagnosis: For each step, evaluate performance relative to its position and previous step drop-off. State primary factor (Copy & Tone, Timing & Delay, Targeting/ICP Mismatch, Subject Line, Channel/Format Fit, Value Proposition).
4. Concrete Rewrites: For underperforming steps, provide 1-2 sharp, tailored rewrite alternatives (subject line & body) specifically calibrated to this ICP.
5. Actionable Next Steps: 3-4 bullet points.
6. Industry Sanity Check: A brief secondary sanity check clearly labeled as secondary context.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              confidenceFlag: {
                type: Type.OBJECT,
                properties: {
                  isLowSample: { type: Type.BOOLEAN },
                  sampleCount: { type: Type.INTEGER },
                  message: { type: Type.STRING },
                },
                required: ['isLowSample', 'sampleCount', 'message'],
              },
              sequenceVerdict: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING },
                  leakStage: { type: Type.STRING },
                  leakExplanation: { type: Type.STRING },
                  angleAlignmentScoreText: { type: Type.STRING },
                },
                required: ['summary', 'leakStage', 'leakExplanation', 'angleAlignmentScoreText'],
              },
              stepDiagnoses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stepNumber: { type: Type.INTEGER },
                    stepId: { type: Type.STRING },
                    performanceLabel: {
                      type: Type.STRING,
                      description: "Must be 'Overperforming', 'Underperforming', 'Expected', or 'Inconclusive'",
                    },
                    primaryFactor: {
                      type: Type.STRING,
                      description: "One of 'Copy & Tone', 'Timing & Delay', 'Targeting/ICP Mismatch', 'Subject Line', 'Channel/Format Fit', 'Value Proposition'",
                    },
                    diagnosis: { type: Type.STRING },
                    retentionAnalysis: { type: Type.STRING },
                    rewrites: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          subject: { type: Type.STRING },
                          body: { type: Type.STRING },
                          rationale: { type: Type.STRING },
                        },
                        required: ['title', 'body', 'rationale'],
                      },
                    },
                  },
                  required: ['stepNumber', 'stepId', 'performanceLabel', 'primaryFactor', 'diagnosis', 'retentionAnalysis'],
                },
              },
              actionableNextSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              industrySanityCheck: {
                type: Type.OBJECT,
                properties: {
                  disclaimer: { type: Type.STRING },
                  generalBenchmarkComparison: { type: Type.STRING },
                },
                required: ['disclaimer', 'generalBenchmarkComparison'],
              },
            },
            required: ['confidenceFlag', 'sequenceVerdict', 'stepDiagnoses', 'actionableNextSteps', 'industrySanityCheck'],
          },
        },
      });

      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText);

      const aiDiagnosis: AIDiagnosis = {
        id: `diag_${Date.now()}`,
        campaignId: campaign.id,
        timestamp: new Date().toISOString(),
        contextSnapshot: context,
        confidenceFlag: parsedData.confidenceFlag,
        sequenceVerdict: parsedData.sequenceVerdict,
        stepDiagnoses: parsedData.stepDiagnoses,
        actionableNextSteps: parsedData.actionableNextSteps,
        industrySanityCheck: parsedData.industrySanityCheck,
      };

      res.json(aiDiagnosis);
    } catch (err: any) {
      console.warn('Gemini API call failed, generating contextual rule-based fallback diagnosis:', err.message);
      const fallback = generateFallbackDiagnosis(campaign, context, notes, pastVerdicts);
      res.json(fallback);
    }
  });

  // API Route: Gemini Qualitative Comparative Narrative
  app.post('/api/analyze/compare', async (req: Request, res: Response) => {
    const { campaigns } = req.body;

    if (!campaigns || !Array.isArray(campaigns) || campaigns.length < 2) {
      res.status(400).json({ error: 'At least 2 campaigns are required for comparison.' });
      return;
    }

    // Verify context is provided for all compared campaigns
    const missingContext = campaigns.filter(c => !c.context || !c.context.icp || !c.context.angle);
    if (missingContext.length > 0) {
      res.status(400).json({
        error: `Cannot run comparison: ${missingContext.map(c => c.campaign.name).join(', ')} is missing ICP or Angle context. All campaigns must have context set before qualitative comparison.`,
      });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const hasGeminiKey = Boolean(apiKey && apiKey !== 'dummy-key' && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10);

    if (!hasGeminiKey) {
      const fallback = generateFallbackComparison(campaigns);
      res.json(fallback);
      return;
    }

    try {
      const ai = getAIClient();

      const campaignSummaries = campaigns.map((item: any, idx: number) => `
Campaign ${idx + 1}: ${item.campaign.name}
- Status: ${item.campaign.status} (Running: ${item.campaign.daysRunning} days)
- Stated ICP / Target Profile: "${item.context.icp}"
- Stated Sequence Angle: "${item.context.angle}"
- Raw Stats: Sent ${item.campaign.aggregateStats.sent} | Open ${item.campaign.rates.openRate}% | Reply ${item.campaign.rates.replyRate}% | Interested ${item.campaign.rates.interestedRate}%
- Steps Summary:
${item.campaign.steps.map((s: any) => `  * Step ${s.stepNumber} (${s.type}, delay ${s.delayDays}d): "${s.subject || 'No subject'}" -> Sent ${s.stats.sent}, Replied ${s.stats.replied}`).join('\n')}
- Notes: ${item.notes ? item.notes.map((n: any) => n.content).join('; ') : 'None'}
`).join('\n---\n');

      const prompt = `
You are the Lemlist Sequence Analyst conducting a Context-Aware Multi-Campaign Comparison.

CRITICAL INSTRUCTIONS:
1. DO NOT output a single normalized numeric score or rank across campaigns.
2. Produce a deep QUALITATIVE COMPARATIVE NARRATIVE.
3. Given that Campaign A targets a specific ICP with an angle and Campaign B targets a completely different audience with a different angle, evaluate how each is performing RELATIVE TO ITS OWN STATED GOAL.
4. Uncover what, if anything, is GENUINELY TRANSFERABLE between them (e.g. subject line framing, delay cadence, value-first asset offer) despite the audience differences.
5. Provide explicit cautions against direct surface-level stat comparisons (e.g. why an enterprise CFO reply rate cannot be compared to early-stage founders).

Campaign Data:
${campaignSummaries}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              comparativeNarrative: {
                type: Type.STRING,
                description: 'In-depth narrative explaining relative performance against individual goals',
              },
              campaignAssessments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    campaignId: { type: Type.STRING },
                    campaignName: { type: Type.STRING },
                    goalAlignmentAnalysis: { type: Type.STRING },
                    audienceSpecificNuance: { type: Type.STRING },
                    verdictSummary: { type: Type.STRING },
                  },
                  required: ['campaignId', 'campaignName', 'goalAlignmentAnalysis', 'audienceSpecificNuance', 'verdictSummary'],
                },
              },
              transferableInsights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    fromCampaign: { type: Type.STRING },
                    toCampaign: { type: Type.STRING },
                    insight: { type: Type.STRING },
                    whyItTransfers: { type: Type.STRING },
                  },
                  required: ['title', 'fromCampaign', 'toCampaign', 'insight', 'whyItTransfers'],
                },
              },
              cautionsAgainstDirectComparison: {
                type: Type.STRING,
                description: 'Clear explanation of why raw cross-campaign stat ranking is misleading',
              },
            },
            required: ['comparativeNarrative', 'campaignAssessments', 'transferableInsights', 'cautionsAgainstDirectComparison'],
          },
        },
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);

      res.json({
        timestamp: new Date().toISOString(),
        campaignIds: campaigns.map((c: any) => c.campaign.id),
        ...parsed,
      });
    } catch (err: any) {
      console.warn('Error generating AI campaign comparison, falling back to heuristic narrative:', err.message);
      const fallback = generateFallbackComparison(campaigns);
      res.json(fallback);
    }
  });

  return app;
}

export default createApp();
