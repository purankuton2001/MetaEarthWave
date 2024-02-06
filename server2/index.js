const ReconnectingWebSocket = require('reconnecting-websocket');
let premessage = '';

// WebSocketサーバーのURLを設定
const url = 'wss://metaearthwave-backend-stsiczr2ha-dt.a.run.app';
const ws = require('ws');
const options = {
  WebSocket: ws, // custom WebSocket constructor
  connectionTimeout: 1000,
  maxRetries: 10,
};
const connection = new ReconnectingWebSocket(url, [], options);
connection.onopen = () => {
  console.log('WebSocketに接続しました');
};

const Server = require('ws').Server;

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const s = new Server({port: process.env.PORT || 5001});


s.on('connection', function(ws) {
  console.log('new client connnection');
  ws.on('close', () => {
    console.log('I lost a client');
  });
  connection.onmessage = async (e) => {
    console.log(`サーバーからのメッセージ: ${typeof e.data}`);
    if (premessage !== e.data) {
      await s.clients.forEach(function(client) {
        client.send(e.data);
        premessage = e.data;
      });
    }
  };
});


