import { openai } from "./openai";

export async function askChatGPT(
  prompt: string,
  messages: Array<any>
): Promise<string | null> {
  try {
    messages.push({ role: "user", content: prompt });
    const chatCompletion = openai.chat.completions.create({
      messages,
      model: "gpt-3.5-turbo",
    });

    const message = (await chatCompletion).choices[0].message;
    messages.push({ role: "assistant", content: message.content });
    return message.content;
  } catch (error) {
    console.error("Error calling ChatGPT API:", error);
    return null;
  }
}
