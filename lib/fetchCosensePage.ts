import axios from "axios";

export async function fetchCosensePage(
  projectName: string,
  pageName: string
): Promise<string> {
  const url = `https://scrapbox.io/api/pages/${projectName}/${pageName}/text`;
  try {
    const response = await axios.get(url);
    if (typeof response.data !== "string") {
      throw "invalid data";
    }
    return response.data;
  } catch {
    return pageName;
  }
}
