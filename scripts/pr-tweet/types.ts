export interface PullRequestData {
  number: number;
  title: string;
  body: string | null;
  url: string;
  repoName: string;
}

export interface TweetDecision {
  shouldTweet: boolean;
}

export interface GeneratedTweet {
  content: string;
  characterCount: number;
  hashtags: string[];
}

export interface IFTTTWebhookPayload {
  value1: string;
}

export interface PRAnalysisResult {
  decision: TweetDecision;
  tweet?: GeneratedTweet;
  error?: string;
}
