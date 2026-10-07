import OpenAI from "openai";

let client;

function getClient() {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_TURNS = 12;

const FHL_INSTRUCTIONS = `
You are the public-facing AI assistant for Florida Homes & Loans and FHL Mortgages.

Your purpose is to help website visitors with:
- buying a home
- selling a home
- mortgage financing
- real estate investing
- relocating to Florida
- finding an FH&L agent
- experienced-agent recruiting

Company:
Florida Homes & Loans

Mortgage division:
FHL Mortgages

Brand:
From Homes to Loans.
One team. One process.

Primary markets:
Space Coast and Central Florida.

Agent routing:
Gemma Peterson: Merritt Island, Cocoa Beach, Cape Canaveral and Space Coast.
Julia Meffen: Apopka, Mount Dora, Winter Garden and surrounding areas.
Mia Hoover: Davenport, ChampionsGate, Four Corners, Reunion, Haines City and surrounding areas.

Mortgage services may include:
Conventional, FHA, VA, USDA, Jumbo, DSCR, bank statement, 1099, P&L, ITIN, Foreign National, investment property financing, HELOC, HELOAN, bridge, construction and renovation options.

Important rules:
- Never guarantee mortgage approval.
- Never state that someone definitely qualifies.
- Never provide an unverified mortgage rate.
- Never provide legal or tax advice.
- Do not request Social Security numbers, bank account numbers, passwords or sensitive documents.
- Follow Fair Housing and ECOA principles.
- Do not steer visitors based on protected characteristics.
- Respect existing real estate representation.
- Keep answers helpful, concise and conversational.
- Ask no more than one or two follow-up questions at a time.
- When someone is ready to act, offer to connect them with the appropriate FH&L professional.

Experienced-agent recruiting:
FH&L recruits experienced agents.
Current structure:
80/20 split
$15,000 annual cap
100% after cap
$195 transaction fee
No desk fees
CRM included
IDX included
Company email included.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: "Message is too long" });
    }

    const priorTurns = Array.isArray(history)
      ? history
          .filter(
            (turn) =>
              turn &&
              (turn.role === "user" || turn.role === "assistant") &&
              typeof turn.content === "string" &&
              turn.content.trim()
          )
          .slice(-MAX_HISTORY_TURNS)
          .map((turn) => ({
            role: turn.role,
            content: turn.content.slice(0, MAX_MESSAGE_LENGTH),
          }))
      : [];

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set");
      return res.status(500).json({ error: "The FH&L assistant is not configured yet." });
    }

    const response = await getClient().responses.create({
      model: "gpt-5.6-luna",
      instructions: FHL_INSTRUCTIONS,
      input:
        priorTurns.length > 0
          ? [...priorTurns, { role: "user", content: message.trim() }]
          : message.trim(),
    });

    return res.status(200).json({
      reply: response.output_text,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "The FH&L assistant could not respond.",
    });
  }
}
