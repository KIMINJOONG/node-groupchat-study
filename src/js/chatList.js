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
                    if(response.status === 200) {
                        if(response.data.current_user) {
                            const user = response.data.current_user;
                            userSeqInput.value = user.seq;
                            nameInput.value = user.name;
                        }
            
                        axios.get(`${apiUrl}/auth/me/getChatRooms`, {headers}).then((chatRoomsResponse) => {
                            const roomList = document.getElementById('roomList');
                            if(chatRoomsResponse.status === 200) {
                                if(chatRoomsResponse.data) {
                                    for(let chatRoom of chatRoomsResponse.data) {
                                        const li = document.createElement('li');
                                        li.innerHTML = `<span>${chatRoom.seq}</span><button onclick="enterChatRoom('${chatRoom.seq}')">대화하기</button>`;
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



socket.on('invitedFriend-createRoom', data => {
    axios.get('/apiUrl').then((response) => {
        if(response.status === 200) {
            if(response.data) {
                const token = localStorage.getItem('token');
                const headers = {
                    'Authorization' : `Bearer ${token}`
                };
                const apiUrl = response.data.url;
                
                axios.get(`${apiUrl}/auth/me`, {headers}).then((response) => {
                    if(response.status === 200) {
                        const me = response.data.current_user;
                        for(let invited of data.invited) {
                            if(me.seq === invited.seq) {
                                const chatRoom = data.invitedRoomInfo;
                                const roomList = document.getElementById('roomList');
                                const li = document.createElement('li');
                                li.innerHTML = `<span>${chatRoom.seq}</span><button onclick="enterChatRoom('${chatRoom.seq}')">대화하기</button>`;
                                roomList.appendChild(li);
                            }
                        }
                        
                    }
                    
                });
            }
        }
    }).catch(error => console.log(error));
    
});

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