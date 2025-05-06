import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// FIXME any type

const SERVICE_NAME = 'dynamic-ogp';

const DESCRIPTION = '動的OGPを出力するための練習サイトです。';

const bots = [
  'Twitterbot',
  'facebookexternalhit',
  'Slackbot-LinkExpanding',
  'line'
];

const BUCKET_NAME = 'infrastack-ogpbucket6721f3a0-fxzxvfvjq6il';

const s3Client = new S3Client({region: 'us-east-1'});

export const handler = async (event:any):Promise<any> => {

  const request = event.Records[0].cf.request;

  // user-agentが存在しない、
  // もしくはuser-agentが空の場合
  // 早期リターンを行う。
  if(!request.headers.hasOwnProperty('user-agent') || request.headers['user-agent'].length === 0) {
    return request;
  }

  const userAgent = request.headers['user-agent'][0].value;

  const params = request.uri.split('/').slice(-2);

  const isBot = bots.some(bot => userAgent.includes(bot));
　
  if(!isBot || params.length === 0 || params[0] !== 'post') {
    return request;
  }

  const response = await fetch('https://ds830zxaeobq7.cloudfront.net/posts/index.json');

  const body = await response.json() as {id:string,title:string,tags:string}[];

  const item = body[params[1] - 1];

  const title = item.title;
  
  console.log('item',item);

  const getCmd = new GetObjectCommand({Bucket: BUCKET_NAME, Key: `${item.id}.png`});
  
  const ogUrl = await getSignedUrl(s3Client,getCmd,{expiresIn: 300});
  
  return {
    status: 200,
    headers: {
      'Content-Type': [{
        key: 'Content-Type',
        value: 'text/html; charset=UTF-8'
      }]
    },
    body: generateHTML(title, ogUrl, request.uri)
  };
};

function generateHTML(title:string, ogImageUrl:string, url:string) {
  return `
<!doctype html>
<html lang="ja">
<head prefix="og: https://ogp.me/ns#">  <!-- Open Graph Protocol  [oai_citation:6‡Open Graph protocol](https://ogp.me/?utm_source=chatgpt.com) -->
  <meta charset="utf-8" />
  <title>${title}｜${SERVICE_NAME}</title>
  <meta property="og:url"         content="https://${url}" />
  <meta property="og:type"        content="article" />
  <meta property="og:locale"      content="ja_JP" />
  <meta property="og:title"       content="${title}｜${SERVICE_NAME}" />
  <meta property="og:description" content="${DESCRIPTION}" />
  <meta property="og:image"       content="${ogImageUrl}" />
  <meta name="twitter:card"       content="summary_large_image" />
  <meta name="twitter:title"      content="${title}" />
  <meta name="twitter:description" content="${DESCRIPTION}" />
  <meta name="twitter:image"      content="${ogImageUrl}" />
</head>
<body></body>
</html>
`;
}