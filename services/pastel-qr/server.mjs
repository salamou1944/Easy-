import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root=dirname(fileURLToPath(import.meta.url));
const html=await readFile(join(root,'index.html'),'utf8');
const server=http.createServer((req,res)=>{
  if(req.url==='/'||req.url==='/pastel'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'public,max-age=300'});res.end(html);return;}
  res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});res.end('Not found');
});
server.listen(Number(process.env.PORT||3000),'0.0.0.0');