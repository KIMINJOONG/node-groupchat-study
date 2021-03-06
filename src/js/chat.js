'use strict';

const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const fileInput = document.getElementById('fileUploadInput');
const invitedFriendBtn = document.getElementById('invite-friend-btn');

let me = {};
let chatRooms = [];
let apiUrl = '';
const token = localStorage.getItem('token');
const headers = {
  Authorization: `Bearer ${token}`,
};

const { chatRoomSeq } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

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
    }
  }
};

// 모달
const openButton = document.getElementById('invite-friend-btn');
const modal = document.querySelector('.modal');
const overlay = modal.querySelector('.md_overlay');

//동작함수
const openModal = async () => {
  const userList = document.getElementById('userList');
  modal.classList.remove('hidden');
  const token = localStorage.getItem('token');
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const usersResponse = await axios.get(`${apiUrl}/users`, { headers });
  if (usersResponse.status === 200) {
    if (usersResponse.data) {
      for (let user of usersResponse.data) {
        const li = document.createElement('li');
        if (user.seq === me.seq) {
          // li.innerHTML = `<span>${user.name} (${user.email}) (나)</span>`;
        } else {
          li.innerHTML = `<span>${user.name} (${user.email})</span><input type="checkbox" class="checkboxInput" value=${user.seq}>`;
        }
        userList.appendChild(li);
      }
    }
  }
};

function inviteFriends() {
  const token = localStorage.getItem('token');
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const checkboxInputs = document.querySelectorAll('.checkboxInput');
  const userSeqs = [];
  for (const checkboxInput of checkboxInputs) {
    if (checkboxInput.checked === true) {
      userSeqs.push(parseInt(checkboxInput.value, 10));
    }
  }
  const data = {
    chatRoomSeq,
    userSeqs,
  };

  socket.emit('inviteFriends', data);
  modal.classList.add('hidden');
}
//클릭 이벤트
openButton.addEventListener('click', openModal);

socket.emit('joinRoom', { chatRoomSeq, token: localStorage.getItem('token') });

socket.on('getMessagesHistory', ({ data }) => {
  for (let message of data.messages.reverse()) {
    outputFromServerMessage(message, data.users);
  }
  chatMessages.scrollTop = chatMessages.scrollHeight;
  socket.emit('chatRoom_message_read_update_request', {
    token: localStorage.getItem('token'),
    chatRoomSeq,
  });
});

socket.on('chatRoom_message_read_update', data => {
  // 채팅방 실시간 읽음 처리 숫자 제거
  const messageContents = document.querySelectorAll('.messageContent > span');
  for (let messageContent of messageContents) {
    for (let message of data.messages) {
      if (
        messageContent.dataset.messageseq &&
        parseInt(messageContent.dataset.messageseq, 10) === message.seq
      ) {
        messageContent.innerText = data.users.length - message.readUsers.length;
      }
    }
  }
});

socket.on('roomUsers', ({ chatRoomSeq, users }) => {
  outputRoomName(chatRoomSeq);
  outputUsers(users);
});

