import axios from "axios";
import { CosensePage } from "./cosenseData";

export async function fetchCosensePage(
  projectName: string,
  pageName: string
): Promise<CosensePage> {
  try {
    const url = `https://scrapbox.io/api/pages/${projectName}/${pageName}`;
    const response = await axios.get(url);
    return response.data;
  } catch {
    return null;
  }
}
