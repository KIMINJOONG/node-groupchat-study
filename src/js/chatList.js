'use strict';

let me = {};
let chatRooms = [];
let apiUrl = '';
const token = localStorage.getItem('token');
const headers = {
  Authorization: `Bearer ${token}`,
};
const roomList = document.getElementById('chatRoomList');
const tabs = document.querySelectorAll('.tab_menu li');
const tabMains = document.querySelectorAll('.tab_main');

window.onload = async function () {
  const apiUrlResponse = await axios.get(`/apiUrl`);
  if (apiUrlResponse.status === 200) {
    if (apiUrlResponse.data) {
      apiUrl = apiUrlResponse.data.url;
    }
  }

  const getMeResponse = await axios.get(`${apiUrl}/auth/me`, { headers });
  if (getMeResponse.status === 200) {
    if (getMeResponse.data.current_user) {
      me = getMeResponse.data.current_user;
      document.getElementById('myName').innerText = me.name;
    }
  }

  const chatRoomsResponse = await axios.get(`${apiUrl}/auth/me/getChatRooms`, {
    headers,
  });
  if (chatRoomsResponse.status === 200) {
    if (chatRoomsResponse.data) {
      for (let chatRoom of chatRoomsResponse.data) {
        const meIndex = chatRoom.users.findIndex(user => user.seq === me.seq);
        chatRoom.users.splice(meIndex, 1);
        const li = document.createElement('li');
        li.id = `chatRoom_${chatRoom.seq}`;
        li.dataset.roomSeq = chatRoom.seq;
        li.className = 'chatRoom';
        li.addEventListener('click', e => {
          if (e.target.tagName === 'BUTTON') {
            exitChatRoom(chatRoom.seq);
          } else {
            enterChatRoom(chatRoom.seq);
          }
        });
        if (chatRoom.users.length === 1) {
          li.innerHTML = `
            <div class="chatRoom_first_section">
              <img
                class="chat_image"
                src="https://st3.depositphotos.com/4111759/13425/v/600/depositphotos_134255710-stock-illustration-avatar-vector-male-profile-gray.jpg"
              />
              <img
                class="chat_image"
                src="https://st3.depositphotos.com/4111759/13425/v/600/depositphotos_134255710-stock-illustration-avatar-vector-male-profile-gray.jpg"
              />
            </div>
            <div class="chatRoom_main_section">
              <div class="top">
                <div class="chatRoom_title">
                  <h5 id="title_${chatRoom.seq}">
                    ${
                      chatRoom.title ? chatRoom.title : chatRoom.users[0].name
                    }       
                  </h5>
                </div>
                <div class="chatRoom_person_count">
                  <h5>2</h5>
                </div>
              </div>
              <div class="bottom">
                <p id="chatRoomLastMessage_${chatRoom.seq}">
                  ${chatRoom?.messages[0]?.message}
                </p>
              </div>
            </div>
            <div class="chatRoom_last_section" id="chatRoomCount_${
              chatRoom.seq
            }">
              <p>
                ${chatRoom.notReadCount}
              </p>
            </div>
          `;
        } else {
          li.innerHTML = `
            <div class="chatRoom_first_section">
              <img
                class="chat_image"
                src="https://st3.depositphotos.com/4111759/13425/v/600/depositphotos_134255710-stock-illustration-avatar-vector-male-profile-gray.jpg"
              />
              <img
                class="chat_image"
                src="https://st3.depositphotos.com/4111759/13425/v/600/depositphotos_134255710-stock-illustration-avatar-vector-male-profile-gray.jpg"
              />
            </div>
            <div class="chatRoom_main_section">
              <div class="top">
                <div class="chatRoom_title">
                  <h5 id="title_${chatRoom.seq}">
                  ${
                    chatRoom.title
                      ? chatRoom.title
                      : me.name + '외 ' + chatRoom.users.length + '명'
                  }       
                  </h5>
                </div>
                <div class="chatRoom_person_count">
                  <h5>2</h5>
                </div>
              </div>
              <div class="bottom">
                <p id="chatRoomLastMessage_${chatRoom.seq}">
                ${
                  chatRoom && chatRoom.messages && chatRoom.messages[0]
                    ? chatRoom.messages[0].message
                    : ''
                }
                </p>
              </div>
            </div>
            <div class="chatRoom_last_section" id="chatRoomCount_${
              chatRoom.seq
            }">
              <p>
                ${chatRoom.notReadCount}
              </p>
              <button>나가기</button>
            </div>
          `;
        }

        roomList.appendChild(li);
      }
    }
  }

  const usersResponse = await axios.get(`${apiUrl}/users`, { headers });
  if (usersResponse.status === 200) {
    const userList = document.getElementById('friendList');
    const usersCount = document.getElementById('usersCount');

    if (usersResponse.data) {
      for (let user of usersResponse.data) {
        usersCount.innerHTML = `친구 ${usersResponse.data.length}`;
        if (user.seq === me.seq) {
          continue;
        } else {
          const li = document.createElement('li');
          li.innerHTML = `
            <img
              class="profile_image"
              src="https://st3.depositphotos.com/4111759/13425/v/600/depositphotos_134255710-stock-illustration-avatar-vector-male-profile-gray.jpg"
            />
            <h5>${user.name}</h5>
          `;
          li.addEventListener('click', () => {
            createChatRoom(user.seq);
          });
          userList.appendChild(li);
        }
      }
    }
  }
};

