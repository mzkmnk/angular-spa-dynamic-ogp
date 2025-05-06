import satori from 'satori';
import React from 'react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';
import { Resvg } from '@resvg/resvg-js';
const ogpId = 0;

generateOGP(ogpId).then(() => {
  console.log('done');
});

async function generateOGP(ogpID:number):Promise<void> {
  
  const __dirname = url.fileURLToPath(import.meta.url);
  
  const notoSansJP = fs.readFileSync(path.join(__dirname, '../','../','fonts','NotoSansJP-Regular.ttf'));
  
  const svgText = fs.readFileSync(path.join(__dirname, '../','../','background-images','layered-steps-haikei2.svg'));
  
  const svgBase64 = Buffer.from(svgText).toString('base64');
  
  const dataUriB64  = `data:image/svg+xml;base64,${svgBase64}`;
  
  
  const svg = await satori(
    <div style={{
      "display":"flex",
      "justifyContent":"center",
      "alignItems":"center",
      "backgroundImage":`url(${dataUriB64})`,
      "backgroundSize":"cover",
      "backgroundRepeat": 'no-repeat',
      "borderRadius":"20px",
      "height":"630",
      "width":"1200",
      "color":"white",
    }}>
      <h1>Signalについて</h1>
    </div>,
    {
      height: 630,
      width: 1200,
      fonts: [
        {
          name: 'Noto Sans JP',
          data: notoSansJP,
        }
      ]
    }
  )
  
  const reSvg = new Resvg(svg,{
    fitTo: {mode:'width',value:1200}
  })
  
  const pngData = reSvg.render().asPng();
  
  fs.writeFileSync(path.join(__dirname,'../','../','ogps',`${ogpID}.png`),pngData)
}