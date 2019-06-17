import { Component } from '@angular/core';
import { ChatService } from './chat.service';
import { HttpClient,HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title="Messenger"
  constructor(private chatService:ChatService,private httpClient:HttpClient){
  }

  ngOnInit(){
    let token = sessionStorage.getItem('token');
    
    if(typeof(token)!="undefined" && token.length>0){
      this.tokenData=JSON.parse(token);
      this.isLoggedIn=true;
      this.bindToSubscribers();
      this.getUsers();
      this.getChats();
    }
  }

  private apiUrl='http://192.168.0.110:4545';
  private isLoggedIn=false;
  private showCreateGroup=false;

  private isGoodResponse(response:any){
    return response.meta.code == 3000;
  }

  private createHeaders(){
    return new  HttpHeaders().set("authorization", this.tokenData.token);
  }

  public user_name='';
  private message:string;
  private messageList=[];
  private currentUsers=[];
  private chats=[];
  private allUsers=[];
  private open_chat="No Chat Available";
  private current_chat:any;
  
  private tokenData={token:'',user_id:'',created:0,user_name:''};
  private new_chat_name='';
  private selectedMembers = []

  login(){

    if(this.user_name.length==0){
      alert('user_name is required');
      return;
    }


    this.httpClient.post(this.apiUrl+'/login',{user_name:this.user_name}).toPromise()
    .then((response:any)=>{

      console.log(JSON.stringify(response));

      if(this.isGoodResponse(response)){
        this.tokenData=response.data;
        sessionStorage.setItem('token',JSON.stringify(response.data));
        this.isLoggedIn=true;

        console.log(this.tokenData,this.isLoggedIn);

        this.bindToSubscribers();
      }

    })
    .catch(function(err){
      console.log(err);
      alert('some error occurred');
    });

  }

  getChats(){
    this.httpClient.get(this.apiUrl+'/chats',{headers:this.createHeaders()}).toPromise()
    .then((response:any)=>{

      if(this.isGoodResponse(response)){

        this.chats=response.data;

        if(this.open_chat=="No Chat Available"){

          if(this.chats.length>0){
            this.openChat(0);
          }
          
        }

      }

    })
    .catch(function(err){
      alert('some error occurred');
    });
  }

  sendMessage() {

    if(this.message.length==0){
      return;
    }

    this.chatService.newMessage(this.message,this.current_chat.chat_id);
    this.message = '';
  }

  getUsers(){
    this.httpClient.get(this.apiUrl+'/users',{headers:this.createHeaders()}).toPromise()
    .then((response:any)=>{

      if(this.isGoodResponse(response)){
        this.allUsers=response.data;
        console.log('User: ',this.allUsers);
      }

    })
    .catch((err)=>{
      alert('some error occurred');
    });

  }

  newGroupTab(){
    this.showCreateGroup = !this.showCreateGroup;

    if(!this.showCreateGroup){
      this.selectedMembers=[];
    }
  }

  addUserToSelect(user_name){
    console.log(user_name);
    if(!this.selectedMembers.includes(user_name)){
      this.selectedMembers.push(user_name);
    }else{
      this.selectedMembers = this.selectedMembers.filter((name)=>{return name == user_name});
    }

  }

  createChat(){


    if(this.selectedMembers.length>1){

      if(this.new_chat_name.length==0){
        alert('Please enter a name for group chat');
        return;
      }

    }else if(this.selectedMembers.length==1){

      if(this.new_chat_name.length==0){
        this.new_chat_name = this.selectedMembers[0];
      }

    }else{
      alert('Please select atleast one user');
      return;
    }

    this.chatService.newChat(this.selectedMembers,this.new_chat_name,(response)=>{

      if(this.isGoodResponse(response)){
        console.log("Created chat");
        this.newGroupTab();
      }else{
        alert('some error occurred');
      }

    });
  }

  openChat(id){
    this.httpClient.get(this.apiUrl+"/messages/"+this.chats[id].chat_id,{headers:this.createHeaders()}).toPromise()
    .then((response:any)=>{

      if(this.isGoodResponse(response)){
        console.log("Fetched messages",response.data);
        this.messageList=response.data;
        this.current_chat = this.chats[id];
        this.open_chat = this.current_chat.name;
      }

    })
    .catch((err)=>{
      alert('some error occurred');
    })
  }

  bindToSubscribers() {

    this.chatService.initiateSocket((response)=>{

      console.log('Response after initiating sockets: ',response);

      if(response=="error"){
        return;
      }

      this.chatService
      .getMessage()
      .subscribe((obj: any) => {

        if(this.chats.filter((obj1)=>{
          return obj1.chat_id==this.current_chat.chat_id;
        }).length>0){
          this.messageList.reverse();
          this.messageList.push(obj.data);
          this.messageList.reverse();
          console.log("Messages: ",this.messageList);
        }

      });

    this.chatService
      .getNewChat()
      .subscribe((obj: any) => {
      
        console.log("Got a new chat",obj);
        if(obj.data.members.includes(this.tokenData.user_id)){
          this.getChats();
        }

      });

    this.chatService
      .getOnlineUsers()
      .subscribe((obj: any) => {
        console.log("Updated current users",obj);
        this.currentUsers = obj.currentUsers.filter((user)=>{return user!=this.tokenData.user_name});
      });
    });
  }

}
