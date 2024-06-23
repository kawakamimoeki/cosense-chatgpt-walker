import axios from "axios";
import { CosenseData } from ".";

export async function fetchCosense(projectName: string): Promise<CosenseData> {
  let skip = 0;
  let cosenseData = new CosenseData(projectName);
  process.stdout.write("loading all pages");
  while (true) {
    const url = `https://scrapbox.io/api/pages/${projectName}?limit=1000&skip=${skip}`;
    skip += 1000;
    process.stdout.write(".");

    const response = await axios.get(url);
    cosenseData.pages = [...response.data.pages, ...cosenseData.pages];
    if (skip > response.data.count) {
      break;
    }
  }
  console.log("");
  return cosenseData;
}
