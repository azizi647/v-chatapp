import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import MediaHandler from '../MediaHandler';
import Pusher from 'pusher-js';
import Peer from 'simple-peer';

const APP_KEY = 'd982143261a3990630af';

export default class App extends Component {

    constructor(){
        super();

        this.state = {
            hasMedia: false,
            otherUserId: null
        };

        this.user = window.user;
        this.usersData = window.usersData;
        this.user.stream = null;
        this.peers = {};
        
        this.mediaHandler = new MediaHandler();
        this.setupPusher();

        this.callTo = this.callTo.bind(this);
        this.setupPusher = this.setupPusher.bind(this);
        this.startPeer = this.startPeer.bind(this);
    }

    componentWillMount() {
        this.mediaHandler.getPermissions()
        .then((stream) => {
            this.setState({hasMedia: true});
            this.user.stream = stream;

            try{
                // yeni versiyalar destekleyir streami bu cur tutmaqi
                this.myVideo.srcObject = stream;
            } catch(e) {
                // depricated edilib | eger kohne browserse catch ile bu hisseden oxuyacaq streami
                this.myVideo.src = URL.createObjectURL(stream);
            }

            this.myVideo.play();
        })
    }

    setupPusher() {
        Pusher.logToConsole = true;
        this.pusher = new Pusher(APP_KEY, {
            authEndpoint: '/pusher/auth',
            cluster: 'eu',
            auth: {
                params: this.user.id,
                forceTLS: true,
                headers: {
                    'X-CSRF-Token': window.csrfToken
                }
            }
        });

        this.channel = this.pusher.subscribe('presence-video-channel');

        this.channel.bind(`client-signal-${this.user.id}`, (signal) => {
            let peer = this.peers[signal.userId];

            // eger peer movcud deyilse biz incomming call edirik
            if(peer===undefined){
                this.setState({otherUserId: signal.userId});
                peer = this.startPeer(signal.userId, false);
            }

            peer.signal(signal.data);
        });

    }

    startPeer(userId, initiator=true) {
        const peer = new Peer({
            initiator: initiator,
            stream: this.user.stream,
            trickle: false
        });

        peer.on('signal', (data) => {
            this.channel.trigger(`client-signal-${userId}`, {
                type: 'signal',
                userId: this.user.id,
                data: data
            }); 
        });

        peer.on('stream', (stream) => {
            try {
                this.userVideo.srcObject = stream;
            } catch (e) {
                this.userVideo.src = URL.createObjectURL(stream);
            }

            this.userVideo.play();
        });

        peer.on('close', () => {
            let peer = this.peers[userId];
            if(peer !== undefined){
                peer.destroy();
            }

            this.peers[userId] = undefined;
        });

        return peer;
    }

    callTo(userId) {
        this.peers[userId] = this.startPeer(userId); 
    }

    render() {
        return (
            <div className="App">

                {usersData.map((userId) => {
                    return this.user.id !== userId.id ? <button onClick={() => this.callTo(userId.id)} key={userId.id}> V-call {userId.name} </button> : null ;
                })}

                <div className="video-container">
                    <video className="my-video" ref={(ref) => {this.myVideo = ref;}}></video>
                    <video className="user-video" ref={(ref) => {this.userVideo = ref;}}></video>
                </div>
            </div>
        );
    }
}

if (document.getElementById('app')) {
    ReactDOM.render(<App />, document.getElementById('app'));
}
