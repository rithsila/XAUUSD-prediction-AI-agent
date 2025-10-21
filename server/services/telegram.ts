import axios from "axios";

export interface TelegramMessage {
  text: string;
  parse_mode?: "Markdown" | "HTML";
  disable_web_page_preview?: boolean;
}

/**
 * Send message to Telegram channel or chat
 */
export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: TelegramMessage
): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await axios.post(url, {
      chat_id: chatId,
      text: message.text,
      parse_mode: message.parse_mode || "Markdown",
      disable_web_page_preview: message.disable_web_page_preview ?? true,
    }, {
      timeout: 10000
    });
    
    if (response.data.ok) {
      console.log("[Telegram] Message sent successfully");
      return true;
    } else {
      console.error("[Telegram] Failed to send message:", response.data);
      return false;
    }
  } catch (error: any) {
    console.error("[Telegram] Error sending message:", error.response?.data || error.message);
    return false;
  }
}

/**
 * Format prediction as Telegram message
 */
export function formatPredictionMessage(prediction: {
  direction: string;
  confidence: number;
  rangeMin: number;
  rangeMax: number;
  horizon: string;
  rationale?: string[];
  timestamp: Date;
}): string {
  const directionEmoji = prediction.direction === "bull" ? "🟢" : prediction.direction === "bear" ? "🔴" : "⚪";
  const directionText = prediction.direction.toUpperCase();
  
  let message = `${directionEmoji} *XAUUSD Prediction Alert*\n\n`;
  message += `*Direction:* ${directionText}\n`;
  message += `*Confidence:* ${prediction.confidence}%\n`;
  message += `*Horizon:* ${prediction.horizon}\n`;
  message += `*Range:* ${prediction.rangeMin} to ${prediction.rangeMax} pips\n`;
  message += `*Time:* ${prediction.timestamp.toLocaleString()}\n\n`;
  
  if (prediction.rationale && prediction.rationale.length > 0) {
    message += `*Key Drivers:*\n`;
    prediction.rationale.slice(0, 3).forEach((reason, i) => {
      message += `${i + 1}. ${reason}\n`;
    });
  }
  
  message += `\n_Automated prediction from XAUUSD Agent_`;
  
  return message;
}

/**
 * Format high-impact news as Telegram message
 */
export function formatNewsMessage(news: {
  title: string;
  goldImpact: string;
  impactScore: number;
  sentiment: number;
  summary?: string;
  url?: string;
}): string {
  const impactEmoji = news.goldImpact === "bullish" ? "📈" : news.goldImpact === "bearish" ? "📉" : "➖";
  
  let message = `${impactEmoji} *High-Impact Gold News*\n\n`;
  message += `*${news.title}*\n\n`;
  
  if (news.summary) {
    message += `${news.summary}\n\n`;
  }
  
  message += `*Impact:* ${news.goldImpact.toUpperCase()} (${news.impactScore}/100)\n`;
  message += `*Sentiment:* ${news.sentiment > 0 ? '+' : ''}${news.sentiment}\n`;
  
  if (news.url) {
    message += `\n[Read More](${news.url})`;
  }
  
  message += `\n\n_News alert from XAUUSD Agent_`;
  
  return message;
}

/**
 * Format economic calendar event as Telegram message
 */
export function formatEconomicEventMessage(event: {
  title: string;
  country?: string;
  impact?: string;
  eventTime: Date;
  forecast?: string;
  previous?: string;
  actual?: string;
}): string {
  const impactEmoji = event.impact === "high" ? "🔴" : event.impact === "medium" ? "🟡" : "🟢";
  
  let message = `${impactEmoji} *Economic Event Alert*\n\n`;
  message += `*${event.title}*\n`;
  
  if (event.country) {
    message += `Country: ${event.country}\n`;
  }
  
  message += `Time: ${event.eventTime.toLocaleString()}\n\n`;
  
  if (event.forecast || event.previous || event.actual) {
    message += `*Data:*\n`;
    if (event.forecast) message += `Forecast: ${event.forecast}\n`;
    if (event.previous) message += `Previous: ${event.previous}\n`;
    if (event.actual) message += `Actual: ${event.actual}\n`;
  }
  
  message += `\n_Economic calendar from XAUUSD Agent_`;
  
  return message;
}

/**
 * Test Telegram connection
 */
export async function testTelegramConnection(botToken: string, chatId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const testMessage: TelegramMessage = {
      text: "✅ *Telegram Connection Test*\n\nYour XAUUSD Prediction Agent is successfully connected!",
      parse_mode: "Markdown"
    };
    
    const success = await sendTelegramMessage(botToken, chatId, testMessage);
    
    if (success) {
      return { success: true };
    } else {
      return { success: false, error: "Failed to send test message" };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

