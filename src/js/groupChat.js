"use strict"

const socket = io();

const createRoomButton = document.querySelector(".createRoomButton");
const roomIdInput = document.querySelector("#roomIdInput")
const roomNameInput = document.querySelector("#roomNameInput");

const updateRoomButton = document.querySelector(".updateRoomButton");
const deleteRoomButton = document.querySelector(".deleteRoomButton");

const userNameInput = document.querySelector("#userNameInput");

deleteRoomButton.addEventListener('click', () => {
    const roomId = roomIdInput.value;
    const data = {command: 'delete',roomId};

    if(socket == undefined) {
        alert('서버에 연결되어 있지 않습니다.');
        return;
    }

    socket.emit('room', data);
});

socket.on('room', (data) => {
    if(data.command == 'list') {
        
    }
});