socket.on('messageForChatList', data => {
  const li = document.getElementById(`chatRoom_${data.message.chatRoom_seq}`);
  if (li) {
    const span = document.getElementById(
      `chatRoomCount_${data.message.chatRoom_seq}`,
    );
    const beforeCount = span.innerText;
    span.innerText = parseInt(beforeCount, 10) + 1;
    const lastMessagePtag = document.getElementById(
      `chatRoomLastMessage_${data.message.chatRoom_seq}`,
    );
    if (lastMessagePtag) {
      lastMessagePtag.innerHTML = data.message.message;
    }
  } else {
    socket.emit('getChatRoomRequest', {
      token: localStorage.getItem('token'),
      chatRoomSeq: data.message.chatRoom_seq,
    });
  }
});

socket.on('getChatRoomResponse', data => {
  const meIndex = data.users.findIndex(user => user.seq === me.seq);
  if (document.getElementById(`chatRoom_${data.seq}`)) {
    return;
  }

  if (meIndex >= 0) {
    data.users.splice(meIndex, 1);

    const li = document.createElement('li');
    li.id = `chatRoom_${data.seq}`;
    li.dataset.roomSeq = data.seq;
    if (data.users.length === 1) {
      li.innerHTML = `
        <span id="title_${data.seq}">
          ${data.title ? data.title : data.users[0].name}
        </span>
        <span id="chatRoomCount_${data.seq}">
          ${data.messages.length}
        </span>
        <button onclick="exitChatRoom('${data.seq}')">
          나가기
        </button>

        <p id="chatRoomLastMessage_${data.seq}">
          ${data.messages[0].message}
        </p>
      `;
    } else {
      li.innerHTML = `
        <span id="title_${data.seq}">
          ${
            data.title
              ? data.title
              : data.users[0].name + '외 ' + data.users.length + '명'
          }
        </span>
        <span id="chatRoomCount_${data.seq}">
          ${data.messages.length}
        </span>
        <button onclick="enterChatRoom('${data.seq}')">
          대화하기
        </button>
        <p id="chatRoomLastMessage_${data.seq}">
          ${data.messages[0].message}
        </p>
      `;
    }

    roomList.appendChild(li);
  }
});

socket.on('invitedFriend-createRoom', data => {
  const meIndex = data.users.findIndex(user => user.seq === me.seq);
  data.users.splice(meIndex, 1);
  const chatRoom = document.getElementById(`title_${data.seq}`);
  if (chatRoom) {
    chatRoom.innerHTML = `${
      data.title
        ? data.title
        : data.users[0].name + '외 ' + data.users.length + '명'
    }`;
  }
});

socket.on('exitChatRoomResponseForChatroomList', data => {
  const leavedUser = data.user;
  const chatRoomLi = document.getElementById(`chatRoom_${data.chatRoom.seq}`);
  if (chatRoomLi) {
    if (me.seq === leavedUser.seq) {
      chatRoomLi.remove();
    } else {
    }
  }
});

async function createChatRoom(userSeq) {
  const data = {
    userSeqs: [userSeq],
    token,
  };

  const response = await axios.post(`/chatRooms`, data);
  if (response.status === 200) {
    if (response.data) {
      window.location.href = `/chat.html?chatRoomSeq=${response.data.invitedRoomInfo.seq}`;
    }
  }
}

function enterChatRoom(chatRoomSeq) {
  window.location.href = `/chat.html?chatRoomSeq=${chatRoomSeq}`;
}

async function enterGroupChatRoom() {
  const userGroupCheckboxes = document.querySelectorAll('.userGroup');
  const userSeqs = [];
  for (let userGroupCheckbox of userGroupCheckboxes) {
    if (userGroupCheckbox.checked === true) {
      userSeqs.push(parseInt(userGroupCheckbox.value, 10));
    }
  }
  const data = {
    userSeqs,
    token,
  };

  const response = await axios.post(`/chatRooms`, data);
  if (response.status === 200) {
    if (response.data) {
      window.location.href = `/chat.html?chatRoomSeq=${response.data.invitedRoomInfo.seq}`;
    }
  }
}

function exitChatRoom(chatRoomSeq) {
  socket.emit('exitChatRoomRequest', {
    token: localStorage.getItem('token'),
    chatRoomSeq: chatRoomSeq.toString(),
  });
}

function tabChange(tabIndex) {
  tabs.forEach(function (node) {
    node.children[0].classList.remove('fas');
    node.children[0].classList.add('far');
    if (parseInt(node.dataset.tabindex, 10) === tabIndex) {
      node.children[0].classList.remove('far');
      node.children[0].classList.add('fas');
    }
  });

  tabMains.forEach(function (node) {
    node.classList.remove('active');
  });
  tabMains[tabIndex].classList.add('active');
}
