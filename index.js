var fs = require('fs');
var https = require('https');

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
   res.sendfile('index.html');
});

var options = { 
  key: fs.readFileSync('./cert/pstools.top.key'),
  cert: fs.readFileSync('./cert/pstools.top.crt')
};
var serverPort = 443;

var server = https.createServer(options, app);
var io = require('socket.io')(server);


users = [];
userMap = new Map();
io.on('connection', function(socket) {
   console.log('A user connected');
   socket.on('setUsername', function(data) {
      console.log(data);
      
      if(users.indexOf(data) > -1) {
         socket.emit('userExists', data + ' username is taken! Try some other username.');
      } else {
         users.push(data);
         socket.emit('userSet', {username: data});
      }
   });
   
   socket.on('msg', function(data) {
      //Send message to everyone
      io.sockets.emit('newmsg', data);
   })

	socket.on('message', (room, data)=>{
		console.log('received message from client, data:'+data+', room:'+room);
		//console.log('data:',data);
		socket.to(room).emit('message',room, data);
	});

	socket.on('join', (room)=>{
		console.log('received join from client, room:' + room +' socket:',socket.id );
		userMap.set(socket.id,socket);
		socket.join(room);

			socket.emit('joined', room, socket.id); 
			//发给除自己之外的房间内的所有人
			if(userMap.size> 1){
				socket.to(room).emit('otherjoin', room, socket.id);
			}
		//socket.emit('joined', room, socket.id); //发给自己
		//socket.broadcast.emit('joined', room, socket.id); //发给除自己之外的这个节点上的所有人
		//io.in(room).emit('joined', room, socket.id); //发给房间内的所有人
	});

socket.on('disconnect',() =>{
userMap.delete(socket.id);
});


});

server.listen(serverPort, function() {
  console.log('server up and running at %s port', serverPort);
});
