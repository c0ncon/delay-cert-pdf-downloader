const puppeteer = require('puppeteer');
const cp = require('child_process');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const lineName = '埼京線';

  await Promise.all([
    page.goto('https://traininfo.jreast.co.jp/delay_certificate/'),
    page.waitForResponse((response) => response.status() === 200)
  ]);

  let ready = false;
  let certURL = '';
  let rows = await page.$$('div.personal_area table tr');
  for (row of rows) {
    let nameCol = await row.$('th p[class^="line"]');
    if (nameCol) {
      let lineText = await nameCol.evaluate((node) => node.innerText);
      if (lineText.includes(lineName)) {
        let status = await row.$('td:nth-child(3)');
        ready = (await status.evaluate((node) => node.innerText)) !== '掲載準備中';
        if (ready) {
          certURL = await status.$eval('a', (node) => node.href);
        }
        break;
      }
    }
  }

  if (ready) {
    await Promise.all([
      page.goto(certURL),
      page.waitForResponse((response) => response.status() === 200)
    ]);

    let today = (new Date()).toISOString().slice(0, 10).replace(/-/g, '');
    await page.pdf({
      path: `${process.env.USERPROFILE}\\Desktop\\${today}.pdf`,
      width: 600,
      height: 611,
      printBackground: true
    });

    cp.spawn('explorer', [`${process.env.USERPROFILE}\\Desktop`]);
  } else {
    console.log('ㄴㄴ');
  }
  await browser.close();
})();