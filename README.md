## 소켓통신

### 채팅방 리스트

| Front(emit) -> Server(on) | Server(emit) -> Front(on)                                                   | 설명                               |
| ------------------------- | --------------------------------------------------------------------------- | ---------------------------------- |
| exitChatRoomRequest       | exitChatRoomResponseForChatroomList(전체)<br/> exitChatRoomResponse(채팅방) | 채팅룸에서 특정 채팅방을 나감      |
| getChatRoomRequest        | getChatRoomResponse(전체)                                                   | 특정 채팅방에 대한 데이터를 가져옴 |

### 채팅방

| Front(emit) -> Server(on)            | Server(emit) -> Front(on)                                    | 설명                            |
| ------------------------------------ | ------------------------------------------------------------ | ------------------------------- |
| inviteFriends                        | invitedFriends<br /> invitedFriend-createRoom(채팅방 리스트) | 채팅방에서 친구를 초대함        |
| joinRoom                             | getMessagesHistory <br /> roomUsers                          | 채팅방에 들어옴                 |
| chatRoom_message_read_update_request | chatRoom_message_read_update                                 | 채팅방 메세지 읽음처리          |
| chatMessage                          | message<br /> messageForChatList(채팅방)                     | 메세지 전송                     |
| uploadFinish                         | showUploadFiles                                              | 파일 업로드 완료 후 실시간 처리 |
