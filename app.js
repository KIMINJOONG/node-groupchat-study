const express = require('express');
const http = require('http');
const app = express();
const path = require("path");
const server = http.createServer(app);
const socketIo = require('socket.io');
const redisAdapter = require('socket.io-redis');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');
const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { default: axios } = require('axios');

// 파일업로드를 위한 multer 설정
const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, done) {
            done(null, 'temp');
        },  
        filename(req, file, done) {
            const ext = path.extname(file.originalname);
            const fileName = uuidv4(10);
            done(null, fileName + new Date().valueOf() + '.jpg'); // 파일명이 같더라도 업로드하는 시간을 넣어줌으로써 기존파일에 덮어씌우는것을 방지
        }
    }),
    limits: { fileSize: 20 * 1024 * 1024 }, //용량을 제한 현재 최대 20mb 해커들이 서버를 공격못하게 제한해주는게 좋다
});

const io = socketIo(server);
io.adapter(redisAdapter({ host: '218.38.52.223', port: 6379 }));

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src')));
app.use('/uploads', express.static('uploads'));
app.post('/messages/fileUpload', upload.array('files'), async(req, res) => {
    try {
        const srcs = [];
        for (let file of req.files) {
            const filename = await imageResize(file);
            srcs.push(filename);
        }
        const headers = {
            'Authorization' : req.headers.authorization
        };
        const data = {
            message: '파일업로드',
            srcs,
        }
        axios.post(`http://localhost:8000/api/messages/${req.body.chatRoomSeq}`, data, {headers}).then((response) => {
            return res.json(response.data);
        }).catch((error) => console.log('error : ', error));

        
    }catch(error) {
        console.log(error);
    }
});

function imageResize(file) {
    return new Promise((resolve, reject) => {
        sharp(file.path)
            .resize({width: 800})
            .withMetadata()
            .toFormat('jpg')
            .toFile(`uploads/${file.filename}`, (err, info) => {
                if(err) {
                    throw err
                } 
                
                fs.unlink(`temp/${file.filename}`, (error) => {
                    if(error) {
                        throw error;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
                    } 
                });
                return resolve(`uploads/${file.filename}`);
                
            });
    });
}

const botName = "ChatCord Bot";

io.on('connection', socket => {
    socket.on('joinRoom', ({chatRoomSeq, token}) => {
        socket.token = token;
        socket.chatRoomSeq = chatRoomSeq;
        axios.get(`http://127.0.0.1:8000/api/chatRooms/${chatRoomSeq}/getUsers`).then((response) => {
            console.log(typeof chatRoomSeq);
            socket.join("19");
            if(response.status === 200) {
                if(response.data) {
                    const headers = {
                        'Authorization' : `Bearer ${token}`
                    };
                    axios.get(`http://127.0.0.1:8000/api/chatRooms/${chatRoomSeq}/getMessages`, {headers}).then((getMessagesResponse) => {
                        if(getMessagesResponse.status === 200) {
                            if(getMessagesResponse.data) {
                                socket.emit('getMessagesHistory', {data: getMessagesResponse.data});
                                axios.post(`http://localhost:8000/api/chatRooms/${chatRoomSeq}/connect`, {}, {headers}).then((response) => {
                                });
                            }
                        }
                    }).catch((error) => console.log(error));
                    const result = response.data;

                    socket.emit('roomUsers', {
                        chatRoomSeq,
                        users: result
                    });
                    
                }
            }
            
        }).catch(error => console.log(error));
    });

    socket.on('chatMessage', ({message, token, chatRoomSeq}) => {
        const headers = {
            'Authorization' : `Bearer ${token}`
        };
        axios.post(`http://localhost:8000/api/messages/${chatRoomSeq}`, {message}, {headers}).then((response) => {
            if(response.status === 200) {
                io.to("19").emit('message', response.data);
            }
        }).catch(error => console.log(error));
    });

    socket.on('disconnect', () => {
        if(socket.token) {
            const headers = {
                'Authorization' : `Bearer ${socket.token}`
            };
            axios.post(`http://localhost:8000/api/chatRooms/${socket.chatRoomSeq}/disconnect`,{}, {headers}).then((response) => {

            }).catch((error) => {
                console.log('error :', error);
            });
        }
    });
    

    socket.on('uploadFinish', function (data){
        io.to(data.chatRoom_seq.toString()).emit('showUploadFiles', data);
    });

    socket.on('inviteFriends', function(data) {
        const { chatRoomSeq, userSeqs } = data;
        if(socket.token) {
            const headers = {
                'Authorization' : `Bearer ${socket.token}`
            };
            axios.post(`http://localhost:8000/api/chatRooms/${chatRoomSeq}/inviteFriends`, {userSeqs}, {headers}).then((response) => {
                if(response.status === 200) {
                    if(response.data) {
                        io.to(chatRoomSeq).emit('invitedFriends',response.data);
                    }
                }
                
            }).catch(error => console.log(error));
        }
        
    })
        
});



const PORT=5000;

server.listen(PORT, () => {
    console.log(`server is running ${PORT}`);
});