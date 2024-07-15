// scraper.ts

import axios from "axios";
import * as cheerio from "cheerio";
import { UnitOfCompetency, Element, ScrapeFn } from "./types";

/**
 * Asynchronously scrapes the unit of competency details from the
 * gov.au training platform.
 *
 * @param {string} unit_code - The code of the unit of competency to scrape.
 * @return {Promise<UnitOfCompetency>} A promise that resolves to the
 *     scraped unit of competency details.
 */
const scrape: ScrapeFn = async function (
  unit_code: string
): Promise<UnitOfCompetency> {
  const DETAILS_PAGE = "https://training.gov.au/Training/Details/";
  const url = `${DETAILS_PAGE}${unit_code}`;
  const { data } = await axios.get(url);

  const $ = cheerio.load(data);
  const content = $("#layoutContentWrapper");

  return {
    ...Scrape.CodeTitleAndRelease(content),
    elements: Scrape.Elements(content, $),
  };
};

export default scrape;

namespace Scrape {
  /**
   * Extracts the unit of competency code, title, and release from the page.
   *
   * @param content - The parsed HTML content of the page
   * @returns The code, title, and release of the unit of competency
   * @throws {Error} If unable to extract code, title, or release
   */
  export function CodeTitleAndRelease(content: cheerio.Cheerio): {
    code: string;
    title: string;
    release: string;
  } {
    const detailsTitle = content
      .find('h1:contains("Unit of competency details")')
      .next('h2')
      .text();

    const pattern = /(?<code>.*) - (?<title>.*) \(Release (?<release>.*)\)/;
    const { code, title, release } = pattern.exec(detailsTitle)?.groups || {};

    if (!code || !title || !release) {
      throw new Error("Failed to extract code, title, or release");
    }

    return { code, title, release };
  }

  /**
   * Scrapes the elements and performance criteria from the page content.
   * @param content - The parsed HTML content of the page.
   * @param $ - The Cheerio root object.
   * @returns An array of elements and their associated performance criteria.
   */
  export function Elements(
    content: cheerio.Cheerio,
    $: cheerio.Root
  ): Array<Element> {
    const elements: Array<Element> = [];

    // Find the table containing the elements and performance criteria
    content
      .find('h2:contains("Elements and Performance Criteria")')
      .next("table")
      .find("tr")
      .each((index, row) => {
        // Skip header rows
        if (index < 2) return;

        // Iterate over each row in the table, extracting elements and their performance criteria
        $(row)
          .find("td>p")
          .each((columnIndex, el) => {
            const text = $(el).text().trim();
            const regex =
              columnIndex === 0
                ? /(?<id>\d+).\s(?<title>.*)/
                : /(?<id>\d+\.\d+)\s(?<criteria>.*)/;
            const matches = regex.exec(text)?.groups;

            if (
              !matches ||
              !matches.id ||
              !matches[columnIndex === 0 ? "title" : "criteria"]
            ) {
              throw new Error("Unable to parse data from the table.");
            }

            if (columnIndex === 0) {
              // This is an element row
              elements.push({
                id: matches.id as `${number}`,
                title: matches.title,
                performance_criteria: [],
              });
            } else {
              // This is a performance criteria row, add it to the last element added
              const lastElement = elements[elements.length - 1];
              lastElement.performance_criteria.push({
                id: matches.id as `${number}.${number}`,
                criteria: matches.criteria,
              });
            }
          });
      });

    return elements;
  }
}
