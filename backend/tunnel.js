const localtunnel = require('localtunnel');
const fs = require('fs');

(async () => {
  const tunnel = await localtunnel({ port: 3001 });
  fs.writeFileSync('tunnel.json', JSON.stringify({ url: tunnel.url }));
  console.log("Tunnel opened at", tunnel.url);
  tunnel.on('close', () => {
    console.log("Tunnel closed");
  });
})();
