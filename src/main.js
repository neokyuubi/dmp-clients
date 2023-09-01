import axios from "axios";
import * as cheerio from "cheerio";
import { Actor, log } from "apify";

await Actor.init();

const input = await Actor.getInput();
const { url, domain, mainCssSelector, nextPageSelector, nameSelector, annotationSelector, contentSelector, linkSelector, imageSelector } = input;
const params = {
    headers: {"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"}
};

let dynamicUrl = url;
let hasNextPage = true;
const clients = [];

while (hasNextPage && dynamicUrl)
{
    const response = await axios.get(dynamicUrl, params);

    const $ = cheerio.load(response.data);

    $(mainCssSelector).each((i, element) => 
    {
        const clientObject = {
            Name: $(element).find(nameSelector).html().trim(),
            Annotation: $(element).find(annotationSelector).html().trim(),
            Content: $(element).find(contentSelector).html().trim(),
            Link: $(element).find(linkSelector).attr('href'),
            Image: $(element).find(imageSelector).attr('data-src')
        };
        clients.push(clientObject);
    });

    hasNextPage = $(nextPageSelector).length > 0;
    dynamicUrl = hasNextPage ? domain + $(nextPageSelector).attr("href") : false;
    if (dynamicUrl) await delay(500);
}

const data = {TotalItems:clients.length, Clients:clients};
console.log("Extracted data : ", data);
await Actor.pushData(data);

await Actor.exit();

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}