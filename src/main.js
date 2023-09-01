// Axios - Promise based HTTP client for the browser and node.js (Read more at https://axios-http.com/docs/intro).
import axios from "axios";
// Cheerio - The fast, flexible & elegant library for parsing and manipulating HTML and XML (Read more at https://cheerio.js.org/).
import * as cheerio from "cheerio";
// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/).
import { Actor, log } from "apify";

// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init().
await Actor.init();

// Structure of input is defined in input_schema.json
const input = await Actor.getInput();
const { url, pageLimit } = input;
const params = {
    headers: {"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"}
};

let page = 1;
let dynamicUrl = `${url}?p.Page=${page}`;
let hasNextPage = true;
const clients = [];

while (hasNextPage && page <= pageLimit) 
{
    // Fetch the HTML content of the page.
    const response = await axios.get(`${url}?p.Page=${page}`, params);

    // Parse the downloaded HTML with Cheerio to enable data extraction.
    const $ = cheerio.load(response.data);

    // Extract all clients from the page (tag name and text).
    $(".list-item-wrapper").each((i, element) => 
    {
        const clientObject = {
            Name: $(element).find(".list-item-heading").html().trim(),
            Annotation: $(element).find(".list-item-anotation").html().trim(),
            Content: $(element).find(".overlay-txt").html().trim(),
            Link: $(element).find("a").attr('href'),
            Image: $(element).find(".list-item-image.js-lazy-loading-bg-img").attr('data-src')
        };
        // console.log("Extracted client", clientObject);
        clients.push(clientObject);
    });

    

    // Check if there is a next page.
    hasNextPage = $(".pagination-wrapper li[class='next'] a").length > 0;
    page++;
}
// Save clients to Dataset - a table-like storage.
console.log("Extracted clients", clients);
await Actor.pushData({TotalItems:clients.length, Clients:clients});

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit().
await Actor.exit();
