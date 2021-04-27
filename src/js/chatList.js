'use strict'

window.onload = function() {
    const token = localStorage.getItem('token');
    const headers = {
        'Authorization' : `Bearer ${token}`
    };
    axios.get('http://127.0.0.1:8000/api/auth/me', {headers}).then((response) => {
        const nameInput = document.getElementById('userName');
        const userSeqInput = document.getElementById('userSeq');
        if(response.status === 200) {
            if(response.data.current_user) {
                const user = response.data.current_user;
                userSeqInput.value = user.seq;
                nameInput.value = user.name;
            }

            axios.get('http://127.0.0.1:8000/api/auth/me/getChatRooms', {headers}).then((chatRoomsResponse) => {
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

            axios.get('http://127.0.0.1:8000/api/users', {headers}).then((usersResponse) => {
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
};

function createChatRoom(userSeq) {
    const token = localStorage.getItem('token');
    const headers = {
        'Authorization' : `Bearer ${token}`
    };
    const data = {
        userSeqs: [userSeq]
    };
    axios.post('http://127.0.0.1:8000/api/chatRooms', data, {headers}).then((response) => {
        if(response.status === 200) {
            if(response.data) {
                window.location.href = `/chat.html?chatRoomSeq=${response.data.seq}`;
            }
        }
    });
}

function enterChatRoom(chatRoomSeq) {
    window.location.href = `/chat.html?chatRoomSeq=${chatRoomSeq}`;
}