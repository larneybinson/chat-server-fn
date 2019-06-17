import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
    private url = 'http://192.168.0.110:4545';
    private socket;

    constructor() { 
    }

    private getToken(){
      let token:any = sessionStorage.getItem('token');
      token = JSON.parse(token);
      return token;
    }

    public initiateSocket(callback){
      var token = this.getToken();

      try
      {
        this.socket = io(this.url+"?token="+token.token)
        console.log("Successfully created socket connection: ",this.socket);
        callback("success");
      }
      catch(err){
        console.log("Error occured while creating socket connection: ",err);
        callback("error");
      }

    }

    public newChat(userNames,name,callback){
      
      this.socket.emit('chat',{name:name,user_names:userNames},(response)=>{
        callback(response);
      });
    }

    public newMessage(text,chat_id){

      this.socket.emit('message',{text:text,chat_id:chat_id},(response)=>{
        console.log(response);
      });
    }

    public getMessage = () => {
      return Observable.create((observer) => {
          this.socket.on('new_message', (obj) => {
              observer.next(obj);
          });
      });
    }

    public getNewChat = () => {
      return Observable.create((observer) => {
          this.socket.on('new_chat', (obj) => {
              observer.next(obj);
          });
      });
    }

    public getOnlineUsers = () => {
      return Observable.create((observer) => {
          this.socket.on('currentusers', (obj) => {
              observer.next(obj);
          });
      });
    }

}
