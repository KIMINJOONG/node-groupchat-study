const express = require('express');
const http = require('http');
const app = express();
const path = require("path");
const server = http.createServer(app);
const socketIo = require('socket.io');
const redisAdapter = require('socket.io-redis');
const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { default: axios } = require('axios');
require('dotenv').config();

aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region : 'ap-northeast-2'
});

const api = process.env.PRODUCTION ? process.env.REAL_API : process.env.DEV_API;
// 파일업로드를 위한 multer 설정
const s3 = new aws.S3();
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
    // storage: multerS3({
    //     s3,
    //     bucket: 'cybertoreal-test',
    //     destination(req, file, done) {
    //         done(null, 'temp');
    //     },  
    //     filename(req, file, done) {
    //         const ext = path.extname(file.originalname);
    //         const fileName = uuidv4(10);
    //         done(null, fileName + new Date().valueOf() + '.jpg'); // 파일명이 같더라도 업로드하는 시간을 넣어줌으로써 기존파일에 덮어씌우는것을 방지
    //     }
    // }),
    limits: { fileSize: 20 * 1024 * 1024 }, //용량을 제한 현재 최대 20mb 해커들이 서버를 공격못하게 제한해주는게 좋다
});

const io = socketIo(server);
io.adapter(redisAdapter({ host: process.env.REDIS_SERVER, port: 6379 }));

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src')));
app.use('/uploads', express.static('uploads'));

app.get('/apiUrl', (req, res) => {
    return res.json({url: process.env.PRODUCTION ? process.env.REAL_API : process.env.DEV_API});
});

app.post('/chatRooms', (req, res) => {
    const token = req.body.token;
    const userSeqs = req.body.userSeqs;
    const headers = {
        'Authorization' : `Bearer ${token}`
    };

    axios.post(`${api}/chatRooms`, {userSeqs}, {headers}).then((response) => {
        if(response.status === 200) {
            if(response.data) {
                io.emit('invitedFriend-createRoom', response.data);
                return res.json(response.data);
            }
        }
    });
});

app.post('/messages/fileUpload', upload.array('files'), async(req, res) => {
    try {
        const srcs = [];
        for (let file of req.files) {
            const filename = await imageResize(file, req.body.chatRoomSeq);
            srcs.push(filename);
        }
        const headers = {
            'Authorization' : req.headers.authorization
        };
        const data = {
            message: '파일업로드',
            srcs,
        }
        axios.post(`${api}/messages/${req.body.chatRoomSeq}`, data, {headers}).then((response) => {
            return res.json(response.data);
        }).catch((error) => console.log('error : ', error));
    }catch(error) {
        console.log(error);
    }
});

function imageResize(file, chatRoomSeq) {
    return new Promise((resolve, reject) => {
        sharp(file.path)
            .resize({width: 800})
            .withMetadata()
            .toFormat('jpg')
            // .toFile(`uploads/${file.filename}`, (err, info) => {
            //     if(err) {
            //         throw err
            //     } 
            // })
            .toBuffer(function(err, data) {
                s3.putObject({
                    Bucket: 'cybertoreal-test',
                    Key: `chatRooms/${chatRoomSeq}/messages/images/${file.filename}`,
                    ACL: 'public-read',
                    Body: data
                }).send(err => {
                    if(err) {
                        console.log(err);
                    } else {
                        fs.unlink(`temp/${file.filename}`, (error) => {
                            if(error) {
                                throw error;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
                            } 
                        });            
                        return resolve(`chatRooms/${chatRoomSeq}/messages/images/${file.filename}`);
                    }
                })
            });
            // });
    });
}

const botName = "ChatCord Bot";

io.on('connection', socket => {
    socket.on('joinRoom', ({chatRoomSeq, token}) => {
        socket.token = token;
        socket.chatRoomSeq = chatRoomSeq;
        axios.get(`${api}/chatRooms/${chatRoomSeq}/getUsers`).then((response) => {
            socket.join(chatRoomSeq);
            if(response.status === 200) {
                if(response.data) {
                    const headers = {
                        'Authorization' : `Bearer ${token}`
                    };
                    axios.get(`${api}/chatRooms/${chatRoomSeq}/getMessages`, {headers}).then((getMessagesResponse) => {
                        if(getMessagesResponse.status === 200) {
                            if(getMessagesResponse.data) {
                                socket.emit('getMessagesHistory', {data: getMessagesResponse.data});
                                axios.post(`${api}/chatRooms/${chatRoomSeq}/connect`, {}, {headers}).then((response) => {
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
        axios.post(`${api}/messages/${chatRoomSeq}`, {message}, {headers}).then((response) => {
            if(response.status === 200) {
                io.to(chatRoomSeq).emit('message', response.data);
                io.emit('messageForChatList', response.data);
            }
        }).catch(error => console.log(error));
    });

    socket.on('getChatRoomRequest', ({chatRoomSeq, token}) => {
        const headers = {
            'Authorization' : `Bearer ${token}`
        };
        axios.get(`${api}/chatRooms/${chatRoomSeq}`, {headers}).then((response) => {
            if(response.status === 200) {
                if(response.data) {
                    io.emit('getChatRoomResponse', response.data);
                }
            }
        });
    })

    socket.on('disconnect', () => {
        if(socket.token) {
            const headers = {
                'Authorization' : `Bearer ${socket.token}`
            };
            axios.post(`${api}/chatRooms/${socket.chatRoomSeq}/disconnect`,{}, {headers}).then((response) => {

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
            axios.post(`${api}/chatRooms/${chatRoomSeq}/inviteFriends`, {userSeqs}, {headers}).then((response) => {
                if(response.status === 200) {
                    if(response.data) {
                        io.to(chatRoomSeq).emit('invitedFriends',response.data);

                        axios.get(`${api}/chatRooms/${chatRoomSeq}`, {headers}).then((response) => {
                            if(response.status === 200) {
                                if(response.data) {
                                    io.emit('invitedFriend-createRoom', response.data);
                                }
                            }
                        });
                    }
                }
                
            }).catch(error => console.log(error));
        }
        
    });

    socket.on('chatRoom_message_read_update_request', function(data) {
        const {chatRoomSeq} = data;
        const headers = {
            'Authorization' : `Bearer ${socket.token}`
        };
        axios.get(`${api}/chatRooms/${chatRoomSeq}/getMessages?isChatRoomMessageReadUpdate=1`, {headers}).then((getMessagesResponse) => {
            if(getMessagesResponse.status === 200) {
                if(getMessagesResponse.data) {
                    io.to(chatRoomSeq).emit('chatRoom_message_read_update', getMessagesResponse.data);
                    axios.post(`${api}/chatRooms/${chatRoomSeq}/connect`, {}, {headers}).then((response) => {
                    });
                }
            }
        }).catch((error) => console.log(error));
    });
        
});



const PORT=5000;

server.listen(PORT, () => {
    console.log(`server is running ${PORT}`);
});