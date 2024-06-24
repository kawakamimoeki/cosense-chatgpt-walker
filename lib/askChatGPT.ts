import { openai } from "./openai";

export async function askChatGPT(
  question,
  pages,
  messages: Array<any>
): Promise<string | null> {
  try {
    const prompt = `Based on hisotry of this conversation and the following context and the initial question "${question}", provide a comprehensive answer:\n\n${pages
      .map((p) => {
        return [
          "----",
          `title: ${p.title}`,
          `content: ${p.content.substring(0, 800)}`,
          "----",
        ].join("\n");
      })
      .join("\n")}`;
    messages.push({ role: "user", content: prompt });
    const chatCompletion = openai.chat.completions.create({
      messages,
      model: "gpt-3.5-turbo",
    });

    const message = (await chatCompletion).choices[0].message;
    messages.push({ role: "assistant", content: message.content });
    console.log(message.content);
    return message.content;
  } catch (error) {
    console.error("Error calling ChatGPT API:", error);
    return null;
  }
}
