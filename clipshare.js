#! /usr/bin/env node

const clipboard = require('clipboardy');
const net = require('net');

var args = process.argv.slice(2);

let clipboardBuffer = "";

function SocketList () {
	this.next_id = 1;
	this.sockets = {};
}

SocketList.prototype = {
	add: function (socket) {
		var id = 'sock' + this.next_id++;
		this.sockets[id] = socket;
		socket.socketlist_id = id;
		return id;
	},
	remove: function (item) {
		var id = item;
		if (item instanceof net.Socket) {
			id = item.socketlist_id;
		}
		delete this.sockets[id];
	},
	get: function (id) {
		return this.sockets[id];
	},
	all: function () {
		return this.sockets;
	},
	broadcast: function (data) {
		this.sockets.forEach(s => {
			if (s && s.writable) {
				s.write(JSON.stringify(data) + "\n");
			}
		})
	}
}

var sockets = new SocketList();

function monitorClipboard () {
	let tmp = clipboard.readSync();
	if (tmp !== clipboardBuffer) {
		clipboardBuffer = tmp;
		sendClipboard(tmp);
	}
}

function sendClipboard (content) {
	sockets.broadcast(content);
}

function die (err) {
	console.log(err.toString());
	process.exit();
}

function parseBuffer (txt) {
	// Buffer is separated by newlines:
	let m = txt.match(/^([^\n]*)\n(.*)$/s);

	if (m) {
		return [m[1],m[2]];
	}
	else {
		return [undefined,txt];
	}
}

function registerSocket (sock) {
	let receiveBuffer = "";

	var sock_id = sockets.add(sock);
	
	function receiveClipboard (rawData) {
		receiveBuffer += rawData;

		let more = true;

		while (more) {
			let [data, leftover] = parseBuffer(receiveBuffer);
			receiveBuffer = leftover;

			if (data) {
				try {
					let content = JSON.parse(data);
					clipboard.writeSync(content);
				}
				catch (err) {
					console.error(err);
				}
			}
			else {
				more = false;
			}
		}
	}
	
	sock.on('data',receiveClipboard);

	return sock_id;
}

if (args.length < 2) {
	console.log('must either specify address and port or run as -server\n');
	process.exit();
}

var host = args[0];
var port = args[1];

if (host == '-server') {
	net.createServer(function(sock){
		var sock_id = registerSocket(sock);
		
		sock.on('end',function(){
			sockets.remove(sock_id);
		})
	})
	.on('error',die)
	.listen(port);
}
else {
	var sock = net.createConnection({
		host: host,
		port: port
	});
	
	registerSocket(sock);
	sock.on('connect')
		.on('end',function(){
			process.exit();
		})
		.on('error',die);
}

setInterval(monitorClipboard, 100);
