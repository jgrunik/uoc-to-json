// index.ts

import { writeFile } from "fs/promises";
import scrape from "./unit-scraper.js";

async function main() {
  const [unit_code] = process.argv.slice(2);
  if (unit_code == undefined) throw new Error("Unit Code not provided");

  const unitOfCompetency = await scrape(unit_code);

  const file_name = `${unit_code} - ${unitOfCompetency.title}.json`;

  await writeFile(
    `json/${file_name}`,
    JSON.stringify(unitOfCompetency, null, 2)
  );

  console.info(`Successfully scraped and stored into '${file_name}'`);
}

main();
