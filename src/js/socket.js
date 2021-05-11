const socket = io({transports: [ 'websocket' ]});
socket.token = localStorage.getItem("token");