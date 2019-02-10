import { SolidSession } from './../models/solid-session.model';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Services
import { AuthService } from '../services/solid.auth.service';
import { RdfService } from '../services/rdf.service';
import { SolidProfile } from '../models/solid-profile.model';
import { PodHandlerService } from '../services/pod-handler.service';
import * as utils from '../utils/utililties';

declare let solid: any;


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  profile: SolidProfile;
  loadingProfile: Boolean;
  profileImage: string;
  session: SolidSession;
  profileId: string;
  webId: string
  //friends = ['Ramin', 'Samuel', 'Zahra'];
  existingWorkspaces = ['general', 'survey', 'credentials'];
  friends=[]
  messagesList:{}[]=[]
  activeWorkSpace: string
  activeChatStoreFile: any
  activeIndexFile: any

  constructor(private auth: AuthService,
              private route: ActivatedRoute,
              private rdf: RdfService,
              private podhandler: PodHandlerService) {}

  ngOnInit() {
    this.loadProfile(this.getAvailableWorkspaces);
    
  }

  async loadProfile(callBackFn) {
    try {
      this.loadingProfile = true;
      this.session =  await solid.auth.currentSession();
      this.profileId = this.session.webId;
      console.log(this.profileId)
      this.webId = this.profileId.split('/profile')[0];

      const profile = await this.rdf.getProfile(this.profileId);
         
      if (profile) {
      this.profile = profile;
        this.auth.saveOldUserData(profile); 
          
        // LoadFriends
        for (let f=0; f<profile.friends.length; f++){
         let friendProfile = await this.rdf.getProfile(profile.friends[f])
          this.friends.push(friendProfile)
        }
      }

      this.loadingProfile = false;
      this.setupProfileData()
      callBackFn()
    } catch (error) {
      console.log(`Error: ${error}`);
    }

  }

  private setupProfileData() {
    if (this.profile) {
      this.profileImage = this.profile.image ? this.profile.image : '/assets/images/profile.png';
    } else {
      this.profileImage = '/assets/images/profile.png';
    }
  }

  logout() {
    this.auth.solidSignOut();
  }

 setActiveWS=async (wkspace:string)=>{
    this.activeWorkSpace = wkspace
    console.log(this.activeWorkSpace)
   this.activeChatStoreFile = this.podhandler.getChatDocument(wkspace)
   this.activeIndexFile = this.podhandler.getIndexfile(wkspace);
    this.syncMessages()
 }

 send=async(msg:string)=>{
   let that = this
   console.log(msg)
     this.podhandler.sendMessage(this.activeIndexFile,this.activeChatStoreFile,msg).then(_=>{
      that.syncMessages()
     }
     
    )
   
 }

 
syncMessages= ()=> {

// get references to the index.ttl and chat.ttl files and load to store
let that = this
 Promise.all([ this.podhandler.loadResource(this.activeIndexFile),
  this.podhandler.loadResource(this.activeChatStoreFile)])
  .then(_=>{
  
    let subject = this.podhandler.store.sym(this.activeIndexFile)
 let chatDoc = this.podhandler.store.sym(this.activeChatStoreFile).doc()
 // Subscribe to receive changes
this.subscribe(chatDoc,this.syncMessages)
this.subscribe(subject.doc(),this.syncMessages)


  var messages = this.podhandler.store.statementsMatching(
    subject, this.podhandler.ns.wf('message'), null,chatDoc).map(st => { return st.object })
 

  messages =messages.map((m)=> {

  let msg =  this.podhandler.store.any(
      m,this.podhandler.ns.sioc('content'), null,chatDoc)
       let stored = {}
  
    stored['uri'] = m
   stored['msg'] = msg.value
   return stored
  
  })

  this.messagesList = messages;

   console.log(this.messagesList)
}, (err)=> {
    // error occurred
});

}

 getAvailableWorkspaces = async() => {
   let storageSpace=this.webId+"/public/"
  await this.podhandler.getListWorkSpaces(storageSpace)
  .then( value => {
    if(typeof value === "object") {
      this.existingWorkspaces = value.folders
    }
       
   // do something with the workspaces
     console.log("Workspaces: "+JSON.stringify(value))
  })
     
 }

 parseMessages=()=>{

 }

  subscribe =(doc,refreshFunction)=>{
  this.podhandler.updater.addDownstreamChangeListener(doc, refreshFunction)
 }

}