socket.on('message', message => {
  outputMessage(message.message, message.userChatRoomsCount);

  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('showUploadFiles', data => {
  const div = document.createElement('div');
  div.classList.add('message');
  div.innerHTML = `
        <img src="${data.message_files[0].fullPath}" style="width: 100%; height: 100%; object-fit: cover;" />
    `;
  document.querySelector('.chat-messages').appendChild(div);

  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('invitedFriends', data => {
  if (data.invitedRoomInfo) {
    window.location.href = `http://localhost:5000/chat.html?chatRoomSeq=${data.invitedRoomInfo.seq}`;
  } else {
    outputUsers(data.invited);
    const invitedName = [];
    for (let user of data.invited) {
      invitedName.push(user.name);
    }
    const message = {
      name: '봇',
      message: `${data.invitor.name}님이 ${invitedName.join(
        ',',
      )}님을 초대하셨습니다.`,
    };
    outputMessage(message);
  }
});

socket.on('exitChatRoomResponse', data => {
  const userListLis = userList.children;
  for (let userLi of userListLis) {
    const liTextContent = userLi.textContent;
    if (liTextContent === data.user.name) {
      userLi.remove();
    }
  }
  const message = {
    name: '채팅봇',
    message: data.msg.message,
  };
  outputMessage(message);
});

chatForm.addEventListener('submit', e => {
  e.preventDefault();

  const msg = e.target.elements.msg.value;
  socket.emit('chatMessage', {
    message: msg,
    token: localStorage.getItem('token'),
    chatRoomSeq,
  });

  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});

function outputMessage(message, userChatRoomsCount = -1) {
  let time = '';
  if (message.regdate) {
    time = convert12H(message.regdate);
  }
  const div = document.createElement('div');
  div.classList.add('message');
  div.innerHTML = `
        <p class="meta">
          ${message.user ? message.user.name : message.name} 
          ${time && `<span> ${time}</span>`}
        </p>
        <p class="text messageContent" style="display: flex; justify-content: space-between">
        ${message.message} 
        ${
          userChatRoomsCount !== -1
            ? `<span data-messageSeq=${message.seq}>${
                userChatRoomsCount - message.readUsers.length
              }</span>`
            : ''
        }</p>
    `;
  document.querySelector('.chat-messages').appendChild(div);
}

function outputFromServerMessage(message, users) {
  let time = convert12H(message.regdate);
  const div = document.createElement('div');
  div.classList.add('message');

  let innerHTML = '';

  if (message.user) {
    innerHTML = `<p class="meta">${message.user.name} <span>${time}</span></p>
    <p class="text messageContent" style="display: flex; justify-content: space-between">${
      message.message
    } <span data-messageSeq=${message.seq}>${
      users.length - message.readUsers.length
    }</span></p>`;
  } else {
    if (message.user_seq === -1) {
      innerHTML = `<p class="meta">채팅봇 <span>${time}</span></p>
      <p class="text messageContent" style="display: flex; justify-content: space-between">${message.message}</p>`;
    }
  }

  if (message.message_files && message.message_files.length > 0) {
    innerHTML += `<img src="${message.message_files[0].fullPath}" style="width: 100%; height: 100%; object-fit: cover;" />`;
  }

  div.innerHTML = innerHTML;
  document.querySelector('.chat-messages').appendChild(div);
}

function outputRoomName(chatRoomSeq) {
  roomName.innerText = chatRoomSeq;
}

function outputUsers(users) {
  users.map(user => {
    const li = document.createElement('li');
    li.innerText = user.name;
    userList.insertBefore(li, null);
  });
}

document.getElementById('leave-btn').addEventListener('click', () => {
  const leaveRoom = confirm('정말로 채팅방을 나가시겠습니까?');
  if (leaveRoom) {
    window.location = '../index.html';
  } else {
  }
});

function convert12H(regdate) {
  let time = regdate.substr(11, 16);
  let getTime = time.substr(0, 2);
  let getMinute = time.substr(2, 3);
  let timeString = '';
  getTime = parseInt(getTime, 10);
  if (getTime < 12) {
    timeString = '오전';
  } else {
    timeString = '오후';
  }

  if (getTime > 12) {
    getTime = getTime % 12;
  }

  time = `${timeString} ${getTime}${getMinute}`;
  return time;
}

fileInput.addEventListener('change', startUpload);

async function startUpload(e) {
  if (document.getElementById('fileUploadInput').value !== '') {
    const formData = new FormData();
    formData.append('chatRoomSeq', chatRoomSeq);
    [].forEach.call(e.target.files, f => {
      formData.append('files', f);
    });

    const headers = {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    };

    const response = await axios.post('/messages/fileUpload', formData, {
      headers,
    });
    socket.emit('uploadFinish', response.data);
  } else {
    alert('파일을 올려주세요');
  }
}
