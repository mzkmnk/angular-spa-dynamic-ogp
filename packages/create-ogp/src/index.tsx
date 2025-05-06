import satori from 'satori';
import React from 'react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const ogpId = 2;

generateOGP(ogpId).then(() => {
  console.log('done');
});

async function generateOGP(ogpID:number):Promise<void> {
  
  const __dirname = url.fileURLToPath(import.meta.url);
  
  const notoSansJP = fs.readFileSync(path.join(__dirname, '../','../','fonts','NotoSansJP-Regular.ttf'));
  
  const svgText = fs.readFileSync(path.join(__dirname, '../','../','background-images','wave-haikei.svg'));
  
  const svgBase64 = Buffer.from(svgText).toString('base64');
  
  const dataUriB64  = `data:image/svg+xml;base64,${svgBase64}`;
  
  const iconPath = path.join(__dirname, '../','../','icons','mzkmnk.jpg');
  
  const iconData = fs.readFileSync(iconPath);
  
  const iconBase64:string = `data:image/jpeg;base64,${iconData.toString('base64')}`;
  
  const svg = await satori(
    <div style={{
      "position":"relative",
      "fontFamily":"Noto Sans JP",
      "display":"flex",
      "justifyContent":"center",
      "alignItems":"center",
      "backgroundImage":`url(${dataUriB64})`,
      "backgroundSize":"cover",
      "backgroundRepeat": 'no-repeat',
      "height":"630",
      "width":"1200",
      "color":"white",
    }}>
      <h1>OGPについて</h1>
      <div style={{
        "position":"absolute",
        "display":"flex",
        "bottom":"0",
        "left":"0",
        "right":"0",
        "padding":"20px",
        "fontSize":"20px",
        "lineHeight":"1.5",
      }}
      >
        <img src={iconBase64} style={{
          "width":"100px",
          "height":"100px",
          "border":"0.15rem solid black",
          "borderRadius":"50%",
          "marginRight":"20px",
        }} />
      </div>
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