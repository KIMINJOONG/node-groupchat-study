'use strict'

window.onload = function() {    
    axios.get(`/apiUrl`).then((apiUrlResponse) => {
        if(apiUrlResponse.status === 200) {
            if(apiUrlResponse.data) {
                const apiUrl = apiUrlResponse.data.url;

                const token = localStorage.getItem('token');
                const headers = {
                    'Authorization' : `Bearer ${token}`
                };

                axios.get(`${apiUrl}/auth/me`, {headers}).then((response) => {
                    const nameInput = document.getElementById('userName');
                    const userSeqInput = document.getElementById('userSeq');
                    let user = null;
                    if(response.status === 200) {
                        if(response.data.current_user) {
                            user = response.data.current_user;
                            userSeqInput.value = user.seq;
                            nameInput.value = user.name;
                        }
            
                        axios.get(`${apiUrl}/auth/me/getChatRooms`, {headers}).then((chatRoomsResponse) => {
                            const roomList = document.getElementById('roomList');
                            if(chatRoomsResponse.status === 200) {
                                if(chatRoomsResponse.data) {
                                    for(let chatRoom of chatRoomsResponse.data) {
                                        const li = document.createElement('li');
                                        li.id = `chatRoom_${chatRoom.seq}`;
                                        li.dataset.roomSeq = chatRoom.seq;
                                        if(chatRoom.users.length == 1) {
                                            li.innerHTML = `
                                            <span id="title_${chatRoom.seq}">${chatRoom.title ? chatRoom.title : chatRoom.users[0].name}</span>
                                            <span id="chatRoomCount_${chatRoom.seq}">${chatRoom.notReadCount}</span>
                                            <button onclick="enterChatRoom('${chatRoom.seq}')">대화하기</button>
                                            <p id="chatRoomLastMessage_${chatRoom.messages[0].seq}">
                                            ${chatRoom.messages[0].message}
                                            </p>
                                        `;
                                        } else {
                                            li.innerHTML = `
                                            <span id="title_${chatRoom.seq}">${chatRoom.title ? chatRoom.title : user.name + "외 " + chatRoom.users.length + "명"}</span>
                                            <span id="chatRoomCount_${chatRoom.seq}">${chatRoom.notReadCount}</span>
                                            <button onclick="enterChatRoom('${chatRoom.seq}')">대화하기</button>
                                            <p id="chatRoomLastMessage_${chatRoom.seq}">
                                            ${chatRoom.message}
                                            </p>
                                            `;
                                        }
                                        
                                        roomList.appendChild(li);
                                    }
                                }
                            }
                        });
            
                        axios.get(`${apiUrl}/users`, {headers}).then((usersResponse) => {
                            const userList = document.getElementById('userList');
                            if(usersResponse.status === 200) {
                                if(usersResponse.data) {
                                    for(let user of usersResponse.data) {
                                        const li = document.createElement('li'); 
                                        if(user.seq === response.data.current_user.seq) {
                                            // li.innerHTML = `<span>${user.name} (${user.email}) (나)</span>`;
                                        } else {
                                            li.innerHTML = `<span>${user.name} (${user.email})</span><button onclick="createChatRoom(${user.seq})">대화하기</button>`;
                                        }
                                        userList.appendChild(li);
                                    }
                                }
                            }
                        });
                    }
                });
            }
        }
    }).catch(error => console.log(error));
    
    
};


socket.on('messageForChatList', data => {
    const li = document.getElementById(`chatRoom_${data.message.chatRoom_seq}`);
    if(li) {
        const span = document.getElementById(`chatRoomCount_${data.message.chatRoom_seq}`);
        const beforeCount = span.innerText;
        span.innerText = parseInt(beforeCount, 10) + 1;
        const lastMessagePtag = document.getElementById(`chatRoomLastMessage_${data.message.chatRoom_seq}`);
        lastMessagePtag.innerHTML = data.message.message;
        
    } else {
        socket.emit('getChatRoomRequest', {token: localStorage.getItem('token'), chatRoomSeq: data.message.chatRoom_seq});
    }
});

socket.on('getChatRoomResponse', data => {
    axios.get(`/apiUrl`).then((apiUrlResponse) => {
        if(apiUrlResponse.status === 200) {
            if(apiUrlResponse.data) {
                const apiUrl = apiUrlResponse.data.url;
                const headers = {
                    'Authorization' : `Bearer ${localStorage.getItem('token')}`
                };
                axios.get(`${apiUrl}/auth/me`, {headers}).then((meResponse) => {
                    if(meResponse.status === 200) {
                        if(meResponse.data) {
                            const user = meResponse.data.current_user;
                            const roomList = document.getElementById('roomList');
                            const li = document.createElement('li');
                            li.id = `chatRoom_${data.seq}`;
                            li.dataset.roomSeq = data.seq;
                            if(data.users.length == 1) {
                                li.innerHTML = `
                                <span id="title_${data.seq}">${data.title ? data.title : data.users[0].name}</span>
                                <span id="chatRoomCount_${data.seq}">${data.messages.length}</span>
                                <button onclick="enterChatRoom('${data.seq}')">대화하기</button>
                                <p id="chatRoomLastMessage_${data.messages[0].seq}">
                                ${data.messages[0].message}
                                </p>
                            `;
                            } else {
                                li.innerHTML = `
                                <span id="title_${data.seq}">${data.title ? data.title : user.name + "외 " + data.users.length + "명"}</span>
                                <span id="chatRoomCount_${data.seq}">${data.messages.length}</span>
                                <button onclick="enterChatRoom('${data.seq}')">대화하기</button>
                                <p id="chatRoomLastMessage_${data.messages[0].seq}">
                                ${data.messages[0].message}
                                </p>
                            `;
                            }
                            
                            roomList.appendChild(li);
                        }
                    }
                });
            }
        }
    });
    
    
});

// socket.on('invitedFriend-createRoom', data => {
//     axios.get('/apiUrl').then((response) => {
//         if(response.status === 200) {
//             if(response.data) {
//                 const token = localStorage.getItem('token');
//                 const headers = {
//                     'Authorization' : `Bearer ${token}`
//                 };
//                 const apiUrl = response.data.url;
                
//                 axios.get(`${apiUrl}/auth/me`, {headers}).then((response) => {
//                     if(response.status === 200) {
//                         const me = response.data.current_user;
//                         for(let invited of data.invited) {
//                             if(me.seq === invited.seq) {
//                                 const chatRoom = data.invitedRoomInfo;
//                                 const roomList = document.getElementById('roomList');
//                                 const li = document.createElement('li');
//                                 li.innerHTML = `<span>${chatRoom.title ? chatRoom.title : user.name + "외 " + (chatRoom.users_count - 1) + "명"}</span><span>(${chatRoom.messages_count})</span><button onclick="enterChatRoom('${chatRoom.seq}')">대화하기</button>`;
//                                 roomList.appendChild(li);
//                             }
//                         }
                        
//                     }
                    
//                 });
//             }
//         }
//     }).catch(error => console.log(error));
    
// });

function createChatRoom(userSeq) {
    const token = localStorage.getItem('token');
    
    const data = {
        userSeqs: [userSeq],
        token
    };

    axios.post(`/chatRooms`, data).then((response) => {
        if(response.status === 200) {
            if(response.data) {
                window.location.href = `/chat.html?chatRoomSeq=${response.data.invitedRoomInfo.seq}`;
            }
        }
    });
    
}

function enterChatRoom(chatRoomSeq) {
    window.location.href = `/chat.html?chatRoomSeq=${chatRoomSeq}`;
}