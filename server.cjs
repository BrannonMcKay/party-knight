const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const portable = process.argv.includes('--standalone');
const party = portable || process.argv.includes('--party-knight');
const port = Number(process.env.PORT || (portable ? 4174 : 4173));
const launchPath = portable ? '/' : party ? '/party-knight.html' : '/';
const address = 'http://127.0.0.1:' + port + launchPath;
function openBrowser(){
  if(process.argv.includes('--open') && process.platform==='win32') {
    require('node:child_process').spawn('cmd.exe',['/c','start','',address],{windowsHide:true,stdio:'ignore'}).on('error',()=>{});
  }
}
const mime = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.css':'text/css', '.jpg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.mp4':'video/mp4', '.mp3':'audio/mpeg', '.m4a':'audio/mp4', '.wav':'audio/wav', '.ttf':'font/ttf' };
http.createServer((req,res) => {
  let url;
  try { url = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
  if (url === '/') url = '/index.html';
  if (!/^\/(index\.html|party-knight\.html|style\.css|favicon\.svg|src\/[^.][\w./-]+|levels\/[\w.-]+|assets\/[\w.-]+|vendor\/[\w.-]+)$/.test(url) || url.includes('..')) { res.writeHead(404).end('Not found'); return; }
  const file = path.join(root,url);
  fs.stat(file,(err,stat) => {
    if(err || !stat.isFile()) {res.writeHead(404).end('Not found');return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    fs.createReadStream(file).pipe(res);
  });
}).listen(port,'127.0.0.1',()=>{console.log(`${party?'Party Knight':'Err.... Ape Escape!'}: ${address}\nKeep this window open while playing. Press Ctrl+C to stop.`);openBrowser();}).on('error',err=>{
  if(err.code!=='EADDRINUSE'){console.error(err.message);process.exitCode=1;return;}
  const req=http.get(address,res=>{let html='';res.setEncoding('utf8');res.on('data',chunk=>{if(html.length<32768)html+=chunk;});res.on('end',()=>{
    if(res.statusCode===200&&(party?html.includes('<title>Party Knight'):html.includes('<title>Err'))){console.log('Already running: '+address);openBrowser();}
    else{console.error('Another server is using port '+port+'. Set PORT to a free port and launch again.');process.exitCode=1;}
  });});req.setTimeout(2500,()=>req.destroy(new Error('No response on '+address)));req.on('error',err=>{console.error(err.message);process.exitCode=1;});
});
