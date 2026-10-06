const http = require('http');
const cheerio = require('cheerio');
http.get('http://localhost:3001/portfolio', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const $ = cheerio.load(data);
    const nestedButtons = $('button button');
    if (nestedButtons.length > 0) {
      console.log('Found nested buttons in SSR output!');
      nestedButtons.each((i, el) => {
        console.log('Nested button HTML:', $(el).parent().html());
      });
    } else {
      console.log('No nested buttons found in SSR output.');
    }
  });
});
